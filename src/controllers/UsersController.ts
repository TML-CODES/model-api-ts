import { users } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import Users from "../models/Users";
import { Firebase } from "../modules/firebaseApi";
import { UserData } from "../types";
import nodemailer from '../modules/nodemailer';
import NodeCache from "node-cache";
import * as documentValidator from 'cpf-cnpj-validator'; 
import * as crypto from 'crypto-js';

const myCache = new NodeCache();

class UsersContoller {
    
    async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const data = <users> req.body;
            data.name = data.name.trim();
            data.cpf = data.cpf ? data.cpf.replace(/[-./)(]/g, '') : undefined;
            if(!data.cpf || !documentValidator.cpf.isValid(data.cpf)){
                return res.status(400).send({ message: 'CPF inválido.' });
            }
            
            const company = await Companies.get(data.companyId);
            if(!company){
                return res.status(403).send({ message: 'Company não encontrada' });
            }
            
            const usersdb = await Users.search({ OR: [ { email: data.email }, { cpf: data.cpf } ]})
            if(usersdb.length > 0){
                return res.status(403).send({ message: 'Email ou cpf já cadastrado' });
            }

            const userFirebase = await Firebase.auth().createUser({
                email: data.email,
                displayName: data.name,
                password: data.password,
                emailVerified: false,
            });

            if (!userFirebase) {
                return next({
                    status: 502, 
                    message: `Não foi possível realizar o cadastro no Firebase`
                });
            }

            const newUser: users = {
                ...data,
                password: crypto.SHA256(data.password).toString(),
                isFirebase: true,
                firebaseUID: userFirebase.uid,
                uriPartner: btoa(data.email+new Date().getTime()),
                roleId: data.roleId || 'viewer'
            };

            const user = await Users.create(newUser);
            return res.status(201).send(user);
        } catch (error) {
            console.error(error);
            return next(error); 
        }
    }
        
    async sendPasswordResetEmail(req: Request, res: Response, next: NextFunction) {
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
            const title = 'Redefinição de senha';
            const text = `Clique no link abaixo para redefinir sua senha:\n ${resetPasswordLink}`;
        
            const response = await nodemailer(email, title, text);
            return res.status(200).send({ response });
        } catch (error) {
            console.error('Erro ao enviar e-mail de redefinição de senha:', error);
            return res.status(error?.status || 502).send({ message: error.message });
        }
    }
    
    async delete(req: Request, res: Response, next: NextFunction) {
        return res.status(501).send();
    }

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const userData: UserData = req.cookies.userData;
            const id = req.params?.id || userData.id;
            const response = await Users.get({id});
            return res.status(200).json(response);
        } catch (error) {
            return next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const userData: UserData = req.cookies.userData;
            const id = req.params?.id || userData.id;

            if(userData?.id != id && !['admin', 'superadmin'].includes(userData.roleId)){
                return res.status(403).send({ message: 'Você só pode atualizar os próprios dados!' });
            }

            const data = <users> req.body;
            if(data.roleId && userData.roleId === 'viewer'){
                return res.status(403).send({ message: "Você não pode alterar o nível de permissão" });
            }
            if(data.roleId && ['admin', 'superadmin'].includes(data.roleId) && userData?.roleId != 'superadmin'){
                return res.status(403).send({ message: "Somente SUPERADMIN's podem cadastrar ADMs" });
            }
            if(data.cpf && !['admin', 'superadmin'].includes(userData.roleId)){
                return res.status(403).send({ message: 'Somente administradores podem atualizar o documento.' })
            }

            var userDb;
            if(req.body.newPassword || data.password){
                if(data.password && !req.body.newPassword){
                    return res.status(400).send({ message: 'Para atualizar a senha, envie a nova senha no campo newPassword' });
                }

                if(!['admin', 'superadmin'].includes(userData.roleId)){
                    if(!req.body.newPassword || !data.password){
                        return res.status(400).send({ message: 'É necessário informar a senha atual para atualização de senha.' });
                    }

                    userDb = await Users.get({ id: userData.id }, { firebaseUID: true, password: true });
                    const oldPassHash = crypto.SHA256(data.password).toString();
                    if(oldPassHash != userDb.password){
                        return res.status(409).send({ message: 'Senha atual inválida' })
                    }
                }

                if(req.body.newPassword == data.password){
                    return res.status(400).send({ message: 'A nova senha não pode ser igual a senha antiga' });
                }

                if(!userDb) userDb = await Users.get({ id: userData.id }, { firebaseUID: true });
                await Firebase.auth().updateUser(userDb.firebaseUID, { password: req.body.newPassword });
                data.password = crypto.SHA256(req.body.newPassword).toString();

                //@ts-ignore
                delete data.newPassword;
            }

            if(data.email){
                if(!userDb) userDb = await Users.get({ id: userData.id }, { firebaseUID: true });
                await Firebase.auth().updateUser(userDb.firebaseUID, { email: data.email });
            }

            const user = await Users.update(id, data);
            return res.status(200).json(user);
        } catch (error) {
            if(error.message.includes('Foreign key')){
                return res.status(403).send({ message: 'Email ou cpf já cadastrado' });
            }else{
                return next(error);
            }
        }
    }

    async search(req: Request, res: Response, next: NextFunction) {
        try {
            const { where, orderBy, ...whereProps } = <any> req.query;
            const response = await Users.search(where || whereProps, orderBy);
            return res.status(200).send(response);
        } catch (error) {
            return next(error);
        }
    }
}

export default new UsersContoller();