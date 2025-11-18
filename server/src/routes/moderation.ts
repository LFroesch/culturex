import express, { Response } from 'express';
import Post from '../models/Post';
import City from '../models/City';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { createNotification } from '../services/notificationService';
import { io } from '../index';

const router = express.Router();

// Middleware to check if user is moderator or admin
const moderatorAuth = async (req: AuthRequest, res: Response, next: any) => {
  const user = await User.findById(req.userId);
  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    res.status(403).json({ error: 'Moderator access required' });
    return;
  }
  next();
};

// Get pending posts
router.get('/pending', authMiddleware, moderatorAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { cityId } = req.query;
    const user = await User.findById(req.userId);

    const query: any = { status: 'pending' };

    // If user is moderator (not admin), only show posts from their cities
    if (user?.role === 'moderator') {
      const cities = await City.find({ moderators: req.userId });
      const cityIds = cities.map(c => c._id);
      query.cityId = { $in: cityIds };
    }

    if (cityId) {
      query.cityId = cityId;
    }

    const posts = await Post.find(query)
      .populate('userId', 'username profile.photos')
      .populate('cityId', 'name country')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(posts);
  } catch (error) {
    console.error('Get pending posts error:', error);
    res.status(500).json({ error: 'Failed to get pending posts' });
  }
});

// Approve post
router.put('/posts/:id/approve', authMiddleware, moderatorAuth, async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    post.status = 'approved';
    post.moderatorId = req.userId as any;
    post.approvedAt = new Date();
    await post.save();

    // Update city content count
    await City.findByIdAndUpdate(post.cityId, {
      $inc: { contentCount: 1 },
      hasContent: true
    });

    // Send notification to post author
    await createNotification(
      io,
      post.userId.toString(),
      'postApproved',
      String(post._id),
      `Your post "${post.title}" has been approved`
    );

    res.json(post);
  } catch (error) {
    console.error('Approve post error:', error);
    res.status(500).json({ error: 'Failed to approve post' });
  }
});

// Reject post
router.put('/posts/:id/reject', authMiddleware, moderatorAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    post.status = 'rejected';
    post.moderatorId = req.userId as any;
    if (reason) {
      post.flagReasons.push(reason);
    }
    await post.save();

    // Send notification to post author
    const rejectionMsg = reason
      ? `Your post "${post.title}" was rejected. Reason: ${reason}`
      : `Your post "${post.title}" was rejected`;

    await createNotification(
      io,
      post.userId.toString(),
      'postRejected',
      String(post._id),
      rejectionMsg
    );

    res.json(post);
  } catch (error) {
    console.error('Reject post error:', error);
    res.status(500).json({ error: 'Failed to reject post' });
  }
});

// Get flagged posts
router.get('/flagged', authMiddleware, moderatorAuth, async (req: AuthRequest, res: Response) => {
  try {
    const posts = await Post.find({ flagged: true })
      .populate('userId', 'username profile.photos')
      .populate('cityId', 'name country')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(posts);
  } catch (error) {
    console.error('Get flagged posts error:', error);
    res.status(500).json({ error: 'Failed to get flagged posts' });
  }
});

export default router;
