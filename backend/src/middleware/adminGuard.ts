import { Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { AuthRequest } from './verifyToken';

export interface AdminRequest extends AuthRequest {
    admin?: {
        uid: string;
        email: string;
        role: string;
        status: string;
    };
}

export const adminGuard = async (
    req: AdminRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }

    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();

        if (!userDoc.exists) {
            res.status(403).json({ success: false, message: 'Forbidden: User not found' });
            return;
        }

        const data = userDoc.data()!;

        // Strict role check: must be exactly 'admin'
        if (data.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Forbidden: Insufficient role' });
            return;
        }

        if (data.status !== 'active') {
            res.status(403).json({ success: false, message: 'Forbidden: Account suspended' });
            return;
        }

        req.admin = {
            uid: req.user.uid,
            email: data.email,
            role: data.role,
            status: data.status,
        };

        next();
    } catch (err) {
        console.error('Admin Guard Error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
