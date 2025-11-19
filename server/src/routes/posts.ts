import express, { Response } from 'express';
import { validationResult } from 'express-validator';
import Post from '../models/Post';
import City from '../models/City';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { postValidation } from '../utils/validation';
import { moderateContent, checkDuplicateContent } from '../utils/contentModeration';
import { postLimiter } from '../middleware/rateLimiter';
import Notification from '../models/Notification';

const router = express.Router();

// Get activity feed (posts from friends) with cursor pagination
router.get('/feed/activity', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { cursor, limit = '20' } = req.query;
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

    // Build query with cursor for pagination
    const query: any = {
      userId: { $in: friendIds },
      status: 'approved'
    };

    // If cursor provided, only get posts older than cursor
    if (cursor && typeof cursor === 'string') {
      query._id = { $lt: cursor };
    }

    // Get approved posts from friends
    const limitNum = parseInt(limit as string, 10);
    const posts = await Post.find(query)
      .populate('userId', 'username profile.photos')
      .populate('cityId', 'name country')
      .populate('comments.user', 'username profile.photos')
      .sort({ _id: -1 }) // Sort by _id DESC for cursor pagination
      .limit(limitNum + 1); // Fetch one extra to check if there are more

    // Check if there are more posts
    const hasMore = posts.length > limitNum;
    const postsToReturn = hasMore ? posts.slice(0, limitNum) : posts;
    const nextCursor = hasMore && postsToReturn.length > 0
      ? postsToReturn[postsToReturn.length - 1]._id.toString()
      : null;

    res.json({
      posts: postsToReturn,
      pagination: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ error: 'Failed to get activity feed' });
  }
});

// Search posts with cursor pagination
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { q, type, cityId, cursor, limit = '20' } = req.query;

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

    // Cursor pagination
    if (cursor && typeof cursor === 'string') {
      query._id = { $lt: cursor };
    }

    const limitNum = parseInt(limit as string, 10);
    const posts = await Post.find(query)
      .populate('userId', 'username profile.photos')
      .populate('cityId', 'name country')
      .sort({ _id: -1 })
      .limit(limitNum + 1);

    const hasMore = posts.length > limitNum;
    const postsToReturn = hasMore ? posts.slice(0, limitNum) : posts;
    const nextCursor = hasMore && postsToReturn.length > 0
      ? postsToReturn[postsToReturn.length - 1]._id.toString()
      : null;

    res.json({
      posts: postsToReturn,
      pagination: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get all posts with cursor pagination
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, cursor, limit = '20' } = req.query;
    const query: any = { status: 'approved' }; // Only show approved posts

    if (userId) {
      query.userId = userId;
    }

    // Cursor pagination
    if (cursor && typeof cursor === 'string') {
      query._id = { $lt: cursor };
    }

    const limitNum = parseInt(limit as string, 10);
    const posts = await Post.find(query)
      .populate('userId', 'username profile.photos')
      .populate('comments.user', 'username profile.photos')
      .sort({ _id: -1 })
      .limit(limitNum + 1);

    const hasMore = posts.length > limitNum;
    const postsToReturn = hasMore ? posts.slice(0, limitNum) : posts;
    const nextCursor = hasMore && postsToReturn.length > 0
      ? postsToReturn[postsToReturn.length - 1]._id.toString()
      : null;

    res.json({
      posts: postsToReturn,
      pagination: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Get single post
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'username profile.photos')
      .populate('comments.user', 'username profile.photos');

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
    const { title, description, type, cityId, cityData, tags, photos, metadata } = req.body;

    // Validate required fields
    if (!title || !type) {
      res.status(400).json({ error: 'Title and type are required' });
      return;
    }

    // Handle city creation/update
    // If cityId is provided, verify it exists. If cityData is provided, create new city
    let finalCityId = cityId;

    if (!cityId && cityData) {
      // City doesn't exist in DB yet (was temporary from /from-coordinates)
      // Create it now since user is posting to it
      const newCity = new City({
        name: cityData.name,
        country: cityData.country,
        coordinates: cityData.coordinates,
        isSeed: false,
        contentCount: 0,
        hasContent: false
      });
      await newCity.save();
      finalCityId = newCity._id;
    } else if (!cityId) {
      res.status(400).json({ error: 'City information is required' });
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
      cityId: finalCityId,
      type,
      title,
      description,
      photos: photos || [],
      tags: tags || [],
      metadata: metadata || {},
      flagged: moderationResult.flagged,
      flagReasons: moderationResult.reasons,
      status: 'pending'
    });

    await post.save();

    // Update city content count and hasContent flag
    // This happens when post is approved by moderator (see approval route)

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

// Add comment (supports nested replies via parentCommentId)
router.post('/:id/comment', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text, parentCommentId } = req.body;

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: 'Comment text is required' });
      return;
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // If replying to a comment, verify the parent comment exists
    if (parentCommentId) {
      const parentExists = post.comments.some((c: any) => c._id.toString() === parentCommentId);
      if (!parentExists) {
        res.status(404).json({ error: 'Parent comment not found' });
        return;
      }
    }

    post.comments.push({
      user: req.userId as any,
      text,
      parentCommentId: parentCommentId || null,
      createdAt: new Date()
    } as any);

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
    comment.updatedAt = new Date();
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
