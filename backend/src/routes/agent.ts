import { Router, Response } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { agentGuard, AgentRequest } from '../middleware/agentGuard';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// GET /api/agent/profile
// Protected: returns current agent profile and updates lastLogin
router.get('/profile', verifyToken, agentGuard, async (req: AgentRequest, res: Response): Promise<void> => {
    const uid = req.agent!.uid;

    try {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            res.status(404).json({ success: false, message: 'Agent profile not found' });
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
                agentLimit: data.agentLimit || 0,
                createdAt: data.createdAt,
                lastLogin: new Date().toISOString(),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch agent profile' });
    }
});

export default router;
