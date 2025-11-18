import express, { Response } from 'express';
import { validationResult } from 'express-validator';
import Post from '../models/Post';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { postValidation } from '../utils/validation';
import { moderateContent, checkDuplicateContent } from '../utils/contentModeration';
import { postLimiter } from '../middleware/rateLimiter';
import Notification from '../models/Notification';

const router = express.Router();

// Get activity feed (posts from friends)
router.get('/feed/activity', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const Connection = require('../models/Connection');

    // Get user's accepted connections
    const connections = await Connection.find({
      $or: [
        { user1: req.userId, status: 'accepted' },
        { user2: req.userId, status: 'accepted' }
      ]
    });

    // Extract friend IDs
    const friendIds = connections.map((conn: any) => {
      return conn.user1.toString() === req.userId
        ? conn.user2
        : conn.user1;
    });

    // Add current user to see their own posts
    friendIds.push(req.userId);

    // Get approved posts from friends
    const posts = await Post.find({
      userId: { $in: friendIds },
      status: 'approved'
    })
      .populate('userId', 'name country profilePicture')
      .populate('cityId', 'name country')
      .populate('comments.user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ error: 'Failed to get activity feed' });
  }
});

// Search posts
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { q, type, cityId, limit = '20' } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Search query required' });
      return;
    }

    const searchRegex = new RegExp(q, 'i'); // Case-insensitive regex search

    const query: any = {
      status: 'approved',
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { 'metadata.artist': searchRegex },
        { 'metadata.locationDetails': searchRegex }
      ]
    };

    if (type) {
      query.type = type;
    }

    if (cityId) {
      query.cityId = cityId;
    }

    const posts = await Post.find(query)
      .populate('userId', 'name country profilePicture')
      .populate('cityId', 'name country')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    res.json(posts);
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get all posts
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { category, author } = req.query;
    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (author) {
      query.author = author;
    }

    const posts = await Post.find(query)
      .populate('author', 'name country profilePicture')
      .populate('comments.user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Get single post
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name country profilePicture')
      .populate('comments.user', 'name profilePicture');

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// Create post
router.post('/', authMiddleware, postLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, type, cityId, tags, photos, metadata } = req.body;

    // Validate required fields
    if (!title || !type || !cityId) {
      res.status(400).json({ error: 'Title, type, and cityId are required' });
      return;
    }

    // Auto-moderate content
    const moderationResult = moderateContent(description || '', title);

    // Check for duplicate content
    const isDuplicate = await checkDuplicateContent(description || title, req.userId!, Post);
    if (isDuplicate) {
      moderationResult.flagged = true;
      moderationResult.reasons.push('Duplicate content detected');
    }

    const post = new Post({
      userId: req.userId,
      cityId,
      type,
      title,
      description,
      photos: photos || [],
      tags: tags || [],
      metadata: metadata || {},
      flagged: moderationResult.flagged,
      flagReasons: moderationResult.reasons,
      status: 'pending',
      // Legacy fields
      author: req.userId,
      content: description
    });

    await post.save();
    await post.populate('userId', 'username profile.photos');

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Like/unlike post
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const userIdStr = req.userId!.toString();
    const likeIndex = post.likes.findIndex(id => id.toString() === userIdStr);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.userId as any);
    }

    await post.save();
    res.json({ likes: post.likes.length, liked: likeIndex === -1 });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Add comment
router.post('/:id/comment', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: 'Comment text is required' });
      return;
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    post.comments.push({
      user: req.userId as any,
      text,
      createdAt: new Date()
    });

    await post.save();
    await post.populate('comments.user', 'name profilePicture username');

    res.json(post.comments[post.comments.length - 1]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Edit comment
router.put('/:postId/comment/:commentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: 'Comment text is required' });
      return;
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const comment = post.comments.find((c: any) => c._id.toString() === req.params.commentId);
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Check ownership
    if (comment.user.toString() !== req.userId) {
      res.status(403).json({ error: 'Not authorized to edit this comment' });
      return;
    }

    comment.text = text;
    await post.save();
    await post.populate('comments.user', 'name profilePicture username');

    res.json(comment);
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(500).json({ error: 'Failed to edit comment' });
  }
});

// Delete comment
router.delete('/:postId/comment/:commentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const commentIndex = post.comments.findIndex((c: any) => c._id.toString() === req.params.commentId);
    if (commentIndex === -1) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const comment = post.comments[commentIndex];

    // Check ownership or if user is post author
    if (comment.user.toString() !== req.userId && post.userId.toString() !== req.userId) {
      res.status(403).json({ error: 'Not authorized to delete this comment' });
      return;
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Edit post
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Check ownership
    if (post.userId.toString() !== req.userId && post.author?.toString() !== req.userId) {
      res.status(403).json({ error: 'Not authorized to edit this post' });
      return;
    }

    // Only allow editing if post is pending or rejected (not approved yet)
    if (post.status === 'approved') {
      res.status(400).json({ error: 'Cannot edit approved posts. Create a new post instead.' });
      return;
    }

    const { title, description, tags, photos, metadata } = req.body;

    // Update fields
    if (title) post.title = title;
    if (description !== undefined) post.description = description;
    if (tags) post.tags = tags;
    if (photos) post.photos = photos;
    if (metadata) post.metadata = { ...post.metadata, ...metadata };

    // Re-moderate content
    const { moderateContent } = await import('../utils/contentModeration');
    const moderationResult = moderateContent(post.description || '', post.title);
    post.flagged = moderationResult.flagged;
    post.flagReasons = moderationResult.reasons;

    // Reset to pending if it was rejected
    if (post.status === 'rejected') {
      post.status = 'pending';
      post.moderatorId = undefined;
    }

    await post.save();
    await post.populate('userId', 'username profile.photos');

    res.json(post);
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ error: 'Failed to edit post' });
  }
});

// Save/bookmark post
router.post('/:id/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const User = (await import('../models/User')).default;
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.savedPosts) {
      user.savedPosts = [];
    }

    const postId = req.params.id;
    const alreadySaved = user.savedPosts.some((id: any) => id.toString() === postId);

    if (alreadySaved) {
      res.status(400).json({ error: 'Post already saved' });
      return;
    }

    user.savedPosts.push(postId as any);
    await user.save();

    res.json({ message: 'Post saved successfully', saved: true });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

// Unsave/unbookmark post
router.delete('/:id/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const User = (await import('../models/User')).default;
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.savedPosts) {
      user.savedPosts = user.savedPosts.filter(
        (id: any) => id.toString() !== req.params.id
      );
      await user.save();
    }

    res.json({ message: 'Post unsaved successfully', saved: false });
  } catch (error) {
    console.error('Unsave post error:', error);
    res.status(500).json({ error: 'Failed to unsave post' });
  }
});

// Get saved posts
router.get('/saved/list', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const User = (await import('../models/User')).default;
    const user = await User.findById(req.userId)
      .populate({
        path: 'savedPosts',
        populate: {
          path: 'userId',
          select: 'username profile.photos'
        }
      });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user.savedPosts || []);
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ error: 'Failed to get saved posts' });
  }
});

// Delete post
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (!post.author || post.author.toString() !== req.userId) {
      res.status(403).json({ error: 'Not authorized to delete this post' });
      return;
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
