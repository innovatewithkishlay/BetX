import { Router, Response, Request } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { adminGuard, superAdminGuard, AdminRequest } from '../middleware/adminGuard';
import { fetchCurrentMatches } from '../services/cricketService';
import { importMatch, createManualMatch, addMarketToMatch, addSelectionToMarket, settleMarket, updateOdd } from '../services/adminService';
import { createSubAdmin, listSubAdmins } from '../services/subAdminService';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';


const router = Router();

/**
 * @route   POST /api/admin/system/subadmin/create
 * @desc    Create a new sub-admin account (Super Admin only)
 * @access  Super Admin
 */
router.post('/system/subadmin/create', verifyToken, superAdminGuard, async (req: AdminRequest, res: Response): Promise<void> => {
    try {
        const { email, name } = req.body;
        if (!email || !name) {
            res.status(400).json({ success: false, message: 'Email and Name are required' });
            return;
        }

        const result = await createSubAdmin(email, name);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/admin/system/subadmins
 * @desc    List all sub-admins (Super Admin only)
 * @access  Super Admin
 */
router.get('/system/subadmins', verifyToken, superAdminGuard, async (req: AdminRequest, res: Response): Promise<void> => {
    try {
        const result = await listSubAdmins();
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/admin/system/agents
 * @desc    List all agents (Admin only)
 * @access  Admin
 */
router.get('/system/agents', verifyToken, adminGuard, async (req: AdminRequest, res: Response): Promise<void> => {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'agent')
            .get();

        const agents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({ success: true, data: agents });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/admin/system/clients
 * @desc    List all clients across all agents (Admin only)
 * @access  Admin
 */
router.get('/system/clients', verifyToken, adminGuard, async (req: AdminRequest, res: Response): Promise<void> => {
    try {
        const snapshot = await db.collection('clients').get();

        const clients = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({ success: true, data: clients });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

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
 * @route   GET /api/admin/profile
 * @desc    Get current admin profile details
 * @access  Admin
 */
router.get('/profile', verifyToken, adminGuard, async (req: AdminRequest, res: Response): Promise<void> => {
    const uid = req.admin!.uid;

    try {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            res.status(404).json({ success: false, message: 'Admin profile not found' });
            return;
        }

        // Update lastLogin timestamp
        await userRef.update({ lastLogin: FieldValue.serverTimestamp() });

        const data = userDoc.data()!;

        res.status(200).json({
            success: true,
            data: {
                uid,
                email: data.email,
                role: data.role,
                status: data.status,
                createdAt: data.createdAt,
                lastLogin: new Date().toISOString(),
            },
        });
    } catch (err) {
        console.error('[ROUTE] Admin Profile Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch admin profile' });
    }
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

/**
 * @route   POST /api/admin/cricket/manual-create
 * @desc    Manually create a match in Firestore
 * @access  Admin
 */
router.post('/cricket/manual-create', verifyToken, adminGuard, async (req: AdminRequest, res: Response): Promise<void> => {
    try {
        const { name, teamA, teamB, startTime } = req.body;

        if (!name || !teamA || !teamB || !startTime) {
            res.status(400).json({ success: false, message: 'All fields (name, teamA, teamB, startTime) are required' });
            return;
        }

        const result = await createManualMatch({ name, teamA, teamB, startTime });
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to create manual match',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/admin/cricket/market/add
 * @desc    Add a new market to a match
 */
router.post('/cricket/market/add', verifyToken, adminGuard, async (req: AdminRequest, res: Response): Promise<void> => {
    try {
        const { matchId, type } = req.body;
        if (!matchId || !type) {
            res.status(400).json({ success: false, message: 'matchId and type are required' });
            return;
        }
        const result = await addMarketToMatch(matchId, type);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/admin/cricket/selection/add
 * @desc    Add a new selection to a market
 */
router.post('/cricket/selection/add', verifyToken, adminGuard, async (req: AdminRequest, res: Response): Promise<void> => {
    try {
        const { matchId, marketId, name, initialOdd } = req.body;
        if (!matchId || !marketId || !name || initialOdd === undefined) {
            res.status(400).json({ success: false, message: 'matchId, marketId, name, and initialOdd are required' });
            return;
        }
        const result = await addSelectionToMarket(matchId, marketId, name, initialOdd);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/admin/cricket/market/settle
 * @desc    Settle a market
 */
router.post('/cricket/market/settle', verifyToken, adminGuard, async (req: AdminRequest, res: Response): Promise<void> => {
    try {
        const { matchId, marketId, winnerSelectionId } = req.body;
        if (!matchId || !marketId || !winnerSelectionId) {
            res.status(400).json({ success: false, message: 'matchId, marketId, and winnerSelectionId are required' });
            return;
        }
        const result = await settleMarket(matchId, marketId, winnerSelectionId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/admin/cricket/selection/update-odd
 * @desc    Update selection odd
 */
router.post('/cricket/selection/update-odd', verifyToken, adminGuard, async (req: AdminRequest, res: Response): Promise<void> => {
    try {
        const { matchId, marketId, selectionId, newOdd } = req.body;
        if (!matchId || !marketId || !selectionId || newOdd === undefined) {
            res.status(400).json({ success: false, message: 'matchId, marketId, selectionId, and newOdd are required' });
            return;
        }
        const result = await updateOdd(matchId, marketId, selectionId, newOdd);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});


export default router;
