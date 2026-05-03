const { Resend } = require('resend');
const logger = require('./logger');

const resend = new Resend(process.env.RESEND_API_KEY);

function maskEmail(email) {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
}

async function mailSender(to, subject, text, html) {
  const masked = maskEmail(to);
  logger.info('MAIL', 'Sending email', { to: masked, subject });

  const { data, error } = await resend.emails.send({
    from: process.env.SYSTEM_MAIL_FROM || 'PDMS <onboarding@resend.dev>',
    to,
    subject,
    text: text || '',
    html: html || '',
  });

  if (error) {
    logger.error('MAIL', 'Failed to send email', { to: masked, subject, error: error.message });
  } else {
    logger.info('MAIL', 'Email delivered', { to: masked, subject, messageId: data.id });
  }
}

module.exports = mailSender;
