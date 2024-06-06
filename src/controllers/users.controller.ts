import { users } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import UsersRepository from "../models/repositories/Users.repository";
import { UserData } from "../types";
import * as documentValidator from "cpf-cnpj-validator";
import NodeCache from "node-cache";
import fs from 'fs';
import path from "path";
import nodemailer from "../modules/nodemailer";
import { Firebase } from "../modules/firebaseApi";

const myCache = new NodeCache();

const HTML_RESET_PASSWORD = fs.readFileSync(
    path.resolve(__dirname, '../templates/resetPasswordHtml.html'), 
    { 'encoding': 'utf8' }
)
.toString();

export async function createUser(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userData: UserData = req.cookies.userData;
        let data = <users>req.body;

        data.name = data.name.trim();

        if(typeof data.document == 'string'){
            data.document = data.document.replace(/\D/g, "");
        }
        
        if (
            !data.document 
            || (
                !documentValidator.cpf.isValid(data.document) 
                && !documentValidator.cnpj.isValid(data.document)
            )
        ) {
            return res.status(400).send({ message: "Documento inválido." });
        }

        const usersdb = await UsersRepository.search({
            OR: [{ email: data.email }, { document: data.document }],
        });
        if (usersdb.length > 0) {
            return res
                .status(403)
                .send({ message: "Email ou documento já cadastrado" });
        }

        if (
            data.roleId &&
            ["admin", "superadmin"].includes(data.roleId) &&
            userData?.roleId != "superadmin"
        ) {
            return res
                .status(403)
                .send({ message: "Somente SUPERADMIN's podem cadastrar ADMs" });
        }

        if(!data.roleId){
            data.roleId = "customer";
        }

        // const role = await Roles.get(data.roleId);
        // if(!role){
        //     return res.status(404).send({ message: 'Nível de Permissão (role) não encontrado!' });
        // }

        // const userFirebase = await Firebase.auth().createUser({
        //     email: data.email,
        //     displayName: data.name,
        //     password: data.password,
        //     emailVerified: false,
        // });

        // if (!userFirebase) {
        //     return next({
        //         status: 502, 
        //         message: `Não foi possível realizar o cadastro no Firebase`
        //     });
        // }

        // const newUser: users = {
        //     ...data,
        //     password: bcrypt.hashSync(data.password, bcrypt.genSaltSync(12)),
        //     isFirebase: true,
        //     firebaseUID: userFirebase.uid
        // };

        // const user = await Users.create(newUser);

        const emailTitle = 'Bem-vindo ao App X!';
        const emailBody = `Olá ${data.name.split(' ')[0]}! `+
            `Você foi cadastrado em nosso App. <br>`+
            `Esse é o seu acesso:`+
            `<br>`+
            `Email: <b>${data.email}</b> <br>`+
            `Senha: <b>${data.password}</b>`+
            `<br><br>`+
            `Caso deseje, você pode alterar sua senha na sessão "Perfil" e criar uma nova senha. `+
            `<br><br>`+
            `Atenciosamente, equipe X!`
        ;
        await nodemailer(data.email, emailTitle, emailBody).catch(err => { console.error(err) });

        const user = await UsersRepository.create(data);
        return res.status(201).send(user);
    } catch (error) {
        console.error(error);
        return next(error);
    }
}

export async function deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
) {
    return res.status(501).send();
}

export async function get(req: Request, res: Response, next: NextFunction) {
    try {
        const userData: UserData = req.cookies.userData;
        const id = req.params?.id || userData.id;
        const response = await UsersRepository.get({ id });
        return res.status(200).json(response);
    } catch (error) {
        return next(error);
    }
}

export async function getAddress(req: Request, res: Response, next: NextFunction) {
    try {
        const userData: UserData = req.cookies.userData;
        const id = req.params?.id || userData.id;
        const response = await AddressesRepository.search({ userId: id });
        return res.status(200).json(response);
    } catch (error) {
        return next(error);
    }
}

export async function update(req: Request, res: Response, next: NextFunction) {
    try {
        const userData: UserData = req.cookies.userData;
        const id = req.params?.id || userData.id;

        if (
            userData?.id != id &&
            !["admin", "superadmin"].includes(userData.roleId)
        ) {
            return res
                .status(403)
                .send({ message: "Você só pode atualizar os próprios dados!" });
        }

        const data = <Partial<users>>req.body;
        
        if(
            !userData.roleId.includes('admin')
            && (data.roleId || data.email || data.id || data.idInGateway)
        ){
            return res.status(403).send({ message: 'Você não pode atualizar dados estes dados (email, role, id)' })
        }

        // if (data.isAcceptedNewVersionTerm === true) {
        //     if (!data.termVersionAccepted) {
        //         return res.status(400).send({
        //             message: "É necessário informar a versão dos termos aceitos.",
        //         });
        //     }
        //     data.isTermAccepted = true;
        // }

        const user = await UsersRepository.update(id, data);
        return res.status(200).json(user);
    } catch (error) {
        if (error.message.includes("Foreign key")) {
            return res
                .status(403)
                .send({ message: "Email já cadastrado" });
        } else {
            return next(error);
        }
    }
}

export async function search(req: Request, res: Response, next: NextFunction) {
    try {
        const { where, orderBy, limit, skip, ...whereProps } = <any>req.query;
        const response = await UsersRepository.search(where || whereProps, orderBy, undefined, limit, skip);
        return res.status(200).send(response);
    } catch (error) {
        return next(error);
    }
}

export async function updateTermsAllUsers(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { isAcceptedNewVersionTerm } = req.body;

        if (isAcceptedNewVersionTerm !== false) {
            return res.status(400).send({
                message: "Só é possível atualizar todos usuários se uma nova versão dos Termos e Condições foi lançada no App (isAcceptedNewVersionTerm = false)",
            });
        }

        const user = await UsersRepository.updateAll({ isAcceptedNewVersionTerm });
        return res.status(200).json(user);
    } catch (error) {
        return next(error);
    }
}

export async function sendPasswordResetEmail(req: Request, res: Response, next: NextFunction) {
    try {
        const { email } = req.body;
        if(!myCache.get(email)){
            myCache.set(email, 'true', 300 );
        }else{
            return res.status(400).send({ 
                message: 'Esse email já recebeu o link para recuperação de senha. Tente novamente após alguns minutos.' 
            });
        }

        const resetPasswordLink = await Firebase.auth().generatePasswordResetLink(email);
        const title = 'Redefinir sua senha no App';
        const response = await nodemailer(
            email, 
            title, 
            HTML_RESET_PASSWORD.replace('{resetPasswordLink}', resetPasswordLink)
        );
        return res.status(200).send({ response });
    } catch (error) {
        console.error('Erro ao enviar e-mail de redefinição de senha:', error);
        return res.status(error?.status || 502).send({ message: error.message });
    }
}