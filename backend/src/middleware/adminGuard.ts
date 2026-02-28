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

        // Allow both admin and subadmin for general admin routes
        const allowedRoles = ['admin', 'subadmin'];
        if (!allowedRoles.includes(data.role)) {
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

/**
 * Strict guard for Super Admin (role: 'admin') only.
 * Used for system management and sub-admin creation.
 */
export const superAdminGuard = async (
    req: AdminRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    // First run the general adminGuard
    await adminGuard(req, res, async () => {
        if (req.admin?.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Forbidden: Super Admin access required' });
            return;
        }
        next();
    });
};
