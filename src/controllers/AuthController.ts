import { Request, Response, NextFunction } from "express";
import { Firebase, refreshFirebaseToken } from "../modules/firebaseApi";
import jwt from 'jsonwebtoken';
import Users from "../models/Users";
import { verifyTokenFormat } from "../utils/helpers";

async function generateAccessToken(email: string): Promise<{ access_token: string, expires_in: number }>{
    const userData = await Users.get(
        { email }, 
        { cpf: false }
    );

    if(!userData){
        throw({ status: 404, message: 'Unregistered User' });
    }

    const expiresInAT = 5400;
    const acessToken = jwt.sign(
        { userData }, 
        process.env.API_SECRET, 
        { expiresIn: expiresInAT } // 5400 = 1:30
    ); 

    return { access_token: acessToken, expires_in: expiresInAT };
}

class AuthController {

    async authenticate(req: Request, res: Response, next: NextFunction){
        try{
            if(!req.headers.apikey || req.headers.apikey != process.env.API_KEY){
                throw({ status: 401, message: 'Invalid apikey' });
            }
            const token = verifyTokenFormat(req);
            const { email } = await Firebase.auth().verifyIdToken(token, true)
            .catch(error => {
                throw({ status: 401, message: 'Invalid token' });
            });
            
            const response = await generateAccessToken(email);
            return res.status(200).send(response);
            
        }catch(err: any){
            return next(err);
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            if(!req.headers.apikey || req.headers.apikey != process.env.API_KEY){
                throw({ status: 401, message: 'Invalid apikey' });
            }
            const refreshToken = verifyTokenFormat(req);
            const resF = await refreshFirebaseToken(refreshToken);
            if(!resF) throw({});
            
            const userFirebase = await Firebase.auth().getUser(resF.user_id)
            .catch(error => {
                console.error(error.message)
                throw({ status: 401, message: 'Invalid token' });
            });
            console.log(userFirebase);

            const response = await generateAccessToken(userFirebase.email);
            return res.status(200).send(response);
        } catch (error) {
            console.error(error)
            return next({ status: 401, message: 'Invalid refresh_token' });
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            if(!req.headers.apikey || req.headers.apikey != process.env.API_KEY){
                throw({ status: 401, message: 'Invalid apikey' });
            }
            const refreshToken = verifyTokenFormat(req);
            const resF = await refreshFirebaseToken(refreshToken);
            if(!resF) throw({});
            
            const response = await Firebase.auth().revokeRefreshTokens(resF.user_id);
            return res.status(200).send(response);
        } catch (error) {
            console.error(error);
            return next({ status: 401, message: 'Invalid refresh_token' });
        }
    }
}
export default new AuthController();