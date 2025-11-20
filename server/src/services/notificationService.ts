import Notification from '../models/Notification';
import User from '../models/User';
import { Server } from 'socket.io';

// Create notification and send via Socket.io
export const createNotification = async (
  io: Server,
  userId: string,
  type: 'friendRequest' | 'friendAccepted' | 'message' | 'postApproved' | 'postRejected' | 'postLiked' | 'postCommented' | 'commentReplied',
  relatedId: string,
  content: string,
  fromUserId?: string
) => {
  try {
    // Don't notify yourself
    if (userId === fromUserId) {
      return null;
    }

    const notification = new Notification({
      userId,
      type,
      relatedId,
      fromUserId,
      content,
      read: false
    });

    await notification.save();

    // Send via Socket.io if user is online
    const { sendNotification } = await import('../socket/handlers');
    await sendNotification(io, notification);

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Create a notification for post like
export const createLikeNotification = async (
  io: Server,
  postOwnerId: string,
  postId: string,
  likerUserId: string,
  postTitle: string
) => {
  try {
    const liker = await User.findById(likerUserId);
    if (!liker) return null;

    return await createNotification(
      io,
      postOwnerId,
      'postLiked',
      postId,
      `${liker.username} liked your post "${postTitle.substring(0, 50)}${postTitle.length > 50 ? '...' : ''}"`,
      likerUserId
    );
  } catch (error) {
    console.error('Create like notification error:', error);
    return null;
  }
};

// Create a notification for new comment
export const createCommentNotification = async (
  io: Server,
  postOwnerId: string,
  postId: string,
  commenterUserId: string,
  postTitle: string
) => {
  try {
    const commenter = await User.findById(commenterUserId);
    if (!commenter) return null;

    return await createNotification(
      io,
      postOwnerId,
      'postCommented',
      postId,
      `${commenter.username} commented on your post "${postTitle.substring(0, 50)}${postTitle.length > 50 ? '...' : ''}"`,
      commenterUserId
    );
  } catch (error) {
    console.error('Create comment notification error:', error);
    return null;
  }
};

// Create a notification for comment reply
export const createReplyNotification = async (
  io: Server,
  originalCommenterId: string,
  postId: string,
  replierUserId: string,
  postTitle: string
) => {
  try {
    const replier = await User.findById(replierUserId);
    if (!replier) return null;

    return await createNotification(
      io,
      originalCommenterId,
      'commentReplied',
      postId,
      `${replier.username} replied to your comment on "${postTitle.substring(0, 50)}${postTitle.length > 50 ? '...' : ''}"`,
      replierUserId
    );
  } catch (error) {
    console.error('Create reply notification error:', error);
    return null;
  }
};
