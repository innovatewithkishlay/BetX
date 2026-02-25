import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

// Extend Express Request to carry decoded token
export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email: string;
    };
}

export const verifyToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = await auth.verifyIdToken(token);
        req.user = { uid: decoded.uid, email: decoded.email ?? '' };
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
    }
};
