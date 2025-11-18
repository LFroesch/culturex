import express, { Response } from 'express';
import User from '../models/User';
import Connection from '../models/Connection';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Block user
router.post('/block/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId === req.userId) {
      res.status(400).json({ error: 'Cannot block yourself' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if already blocked
    if (user.blockedUsers?.includes(targetUserId as any)) {
      res.status(400).json({ error: 'User already blocked' });
      return;
    }

    // Add to blocked list
    if (!user.blockedUsers) {
      user.blockedUsers = [];
    }
    user.blockedUsers.push(targetUserId as any);
    await user.save();

    // Remove any existing connections
    await Connection.deleteMany({
      $or: [
        { user1: req.userId, user2: targetUserId },
        { user1: targetUserId, user2: req.userId }
      ]
    });

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Unblock user
router.delete('/unblock/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId;

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove from blocked list
    if (user.blockedUsers) {
      user.blockedUsers = user.blockedUsers.filter(
        (id: any) => id.toString() !== targetUserId
      );
      await user.save();
    }

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// Get blocked users list
router.get('/blocked', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId)
      .populate('blockedUsers', 'username profile.photos profile.bio');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user.blockedUsers || []);
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Failed to get blocked users' });
  }
});

// Check if user is blocked
router.get('/is-blocked/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId;

    // Check if current user blocked target
    const currentUser = await User.findById(req.userId);
    const currentBlocked = currentUser?.blockedUsers?.some(
      (id: any) => id.toString() === targetUserId
    );

    // Check if target blocked current user
    const targetUser = await User.findById(targetUserId);
    const targetBlocked = targetUser?.blockedUsers?.some(
      (id: any) => id.toString() === req.userId
    );

    res.json({
      youBlocked: currentBlocked || false,
      blockedYou: targetBlocked || false,
      blocked: (currentBlocked || targetBlocked) || false
    });
  } catch (error) {
    console.error('Check blocked error:', error);
    res.status(500).json({ error: 'Failed to check block status' });
  }
});

export default router;
