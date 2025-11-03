import dotenv from 'dotenv';
import { createApp } from './app';
import prisma from './infrastructure/database/prisma';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = createApp();

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🔄 Shutting down gracefully...');
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
    
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
