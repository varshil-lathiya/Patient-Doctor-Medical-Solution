const nodemailer = require('nodemailer');

function mailSender(to,subject,text,html){
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth:{
      user: process.env.SYSTEM_MAIL_ID ? process.env.SYSTEM_MAIL_ID.replace(/['"\s]/g, '') : '',
      pass: process.env.SYSTEM_MAIL_PASS ? process.env.SYSTEM_MAIL_PASS.replace(/['"\s]/g, '') : ''
    }
  })
  let mailOptions = {
    from:process.env.SYSTEM_MAIL_ID,
    to:to,
    subject:subject,
    text:text || '',
    html:html || '' 
  }
  
  transporter.sendMail(mailOptions,(error, info) =>{
         if (error) {
           console.log('Error in sending email  ' + error);
          return error;
         } else {
          console.log('Email sent: ' + info.response);
          return ;
        }
    })
}

module.exports = mailSender 