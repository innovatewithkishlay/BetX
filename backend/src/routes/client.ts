import { Router, Response } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { agentGuard, AgentRequest } from '../middleware/agentGuard';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// GET /api/agent/clients
// Fetch all clients managed by the current agent
router.get('/', verifyToken, agentGuard, async (req: AgentRequest, res: Response): Promise<void> => {
    const agentUid = req.agent!.uid;

    try {
        const clientsSnapshot = await db.collection('clients')
            .where('agentUid', '==', agentUid)
            .orderBy('createdAt', 'desc')
            .get();

        const clients = clientsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({ success: true, data: clients });
    } catch (err: any) {
        console.error('Fetch clients error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch clients' });
    }
});

// POST /api/agent/clients
// Create a new client
router.post('/', verifyToken, agentGuard, async (req: AgentRequest, res: Response): Promise<void> => {
    const agentUid = req.agent!.uid;
    const { name, mobile, password, clientLimit } = req.body;

    if (!name || !mobile || !password) {
        res.status(400).json({ success: false, message: 'Name, mobile, and password are required' });
        return;
    }

    try {
        // Auto-generate a client code (e.g., C1001)
        // For simplicity in this demo, we'll use a random number based code
        // In production, you'd use a counter or transaction to ensure sequential codes
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const code = `C${randomNum}`;

        const newClient = {
            agentUid,
            code,
            name,
            mobile,
            password,
            clientLimit: Number(clientLimit) || 0,
            status: 'active',
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection('clients').add(newClient);

        res.status(201).json({
            success: true,
            data: { id: docRef.id, ...newClient },
            message: 'Client created successfully'
        });
    } catch (err: any) {
        console.error('Create client error:', err);
        res.status(500).json({ success: false, message: 'Failed to create client' });
    }
});

// PUT /api/agent/clients/:id
// Update client status or details
router.put('/:id', verifyToken, agentGuard, async (req: AgentRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const agentUid = req.agent!.uid;
    const updates = req.body;

    // Filter allowed internal updates
    const allowedUpdates = ['name', 'mobile', 'status', 'password', 'clientLimit'];
    const filteredUpdates: any = {};
    Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
            filteredUpdates[key] = key === 'clientLimit' ? Number(updates[key]) : updates[key];
        }
    });

    try {
        const clientRef = db.collection('clients').doc(id as string);
        const clientDoc = await clientRef.get();

        if (!clientDoc.exists) {
            res.status(404).json({ success: false, message: 'Client not found' });
            return;
        }

        if (clientDoc.data()?.agentUid !== agentUid) {
            res.status(403).json({ success: false, message: 'Unauthorized access to this client' });
            return;
        }

        await clientRef.update(filteredUpdates);

        res.status(200).json({ success: true, message: 'Client updated successfully' });
    } catch (err: any) {
        console.error('Update client error:', err);
        res.status(500).json({ success: false, message: 'Failed to update client' });
    }
});

// DELETE /api/agent/clients/:id
// Remove a client
router.delete('/:id', verifyToken, agentGuard, async (req: AgentRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const agentUid = req.agent!.uid;

    try {
        const clientRef = db.collection('clients').doc(id as string);
        const clientDoc = await clientRef.get();

        if (!clientDoc.exists) {
            res.status(404).json({ success: false, message: 'Client not found' });
            return;
        }

        if (clientDoc.data()?.agentUid !== agentUid) {
            res.status(403).json({ success: false, message: 'Unauthorized access to delete this client' });
            return;
        }

        await clientRef.delete();

        res.status(200).json({ success: true, message: 'Client deleted successfully' });
    } catch (err: any) {
        console.error('Delete client error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete client' });
    }
});

export default router;
