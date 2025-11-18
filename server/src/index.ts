import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import connectionRoutes from './routes/connections';
import messageRoutes from './routes/messages';
import cityRoutes from './routes/cities';
import externalRoutes from './routes/external';
import moderationRoutes from './routes/moderation';
import uploadRoutes from './routes/upload';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import blockingRoutes from './routes/blocking';
import wikipediaRoutes from './routes/wikipedia';
import { setupSocketHandlers } from './socket/handlers';
import { apiLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blocking', blockingRoutes);
app.use('/api/wikipedia', wikipediaRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io setup
setupSocketHandlers(io);

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };
