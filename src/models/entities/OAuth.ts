import * as jwtLib from 'jsonwebtoken';
import SessionRepository from '../repositories/Session.repository';

export default class OAuth {
    private sessionRepository: SessionRepository;

    constructor(){
        this.sessionRepository = new SessionRepository();
    }

    public async generateAuthorizationCode(user: string, pass: string): Promise<string>{
        const result = await api.login(user, pass);

        const code = Math.random().toString(36).substring(2) 
            + process.env.IDENTIFIER 
            + Math.random().toString(36).substring(2)
        ;
        const expiresInMs = 300;
        await this.sessionRepository.insertTokenSession(code, result, expiresInMs);
        return code;
    }

    public async accessTokenExchange(authorizationCode: string): Promise<{
        access_token: string,
        expires_in: number
    }>{
        if(!authorizationCode.includes(String(process.env.IDENTIFIER)))
            throw({ status: 401, message: '[ERROR][OAuth-PiSAP][AccessTokenExchange]: Invalid authorizationCode.'});

        const result = await this.sessionRepository.getTokenSession(authorizationCode);

        if(!result) 
            throw({ status: 401 });        
        else 
            await this.sessionRepository.deleteTokenSession(authorizationCode);

        const expiresIn = 3600;
        let accessToken = await jwtLib.sign({}, String(process.env.IDENTIFIER), { expiresIn });

        accessToken = accessToken.substring(0, accessToken.length/2) 
            + String(process.env.IDENTIFIER)
            + accessToken.substring(accessToken.length/2, accessToken.length)
        ;
        
        return { 
            access_token: accessToken, 
            expires_in: expiresIn 
        };
    }

    public async getUserInfo(accessToken: string): Promise<any>{
        if(!accessToken.includes(String(process.env.IDENTIFIER)))
            throw({ status: 500, message: '[ERROR][OAuth-PiSAP][GetUserInfo]: Invalid access_token.' });        

        try{
            return jwtLib.verify(
                accessToken.replace(String(process.env.IDENTIFIER), ''), 
                String(process.env.IDENTIFIER)
            );            
        }catch(error: any){
            if(error.message === 'invalid signature')
                throw({ status: 401, message: 'Invalid access_token' });
            
            else if(error.message === 'jwt expired')
                throw({ status: 401, message: 'Session expired' });           
                
            else
                throw({ status: 500, message: error.message });
        }
    }
}