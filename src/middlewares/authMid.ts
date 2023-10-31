import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { UserData } from "../types";
import { verifyTokenFormat } from "../utils/helpers";

export async function isAuthenticated(req: Request, res: Response, next: NextFunction){
    try{
        const token = verifyTokenFormat(req);
        const userData = <UserData> jwt.verify(token, process.env.API_SECRET)['userData'];
        req.cookies = {userData};
        return next();
    }catch(err: any){
        return next({ status: 401, message: 'Invalid access_token' });
    }
}

export const rolesControl = {
    superadminControl: (req: Request, res: Response, next: NextFunction)=>{
        const userData: UserData = req.cookies.userData;

        if(!userData)
            return next({ status: 500, message: '[ERROR][auth-middleware][rolesControl]: req.cookies.userData is undefined' })

        const userRole = userData.roleId;
        if(userRole != 'superadmin')
            return res.status(403).send({ message: 'Only SuperAdmins have permission on this resource.' })
        return next();
    },
    adminControl: (req: Request, res: Response, next: NextFunction)=>{
        const userData: UserData = req.cookies.userData;

        if(!userData)
            return next({ status: 500, message: '[ERROR][auth-middleware][rolesControl]: req.cookies.userData is undefined' })

        const userRole = userData.roleId;
        if(userRole != 'admin' && userRole != 'superadmin')
            return res.status(403).send({ message: 'Only Admins have permission on this resource.' })
        return next();
    }
}