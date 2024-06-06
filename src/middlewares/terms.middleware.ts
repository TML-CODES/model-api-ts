import { NextFunction, Request, Response } from "express";
import { UserData } from "../types";
import Users from "../models/repositories/Users.repository";

export default async function (req: Request, res: Response, next: NextFunction){
    try{
        if(req.path.includes('/users') && req.method == 'PATCH'){
            return next();
        }

        const userData: UserData = req.cookies.userData;
        if(!userData.isAcceptedNewVersionTerm){
            const user = await Users.get({ id: userData.id });
            if(!user.isAcceptedNewVersionTerm)
                return res.status(403).send({ message: 'Os termos de uso não foram aceitos ou foram atualizados. Aceite-os para prosseguir...' });
            else
                userData.isTermAccepted = true;
        }
        return next();
    }catch(err: any){
        return next(err);
    }
}