import { Router, Response, Request } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { adminGuard, AdminRequest } from '../middleware/adminGuard';
import { fetchCurrentMatches } from '../services/cricketService';
import { importMatch } from '../services/adminService';

const router = Router();

/**
 * @route   POST /api/admin/auth/verify
 * @desc    Secondary verification to ensure the user has the admin role
 * @access  Admin
 */
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

/**
 * @route   GET /api/admin/cricket/matches
 * @desc    Fetch current live matches from CricketData API for discovery
 * @access  Admin
 */
router.get('/cricket/matches', verifyToken, adminGuard, async (req: AdminRequest, res: Response): Promise<void> => {
    try {
        const matches = await fetchCurrentMatches();
        res.status(200).json({
            success: true,
            data: matches
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch matches',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/admin/cricket/import
 * @desc    Import a specific match from CricketData API into Firestore
 * @access  Admin
 */
router.post('/cricket/import', verifyToken, adminGuard, async (req: AdminRequest, res: Response): Promise<void> => {
    try {
        const { match } = req.body;
        if (!match) {
            res.status(400).json({ success: false, message: 'Match data is required' });
            return;
        }

        const result = await importMatch(match);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to import match',
            error: error.message
        });
    }
});

export default router;
