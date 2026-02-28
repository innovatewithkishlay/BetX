import { auth, db } from '../config/firebase';
import crypto from 'crypto';

/**
 * Generates a random strong password for sub-admins
 */
const generatePassword = (length = 12): string => {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
};

export const createSubAdmin = async (email: string, name: string) => {
    const password = generatePassword();

    try {
        // 1. Create User in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
        });

        // 2. Create User Profile in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            name,
            role: 'subadmin',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return {
            success: true,
            message: 'Sub-Admin created successfully',
            data: {
                uid: userRecord.uid,
                email,
                name,
                password // Return this so the admin can copy it
            }
        };
    } catch (error: any) {
        console.error('[SERVICE] Sub-Admin Creation Error:', error);
        throw new Error(error.message || 'Failed to create sub-admin');
    }
};

export const listSubAdmins = async () => {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'subadmin')
            .get();

        return {
            success: true,
            data: snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
        };
    } catch (error: any) {
        console.error('[SERVICE] List Sub-Admins Error:', error);
        throw new Error(error.message || 'Failed to list sub-admins');
    }
};
