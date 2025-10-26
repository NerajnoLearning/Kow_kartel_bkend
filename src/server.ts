import { Server } from 'http';
import app from './app';
import { env } from './config/env';
import logger from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/db';
import { initializeWebSocket, getIO } from './websockets';

const PORT = parseInt(env.PORT, 10) || 5000;

let server: Server;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start Express server
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`📍 API Base URL: http://localhost:${PORT}/api/${env.API_VERSION}`);
    });

    // Initialize WebSocket server
    initializeWebSocket(server);
    logger.info(`🔌 WebSocket server running on port ${PORT}`);

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: Error, promise: Promise<unknown>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdownGracefully('UNHANDLED_REJECTION');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      shutdownGracefully('UNCAUGHT_EXCEPTION');
    });

    // Handle SIGTERM signal
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      shutdownGracefully('SIGTERM');
    });

    // Handle SIGINT signal (Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      shutdownGracefully('SIGINT');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdownGracefully = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Close server to stop accepting new connections
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close WebSocket connections
        const io = getIO();
        io.close(() => {
          logger.info('WebSocket server closed');
        });

        // Disconnect from database
        await disconnectDatabase();
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Start the server
startServer();
