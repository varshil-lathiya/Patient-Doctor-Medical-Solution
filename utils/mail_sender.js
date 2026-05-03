const { google } = require('googleapis');
const logger = require('./logger');

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

function maskEmail(email) {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
}

async function mailSender(to, subject, text, html) {
  const masked = maskEmail(to);
  logger.info('MAIL', 'Sending email', { to: masked, subject });

  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const message = [
      `From: PDMS <${process.env.SYSTEM_MAIL_ID}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      html || text || '',
    ].join('\n');

    const encoded = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encoded },
    });

    logger.info('MAIL', 'Email delivered', { to: masked, subject, messageId: res.data.id });
  } catch (error) {
    logger.error('MAIL', 'Failed to send email', { to: masked, subject, error: error.message });
  }
}

module.exports = mailSender;
