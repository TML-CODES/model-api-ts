import * as nodemailer from 'nodemailer';

export default async function(email: string, title: string, text: string){
    return new Promise((resolve, reject)=>{
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_EMAIL, 
                pass: process.env.GMAIL_PASS
            }
        });
    
        const mailOptions = {
            from: process.env.GMAIL_EMAIL,
            to: email,
            subject: title,
            text
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Erro ao enviar e-mail:', error);
                return reject({ status: 409, message: error });
            } else {
                console.log('E-mail enviado:', info.response);
                return resolve(info.response);
            }
        });
    });
}