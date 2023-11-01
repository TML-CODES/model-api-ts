import admin from 'firebase-admin';
import axios from 'axios';

const configFilename = 
    "../config/serviceAccountKey_" +
    ((String(process.env.NODE_ENV).includes('prod')) ? 'prod' : (process.env.NODE_ENV === 'dev') ? 'dev' : 'qa') +
    ".json"
  ;


const serviceAccount = require(configFilename);
export const Firebase = admin.initializeApp({
  credential: admin.credential.cert({ 
    'clientEmail': serviceAccount.client_email,
    'projectId': serviceAccount.project_id,
    'privateKey': serviceAccount.private_key
  }),
});

export async function refreshFirebaseToken (refreshToken){
        
    const api = axios.create({
        baseURL: process.env.GOOGLE_API_URL
    });

    const res = await api.post('/token?key=' + process.env.FIREBASE_KEY, 
        `grant_type=refresh_token&refresh_token=${refreshToken}`, 
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
    );
    return res.data;
}