// routes/sendReview.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

router.post('/send-review', async (req, res) => {
  const { to, subject, body } = req.body;

  try {
    let transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false, // Use TLS
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });

    let mailOptions = {
      from: SMTP_USER,
      to: to, // Send email to the business email address
      subject: subject,
      text: body,
    };

    // Send email
    let info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    res.status(200).json({ message: 'Review sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;
