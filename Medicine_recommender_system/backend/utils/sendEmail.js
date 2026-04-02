const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io', // Default generic host
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_EMAIL || 'user',
      pass: process.env.SMTP_PASSWORD || 'password',
    },
  });

  // Define the email options
  const message = {
    from: `${process.env.FROM_NAME || 'HealthConnect'} <${process.env.FROM_EMAIL || 'noreply@healthconnect.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // Skip sending if we don't have real credentials, but log it
  if (!process.env.SMTP_HOST) {
      console.log('--- EMAIL MOCK ---');
      console.log('To:', options.email);
      console.log('Subject:', options.subject);
      console.log('Message:\n', options.message);
      console.log('------------------');
      return;
  }

  // Send the email
  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
