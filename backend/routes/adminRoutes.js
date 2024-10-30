const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Business = require('../models/Business');
const authenticateToken = require('../middleware/authMiddleware');
const upload = multer({
    dest: path.join(__dirname, '../uploads/'),
    limits: { fileSize: 70 * 1024 * 1024 }, // 70MB file size limit
  });
  
  router.post('/businesses/create', authenticateToken, upload.fields([{ name: 'logo' }, { name: 'backgroundImage' }]), async (req, res) => {
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
        const businessImagesDir = path.join(__dirname, '../../feedback-app-client/src/assets/business-images/', subdomain);
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
    } catch (error) {
        console.error('Error creating business:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create a new business and create directory for images
router.post('/businesses', authenticateToken, async (req, res) => {
    try {
      const { name, subdomain, googleReviewLink, yelpReviewLink, email, description } = req.body;
  
      // Check for duplicate subdomain
      const existingBusiness = await Business.findOne({ where: { subdomain } });
      if (existingBusiness) {
        return res.status(400).json({ error: 'Business with this subdomain already exists' });
      }
  
      // Create the business entry in the database
      const newBusiness = await Business.create({
        name,
        subdomain,
        googleReviewLink,
        yelpReviewLink,
        email,
        description,
      });
  
      // Create directory for the new business's images
      const businessPath = path.join(BUSINESS_IMAGES_DIR, subdomain);
      if (!fs.existsSync(businessPath)) {
        fs.mkdirSync(businessPath, { recursive: true });
      }
  
      res.status(201).json(newBusiness);
    } catch (error) {
      console.error('Error creating business:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Upload images (logo and background image)
router.post('/businesses/:businessName/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
      const businessName = req.params.businessName;
      const type = req.body.type;
  
      if (!type || (type !== 'logo' && type !== 'background')) {
        return res.status(400).json({ error: 'Invalid image type specified' });
      }
  
      const dir = path.join(__dirname, '..', 'assets', 'business-images', businessName);
      const filename = type === 'logo' ? 'logo.png' : 'image.png';
      const filePath = path.join(dir, filename);
  
      // Delete the old file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
  
      // Save the new image
      res.json({ message: `${type} image uploaded successfully` });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

module.exports = router;
