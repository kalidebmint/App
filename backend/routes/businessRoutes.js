const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Business = require('../models/Business');
const authenticateToken = require('../middleware/authMiddleware');
const { exec } = require('child_process'); 

// Define business images directory
const BUSINESS_IMAGES_DIR = path.join(__dirname, '../../feedback-app-client/src/assets/business-images/');

// Configure multer to use a temporary uploads directory
const upload = multer({
    dest: path.join(__dirname, '../uploads/'),
    limits: { fileSize: 70 * 1024 * 1024 }, // 70MB file size limit
  });

// Create a new business
router.post('/create', authenticateToken, upload.fields([{ name: 'logo' }, { name: 'backgroundImage' }]), async (req, res) => {
    try {
        const { name, subdomain, googleReviewLink, yelpReviewLink, email, description } = req.body;

        // Basic validation
        if (!name || !subdomain) {
            return res.status(400).json({ error: 'Name and subdomain are required fields' });
        }

        // Check for duplicate subdomain
        const existingBusiness = await Business.findOne({ where: { subdomain } });
        if (existingBusiness) {
            return res.status(400).json({ error: 'Business with this subdomain already exists' });
        }

        // Save the new business to the database
        const newBusiness = await Business.create({
            name,
            subdomain,
            googleReviewLink,
            yelpReviewLink,
            email,
            description,
        });

        // Move the uploaded files to the correct destination
        const businessImagesDir = path.join(BUSINESS_IMAGES_DIR, name);
        if (!fs.existsSync(businessImagesDir)) {
            fs.mkdirSync(businessImagesDir, { recursive: true });
        }

        // Save the uploaded logo
        if (req.files.logo) {
            const logoFilePath = path.join(businessImagesDir, 'logo.png');
            fs.renameSync(req.files.logo[0].path, logoFilePath);
        }

        // Save the uploaded background image
        if (req.files.backgroundImage) {
            const backgroundFilePath = path.join(businessImagesDir, 'image.png');
            fs.renameSync(req.files.backgroundImage[0].path, backgroundFilePath);
        }

        res.status(201).json(newBusiness);

        // Automatically trigger ng build (after sending the response)
        exec('ng build', { cwd: path.join(__dirname, '../../feedback-app-client') }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error during ng build: ${error.message}`);
                return;
            }
            console.log(`Build stdout: ${stdout}`);
            console.error(`Build stderr: ${stderr}`);
        });

    } catch (error) {
        console.error('Error creating business:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all businesses
router.get('/', async (req, res) => {
    try {
        const businesses = await Business.findAll();
        res.json(businesses);
    } catch (error) {
        console.error('Error fetching businesses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific business by subdomain
router.get('/subdomain/:subdomain', async (req, res) => {
    try {
        const business = await Business.findOne({ where: { subdomain: req.params.subdomain } });
        if (business) {
            res.json({
                name: business.name,
                email: business.email,
                description: business.description,
                googleReviewLink: business.googleReviewLink,
                yelpReviewLink: business.yelpReviewLink,
            });
        } else {
            res.status(404).json({ message: 'Business not found' });
        }
    } catch (error) {
        console.error('Error fetching business:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update an existing business
router.put('/:subdomain', authenticateToken, upload.fields([{ name: 'logo' }, { name: 'backgroundImage' }]), async (req, res) => {
    try {
      const { name, googleReviewLink, yelpReviewLink, email, description } = req.body;
      const { subdomain } = req.params;
  
      // Find the business by subdomain
      const business = await Business.findOne({ where: { subdomain } });
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }
  
      // Update business information
      await business.update({
        name,
        googleReviewLink,
        yelpReviewLink,
        email,
        description,
      });
  
      // Create directory for storing business images if it doesn't exist
      const businessImagesDir = path.join(BUSINESS_IMAGES_DIR, subdomain);
      if (!fs.existsSync(businessImagesDir)) {
        fs.mkdirSync(businessImagesDir, { recursive: true });
      }
  
      // Update the uploaded logo file, if present
      if (req.files.logo) {
        const logoFilePath = path.join(businessImagesDir, 'logo.png');
        if (fs.existsSync(logoFilePath)) {
          fs.unlinkSync(logoFilePath); // Delete old logo
        }
        fs.renameSync(req.files.logo[0].path, logoFilePath);
      }
  
      // Update the uploaded background image, if present
      if (req.files.backgroundImage) {
        const backgroundFilePath = path.join(businessImagesDir, 'image.png');
        if (fs.existsSync(backgroundFilePath)) {
          fs.unlinkSync(backgroundFilePath); // Delete old background image
        }
        fs.renameSync(req.files.backgroundImage[0].path, backgroundFilePath);
      }
  
      res.json({ message: 'Business updated successfully', business });
    } catch (error) {
      console.error('Error updating business:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  // Delete a business along with its images
  router.delete('/:subdomain', authenticateToken, async (req, res) => {
    try {
        const subdomain = req.params.subdomain;

        // Find the business by subdomain
        const business = await Business.findOne({ where: { subdomain } });
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Delete the business from the database
        await business.destroy();

        // Delete the directory with images (find directory by business name)
        const businessImagesDir = path.join(BUSINESS_IMAGES_DIR, business.name);
        if (fs.existsSync(businessImagesDir)) {
            fs.rmSync(businessImagesDir, { recursive: true, force: true });
        }

        res.json({ message: 'Business deleted successfully' });
    } catch (error) {
        console.error('Error deleting business:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
  

module.exports = router;
