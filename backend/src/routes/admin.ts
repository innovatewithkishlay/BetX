import { Router, Response } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { adminGuard, AdminRequest } from '../middleware/adminGuard';

const router = Router();

// POST /api/admin/auth/verify
// Secondary verification to ensure the user has the admin role
router.post('/auth/verify', verifyToken, adminGuard, (req: AdminRequest, res: Response): void => {
    const admin = req.admin!;

    res.status(200).json({
        success: true,
        message: 'Admin access verified',
        data: {
            uid: admin.uid,
            email: admin.email,
            role: admin.role,
            status: admin.status,
        },
    });
});

export default router;
