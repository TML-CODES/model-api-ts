import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Users from "../models/repositories/Users.repository";
import Session from "../models/repositories/Session.repository";
import { verifyTokenFormat } from "../utils/helpers";
import NodeCache from "node-cache";
import sendEmail from "../modules/nodemailer";
import moment from "moment";
import fs from 'fs';
import path from "path";

const myCache = new NodeCache();

const HTML_EMAIL_AUTH_CODE = fs.readFileSync(
    path.resolve(__dirname, '../templates/emailAuthCodeTemplate.html'), 
    { 'encoding': 'utf8' }
)
.toString();

export async function sendLoginCode(req: Request, res: Response, next: NextFunction) {
    try{
        const { email } = req.body;
        if(!email || ['null', 'undefined'].includes(email)){
            return res.status(400).send();
        }
        
        if(!myCache.get(email)){
            myCache.set(email, 'true', 120);
        }else{
            return res.status(403).send({ 
                message: 'Esse email já solicitou um código. Tente novamente após 2 minutos.' 
            });
        }

        const user = await Users.get(
            { email }, 
            { 
                id: true,
                name: true,
                email: true,
                roleId: true
            }
        );
        if (!user) {
            throw { status: 404, message: "Usuário não cadastrado" };
        }
        
        let [session] = await Session.search({ userId: user.id }, undefined, { user: true });
        const code = Math.random().toString().slice(2,8);
        const expCode = moment().utc().add(5, 'minutes').toDate()
        
        if(session){
            session = <any> await Session.update(session.id, { code, expCode });
        }else{
            session = <any> await Session.create({
                id: undefined, 
                userId: user.id, 
                accessToken: undefined,
                refreshToken: undefined, 
                code,
                expCode,
                createdAt: moment().utc().toDate(),
                updatedAt: moment().utc().toDate()
            })
        }
        
        await sendEmail(email, 'Código de Autenticação de Login', HTML_EMAIL_AUTH_CODE.replace('{{code}}', code));
        return res.status(200).send({ message: 'E-mail enviado com sucesso!' });
    }catch (error){
        return next(error);
    }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        const { code } = req.body;
        if(!code || ['null', 'undefined'].includes(code)){
            return res.status(400).send();
        }

        const [session] = await Session.search({ code }, undefined, { user: true });
        if(!session){
            return res.status(401).send({ message: 'Código inválido' });
        }else if(moment(session.expCode) < moment().utc()){
            return res.status(401).send({ message: 'Código expirado' });
        }
    
        const expiresIn = 5400; // 5400 = 1:30
        const accessToken = jwt.sign(
            { 
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                roleId: session.user.roleId
            },
            process.env.API_SECRET,
            { expiresIn } 
        );
    
        const refreshToken = jwt.sign({}, process.env.API_SECRET_REFRESH);
        await Session.update(session.id, { refreshToken, accessToken, code: null, expCode: null });

        return res.status(200).send({ 
            access_token: accessToken, 
            expires_in: expiresIn, 
            refresh_token: refreshToken 
        });
    } catch (err: any) {
        return next(err);
    }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
        const refreshToken = verifyTokenFormat(req);
        jwt.verify(refreshToken, process.env.API_SECRET_REFRESH);
        const [session] = await Session.search({ refreshToken }, undefined, { user: true });
        if(!session){
            return res.status(401).send({});
        }

        const expiresIn = 5400; // 5400 = 1:30
        const accessToken = jwt.sign(
            { 
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                roleId: session.user.roleId
            },
            process.env.API_SECRET,
            { expiresIn } 
        );
    
        const newRefreshToken = jwt.sign({}, process.env.API_SECRET_REFRESH);
        await Session.update(session.id, { refreshToken: newRefreshToken, accessToken });
        
        return res.status(200).send({ 
            access_token: accessToken, 
            expires_in: expiresIn, 
            refresh_token: newRefreshToken 
        });
    } catch (error) {
        return next({ status: 401, message: "RefreshToken inválido" });
    }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        const refreshToken = verifyTokenFormat(req);
        jwt.verify(refreshToken, process.env.API_SECRET_REFRESH);
        const [session] = await Session.search({ refreshToken }, undefined, { user: true });
        if(!session){
            return res.status(401).send({ message: 'RefreshToken inválido' });
        }

        await Session.update(session.id, { refreshToken: null });
        return res.status(200).send();
    } catch (error) {
        return next({ status: 401, message: "RefreshToken inválido" });
    }
}
