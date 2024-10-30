require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const businessRoutes = require('./routes/businessRoutes');
const cors = require('cors');
const nodemailer = require('nodemailer');
const sendReviewRoutes = require('./routes/sendReview');

const app = express();
const PORT = process.env.PORT || 5008;

// Middleware setup
app.use(cors({
    origin: 'http://localhost:4200', // Allow requests from the frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}));
app.use(bodyParser.json());
app.use('/api/businesses', businessRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/send-review', sendReviewRoutes);

// Create a reusable transporter using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for port 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;

  
  

// Send email route
app.post('/api/send-review', async (req, res) => {
    const { to, subject, body } = req.body;
  
    try {
      const info = await transporter.sendMail({
        from: `"Feedback App" <${process.env.SMTP_USER}>`, // sender address
        to, // list of receivers
        subject, // Subject line
        text: body, // plain text body
      });
  
      console.log(`Email sent: ${info.messageId}`);
      res.status(200).json({ message: 'Review sent successfully' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  


// Sync with the database and start the server
sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database synced');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error syncing database:', error);
    });

sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
