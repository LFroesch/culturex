import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message';
import Notification from '../models/Notification';

interface AuthSocket extends Socket {
  userId?: string;
}

const userSockets = new Map<string, string>();
const onlineUsers = new Map<string, Date>();

export const setupSocketHandlers = (io: Server) => {
  io.use((socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log('User connected:', socket.userId);

    if (socket.userId) {
      userSockets.set(socket.userId, socket.id);
      onlineUsers.set(socket.userId, new Date());

      socket.emit('connected', { userId: socket.userId });

      // Broadcast online status to friends
      socket.broadcast.emit('user_online', { userId: socket.userId });

      // Send unread notifications count
      Notification.countDocuments({ userId: socket.userId, read: false }).then(count => {
        socket.emit('unread_notifications', { count });
      });
    }

    socket.on('send_message', async (data) => {
      try {
        const { receiver, content } = data;

        const message = new Message({
          sender: socket.userId,
          receiver,
          content
        });

        await message.save();

        // Send to receiver if online
        const receiverSocketId = userSockets.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', message);
        }

        // Confirm to sender
        socket.emit('message_sent', message);
      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    socket.on('typing', (data) => {
      const { receiver } = data;
      const receiverSocketId = userSockets.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', { userId: socket.userId });
      }
    });

    socket.on('stop_typing', (data) => {
      const { receiver } = data;
      const receiverSocketId = userSockets.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_stop_typing', { userId: socket.userId });
      }
    });

    socket.on('check_user_status', (data, callback) => {
      const { userId } = data;
      const isOnline = onlineUsers.has(userId);
      if (callback) {
        callback({ isOnline });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      if (socket.userId) {
        userSockets.delete(socket.userId);
        onlineUsers.delete(socket.userId);

        // Broadcast offline status
        socket.broadcast.emit('user_offline', { userId: socket.userId });
      }
    });
  });
};

// Helper function to send notification in real-time
export const sendNotification = async (io: Server, notification: any) => {
  const userSocketId = userSockets.get(notification.userId.toString());
  if (userSocketId) {
    io.to(userSocketId).emit('new_notification', notification);
  }
};

// Helper function to check if user is online
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

// Helper function to get online users
export const getOnlineUsers = (): string[] => {
  return Array.from(onlineUsers.keys());
};
