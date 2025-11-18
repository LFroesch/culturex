import express, { Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import City from '../models/City';
import Connection from '../models/Connection';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { SEED_CITIES } from '../data/seedCitiesData';

const router = express.Router();

// Admin-only middleware
const adminAuth = async (req: AuthRequest, res: Response, next: any) => {
  const user = await User.findById(req.userId);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

// Get system stats
router.get('/stats', authMiddleware, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalPosts,
      pendingPosts,
      approvedPosts,
      totalCities,
      citiesWithContent,
      totalConnections
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Post.countDocuments({ status: 'pending' }),
      Post.countDocuments({ status: 'approved' }),
      City.countDocuments(),
      City.countDocuments({ hasContent: true }),
      Connection.countDocuments({ status: 'accepted' })
    ]);

    res.json({
      users: {
        total: totalUsers,
        moderators: await User.countDocuments({ role: 'moderator' }),
        admins: await User.countDocuments({ role: 'admin' })
      },
      posts: {
        total: totalPosts,
        pending: pendingPosts,
        approved: approvedPosts,
        rejected: await Post.countDocuments({ status: 'rejected' }),
        flagged: await Post.countDocuments({ flagged: true })
      },
      cities: {
        total: totalCities,
        withContent: citiesWithContent
      },
      connections: totalConnections
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get all users (with pagination)
router.get('/users', authMiddleware, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, search, role } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user role
router.put('/users/:id/role', authMiddleware, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Ban/unban user (using a banned field - need to add to User model)
router.put('/users/:id/ban', authMiddleware, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { banned } = req.body;

    // For now, we'll delete the user as we don't have a banned field
    // In production, add a 'banned' field to User model
    if (banned) {
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'User deleted' });
    } else {
      res.status(400).json({ error: 'Unban not implemented - add banned field to User model' });
    }
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Assign moderator to city
router.post('/moderators', authMiddleware, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, cityId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.role !== 'moderator' && user.role !== 'admin') {
      res.status(400).json({ error: 'User must be a moderator or admin' });
      return;
    }

    const city = await City.findByIdAndUpdate(
      cityId,
      { $addToSet: { moderators: userId } },
      { new: true }
    );

    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    res.json(city);
  } catch (error) {
    console.error('Assign moderator error:', error);
    res.status(500).json({ error: 'Failed to assign moderator' });
  }
});

// Remove moderator from city
router.delete('/moderators/:userId/:cityId', authMiddleware, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, cityId } = req.params;

    const city = await City.findByIdAndUpdate(
      cityId,
      { $pull: { moderators: userId } },
      { new: true }
    );

    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    res.json(city);
  } catch (error) {
    console.error('Remove moderator error:', error);
    res.status(500).json({ error: 'Failed to remove moderator' });
  }
});

// Delete any post (admin override)
router.delete('/posts/:id', authMiddleware, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Update city content count
    if (post.status === 'approved') {
      await City.findByIdAndUpdate(post.cityId, {
        $inc: { contentCount: -1 }
      });
    }

    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Reset cities (delete all and re-seed)
router.post('/reset-cities', authMiddleware, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Delete all cities
    await City.deleteMany({});
    console.log('Cleared all cities');

    // Insert seed cities
    await City.insertMany(SEED_CITIES);
    console.log(`Seeded ${SEED_CITIES.length} cities`);

    res.json({
      message: 'Cities reset successfully',
      count: SEED_CITIES.length
    });
  } catch (error) {
    console.error('Reset cities error:', error);
    res.status(500).json({ error: 'Failed to reset cities' });
  }
});

export default router;
