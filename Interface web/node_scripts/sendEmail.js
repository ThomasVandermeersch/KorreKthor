var nodeoutlook = require('nodejs-nodemailer-outlook')
const { User, Exam, Copy } = require("./database/models");


console.log(process.env.EMAIL_ADDRESS)

async function sendResult(copy,result){
    user = await User.findOne({where:{"matricule":String(copy.qrcode.matricule)}})
    
    if(user.matricule == '17030' || user.matricule=='17076'){
            text = 'Bonjour ' + user.fullName + ',\n\n' + 'Vous avez obtenu la note de ' 
                    + result[0] + '/' + result[1] + ' à votre examen de ' + 'Stabilité'
            sendEmail(user.email,null,'Résultat QCM',text ,[])
            console.log('-- SEND EMAIL TO : ' + user.matricule)

    }
    
}





function sendEmail(to, from, object, text , filePath){
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
        subject: object,
        text: text,
        onError: (e) => reject(e),
        onSuccess: (i) => resolve(i)
        });
    })
    
}

exports.sendEmail = sendEmail
exports.sendResult = sendResult

//sendEmail("17030@ecam.be",'Test',"Bonjour Guillaume BOUILLON\n\n Merci d'utiliser Korekkthor !",[])



// nodeoutlook.sendEmail({
//     auth: {
//         user: process.env.EMAIL_ADDRESS,
//         pass: EMAIL_PASSWORD
//     },
//     from: process.env.EMAIL_ADDRESS,
//     to: 'receiver@gmail.com',
//     subject: 'Hey you, awesome!',
//     html: '<b>This is bold text</b>',
//     text: 'This is text version!',
//     replyTo: 'receiverXXX@gmail.com',
//     attachments: [
//                         {
//                             filename: 'text1.txt',
//                             content: 'hello world!'
//                         },
//                         {   // binary buffer as an attachment
//                             filename: 'text2.txt',
//                             content: new Buffer('hello world!','utf-8')
//                         },
//                         {   // file on disk as an attachment
//                             filename: 'text3.txt',
//                             path: '/path/to/file.txt' // stream this file
//                         },
//                         {   // filename and content type is derived from path
//                             path: '/path/to/file.txt'
//                         },
//                         {   // stream as an attachment
//                             filename: 'text4.txt',
//                             content: fs.createReadStream('file.txt')
//                         },
//                         {   // define custom content type for the attachment
//                             filename: 'text.bin',
//                             content: 'hello world!',
//                             contentType: 'text/plain'
//                         },
//                         {   // use URL as an attachment
//                             filename: 'license.txt',
//                             path: 'https://raw.github.com/nodemailer/nodemailer/master/LICENSE'
//                         },
//                         {   // encoded string as an attachment
//                             filename: 'text1.txt',
//                             content: 'aGVsbG8gd29ybGQh',
//                             encoding: 'base64'
//                         },
//                         {   // data uri as an attachment
//                             path: 'data:text/plain;base64,aGVsbG8gd29ybGQ='
//                         },
//                         {
//                             // use pregenerated MIME node
//                             raw: 'Content-Type: text/plain\r\n' +
//                                  'Content-Disposition: attachment;\r\n' +
//                                  '\r\n' +
//                                  'Hello world!'
//                         }
//                     ],
//     onError: (e) => console.log(e),
//     onSuccess: (i) => console.log(i)
// }
 
 
// );