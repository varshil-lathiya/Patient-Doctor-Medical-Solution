const nodemailer = require('nodemailer');
const logger = require('./logger');

function maskEmail(email) {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
}

function mailSender(to, subject, text, html) {
  const masked = maskEmail(to);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SYSTEM_MAIL_ID ? process.env.SYSTEM_MAIL_ID.replace(/['"\s]/g, '') : '',
      pass: process.env.SYSTEM_MAIL_PASS ? process.env.SYSTEM_MAIL_PASS.replace(/['"\s]/g, '') : '',
    },
  });

  const mailOptions = {
    from: process.env.SYSTEM_MAIL_ID,
    to,
    subject,
    text: text || '',
    html: html || '',
  };

  logger.info('MAIL', 'Sending email', { to: masked, subject });

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error('MAIL', 'Failed to send email', {
        to: masked,
        subject,
        error: error.message,
        code: error.code,
      });
    } else {
      logger.info('MAIL', 'Email delivered', {
        to: masked,
        subject,
        messageId: info.messageId,
        response: info.response,
      });
    }
  });
}

module.exports = mailSender;
