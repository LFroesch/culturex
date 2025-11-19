import express, { Response } from 'express';
import { validationResult } from 'express-validator';
import Message from '../models/Message';
import User from '../models/User';
import Connection from '../models/Connection';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { messageValidation } from '../utils/validation';

const router = express.Router();

// Get conversations (list of users with messages)
router.get('/conversations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.userId },
            { receiver: req.userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: '$user._id',
            name: '$user.name',
            profilePicture: '$user.profilePicture',
            country: '$user.country'
          },
          lastMessage: 1
        }
      }
    ]);

    res.json(messages);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get messages with a specific user (with cursor pagination for chat history)
router.get('/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { cursor, limit = '50' } = req.query;

    const query: any = {
      $or: [
        { sender: req.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.userId }
      ]
    };

    // For loading older messages, cursor represents the oldest message ID we have
    // We want messages older than this cursor
    if (cursor && typeof cursor === 'string') {
      query._id = { $lt: cursor };
    }

    const limitNum = parseInt(limit as string, 10);

    // Fetch messages in reverse order (newest first) for pagination
    const messages = await Message.find(query)
      .sort({ _id: -1 }) // Newest first for pagination
      .limit(limitNum + 1);

    const hasMore = messages.length > limitNum;
    const messagesToReturn = hasMore ? messages.slice(0, limitNum) : messages;

    // Reverse to get chronological order (oldest first) for display
    messagesToReturn.reverse();

    const nextCursor = hasMore && messages.length > 0
      ? messages[limitNum - 1]._id.toString() // The oldest message in this batch
      : null;

    // Mark messages as read
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.userId, read: false },
      { read: true }
    );

    res.json({
      messages: messagesToReturn,
      pagination: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message
router.post('/', authMiddleware, messageValidation, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { receiver, content } = req.body;

    // Check if receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      res.status(404).json({ error: 'Receiver not found' });
      return;
    }

    // Check if sender is blocked
    if (receiverUser.blockedUsers?.some((id: any) => id.toString() === req.userId)) {
      res.status(403).json({ error: 'Cannot send message to this user' });
      return;
    }

    // Check privacy settings
    if (receiverUser.settings.messagingPrivacy === 'friendsOnly') {
      // Check if they are friends
      const connection = await Connection.findOne({
        $or: [
          { user1: req.userId, user2: receiver, status: 'accepted' },
          { user1: receiver, user2: req.userId, status: 'accepted' }
        ]
      });

      if (!connection) {
        res.status(403).json({ error: 'User only accepts messages from friends' });
        return;
      }
    }

    const message = new Message({
      sender: req.userId,
      receiver,
      content
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get unread message count
router.get('/unread/count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.userId,
      read: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;
