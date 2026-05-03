const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SYSTEM_MAIL_ID,
    pass: process.env.SYSTEM_MAIL_PASS,
  },
});

function maskEmail(email) {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
}

async function mailSender(to, subject, text, html) {
  const masked = maskEmail(to);
  logger.info('MAIL', 'Sending email', { to: masked, subject });

  try {
    const info = await transporter.sendMail({
      from: `PDMS <${process.env.SYSTEM_MAIL_ID}>`,
      to,
      subject,
      text: text || '',
      html: html || '',
    });
    logger.info('MAIL', 'Email delivered', { to: masked, subject, messageId: info.messageId });
  } catch (error) {
    logger.error('MAIL', 'Failed to send email', { to: masked, subject, error: error.message });
  }
}

module.exports = mailSender;
