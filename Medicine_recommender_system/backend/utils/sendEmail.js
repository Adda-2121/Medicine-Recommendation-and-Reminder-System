const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  // ── Development fallback: log to console if SMTP is not configured ──────────
  if (!host || !user || !pass) {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║           📧  EMAIL (DEV MODE — NOT SENT)    ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  To:      ${options.email}`);
    console.log(`║  Subject: ${options.subject}`);
    console.log('║  Message:');
    console.log(options.message.split('\n').map(l => `║    ${l}`).join('\n'));
    console.log('╚══════════════════════════════════════════════╝\n');
    console.warn('[sendEmail] SMTP not configured. Set SMTP_HOST, SMTP_EMAIL, SMTP_PASSWORD in .env to send real emails.');
    return;
  }

  // ── Real send ────────────────────────────────────────────────────────────────
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for port 465 (SSL), false for 587 (TLS/STARTTLS)
    auth: { user, pass },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'HealthConnect'} <${process.env.FROM_EMAIL || user}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || undefined,
  };

  const info = await transporter.sendMail(message);
  console.log(`[sendEmail] Message sent: ${info.messageId}`);
};

module.exports = sendEmail;
