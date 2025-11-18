import Notification from '../models/Notification';
import { Server } from 'socket.io';

// Create notification and send via Socket.io
export const createNotification = async (
  io: Server,
  userId: string,
  type: 'friendRequest' | 'friendAccepted' | 'message' | 'postApproved' | 'postRejected',
  relatedId: string,
  content: string
) => {
  try {
    const notification = new Notification({
      userId,
      type,
      relatedId,
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
