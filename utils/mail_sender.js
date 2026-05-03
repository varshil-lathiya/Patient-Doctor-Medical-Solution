const logger = require('./logger');

function maskEmail(email) {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
}

async function mailSender(to, subject, text, html) {
  const masked = maskEmail(to);
  logger.info('MAIL', 'Sending email', { to: masked, subject });

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'PDMS', email: process.env.SYSTEM_MAIL_ID },
        to: [{ email: to }],
        subject,
        htmlContent: html || '',
        textContent: text || 'Please view this email in an HTML-capable client.',
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      logger.error('MAIL', 'Failed to send email', { to: masked, subject, error: err.message });
    } else {
      const data = await res.json();
      logger.info('MAIL', 'Email delivered', { to: masked, subject, messageId: data.messageId });
    }
  } catch (error) {
    logger.error('MAIL', 'Failed to send email', { to: masked, subject, error: error.message });
  }
}

module.exports = mailSender;
