import * as nodemailer from 'nodemailer';

export default async function(
    email: string, 
    title: string,
    html: string, 
    attachments?: Array<{ filename: string, content: Buffer, contentType: string }>
){
    return new Promise((resolve, reject)=>{
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_EMAIL, 
                pass: process.env.GMAIL_PASS
            }
        });
    
        const mailOptions = {
            from: `"Nome Personalizado" <${process.env.GMAIL_EMAIL}>`,
            to: email,
            subject: `${process.env.NODE_ENV != 'prod' ? `[AMBIENTE TESTE]` : ''}` + title,
            html,
            attachments: attachments || []
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