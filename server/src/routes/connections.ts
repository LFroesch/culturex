import express, { Response } from 'express';
import Connection from '../models/Connection';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { createNotification } from '../services/notificationService';
import { io } from '../index';

const router = express.Router();

// Get user's connections
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const query: any = {
      $or: [
        { user1: req.userId },
        { user2: req.userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    const connections = await Connection.find(query)
      .populate('user1', 'name country languages profilePicture')
      .populate('user2', 'name country languages profilePicture')
      .sort({ createdAt: -1 });

    res.json(connections);
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'Failed to get connections' });
  }
});

// Send connection request
router.post('/request/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId === req.userId) {
      res.status(400).json({ error: 'Cannot connect with yourself' });
      return;
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { user1: req.userId, user2: targetUserId },
        { user1: targetUserId, user2: req.userId }
      ]
    });

    if (existingConnection) {
      res.status(400).json({ error: 'Connection already exists' });
      return;
    }

    const connection = new Connection({
      user1: req.userId,
      user2: targetUserId,
      requestedBy: req.userId,
      status: 'pending'
    });

    await connection.save();
    await connection.populate('user1 user2', 'name country languages profilePicture');

    // Send notification to target user
    await createNotification(
      io,
      targetUserId,
      'friendRequest',
      String(connection._id),
      `${(connection.user1 as any).name} sent you a friend request`
    );

    res.status(201).json(connection);
  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({ error: 'Failed to send connection request' });
  }
});

// Accept/reject connection
router.put('/:connectionId/:action', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { connectionId, action } = req.params;

    if (!['accept', 'reject'].includes(action)) {
      res.status(400).json({ error: 'Invalid action' });
      return;
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    // Ensure the user is the receiver of the request
    const isReceiver = connection.user2.toString() === req.userId;
    if (!isReceiver) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    connection.status = action === 'accept' ? 'accepted' : 'rejected';
    await connection.save();
    await connection.populate('user1 user2', 'name country languages profilePicture');

    // Send notification if accepted
    if (action === 'accept') {
      await createNotification(
        io,
        connection.requestedBy.toString(),
        'friendAccepted',
        String(connection._id),
        `${(connection.user2 as any).name} accepted your friend request`
      );
    }

    res.json(connection);
  } catch (error) {
    console.error('Update connection error:', error);
    res.status(500).json({ error: 'Failed to update connection' });
  }
});

// Delete connection
router.delete('/:connectionId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    const isParticipant =
      connection.user1.toString() === req.userId ||
      connection.user2.toString() === req.userId;

    if (!isParticipant) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await Connection.findByIdAndDelete(req.params.connectionId);
    res.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Delete connection error:', error);
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

export default router;
