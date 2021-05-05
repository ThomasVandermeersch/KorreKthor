var nodeoutlook = require('nodejs-nodemailer-outlook')

function sendEmail(to, from, subject, text){
    return new Promise((resolve,reject)=>{
        nodeoutlook.sendEmail({
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        },
        from: process.env.EMAIL_ADDRESS,
        to: to,
        cc: from,
        subject: subject,
        text: text,
        onError: (e) => reject(e),
        onSuccess: (i) => resolve(i)
        });
    })
}

exports.sendEmail = sendEmail