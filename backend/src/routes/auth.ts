import { Router, Response } from 'express';
import { z } from 'zod';
import { verifyToken, AuthRequest } from '../middleware/verifyToken';
import { agentGuard, AgentRequest } from '../middleware/agentGuard';

const router = Router();

// Zod schema for body validation (token also comes via header, but we validate header presence separately)
const VerifyBodySchema = z.object({}).optional();

// POST /api/auth/verify
// Accepts Bearer token in Authorization header, verifies it, checks role
router.post('/verify', verifyToken, agentGuard, (req: AgentRequest, res: Response): void => {
    const agent = req.agent!;

    res.status(200).json({
        success: true,
        message: 'Token verified successfully',
        data: {
            uid: agent.uid,
            email: agent.email,
            role: agent.role,
            status: agent.status,
        },
    });
});

export default router;
