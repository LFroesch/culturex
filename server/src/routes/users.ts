import express, { Response } from 'express';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all users (for discovery)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { search, country, language } = req.query;
    const query: any = { _id: { $ne: req.userId } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    if (country) {
      query.country = country;
    }

    if (language) {
      query.languages = language;
    }

    const users = await User.find(query)
      .select('-password')
      .limit(50)
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, country, languages, languagesToLearn, interests, bio, age, profilePicture } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (country !== undefined) updateData.country = country;
    if (languages !== undefined) updateData.languages = languages;
    if (languagesToLearn !== undefined) updateData.languagesToLearn = languagesToLearn;
    if (interests !== undefined) updateData.interests = interests;
    if (bio !== undefined) updateData.bio = bio;
    if (age !== undefined) updateData.age = age;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
