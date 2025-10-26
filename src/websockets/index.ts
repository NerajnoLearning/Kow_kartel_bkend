import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import logger from '../config/logger';
import { env } from '../config/env';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

let io: SocketIOServer;

/**
 * Initialize Socket.IO server
 */
export const initializeWebSocket = (httpServer: HTTPServer): SocketIOServer => {
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim());

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('WebSocket connection rejected: No token provided');
      return next(new Error('Authentication token required'));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.userRole = payload.role;
      socket.userEmail = payload.email;

      logger.info(`WebSocket authenticated: User ${payload.userId} (${payload.role})`);
      next();
    } catch (error) {
      logger.warn('WebSocket authentication failed:', error);
      return next(new Error('Invalid authentication token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`WebSocket client connected: ${socket.id} (User: ${socket.userId})`);

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      logger.info(`User ${socket.userId} joined room: user:${socket.userId}`);
    }

    // Join role-specific rooms
    if (socket.userRole === 'admin' || socket.userRole === 'logistics') {
      socket.join('admin');
      logger.info(`User ${socket.userId} joined admin room`);
    }

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket client disconnected: ${socket.id}, Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`WebSocket error for client ${socket.id}:`, error);
    });

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Successfully connected to WebSocket server',
      userId: socket.userId,
      timestamp: new Date().toISOString(),
    });
  });

  logger.info('✅ WebSocket server initialized');
  return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeWebSocket first.');
  }
  return io;
};

/**
 * Emit event to specific user
 */
export const emitToUser = (userId: string, event: string, data: any): void => {
  try {
    const socketIO = getIO();
    socketIO.to(`user:${userId}`).emit(event, data);
    logger.info(`Emitted ${event} to user ${userId}`);
  } catch (error) {
    logger.error(`Failed to emit to user ${userId}:`, error);
  }
};

/**
 * Emit event to all admins
 */
export const emitToAdmins = (event: string, data: any): void => {
  try {
    const socketIO = getIO();
    socketIO.to('admin').emit(event, data);
    logger.info(`Emitted ${event} to all admins`);
  } catch (error) {
    logger.error('Failed to emit to admins:', error);
  }
};

/**
 * Broadcast event to all connected clients
 */
export const broadcastEvent = (event: string, data: any): void => {
  try {
    const socketIO = getIO();
    socketIO.emit(event, data);
    logger.info(`Broadcasted ${event} to all clients`);
  } catch (error) {
    logger.error('Failed to broadcast event:', error);
  }
};

export default {
  initializeWebSocket,
  getIO,
  emitToUser,
  emitToAdmins,
  broadcastEvent,
};
