import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
        throw new Error(
            'Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env'
        );
    }

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
        }),
    });
}

export const auth = admin.auth();
export const db = admin.firestore();
export default admin;
