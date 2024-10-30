// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;  // Plaintext password from env
const JWT_SECRET = process.env.JWT_SECRET;

// Hash password on server startup
let adminPasswordHash;
bcrypt.hash(ADMIN_PASSWORD, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password on startup:', err);
  } else {
    adminPasswordHash = hash;  // Store the hashed password in memory
  }
});

// Admin Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if username matches
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare entered password with hashed version
    const isMatch = await bcrypt.compare(password, adminPasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ username: ADMIN_USERNAME }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
