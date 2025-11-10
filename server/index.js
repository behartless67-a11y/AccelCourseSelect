const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { pool } = require('./database/db');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const selectionRoutes = require('./routes/selections');
const adminRoutes = require('./routes/admin');
const { authenticateSocket } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/selections', selectionRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connection handling
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`🔌 New socket connection: ${socket.id}`);

  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const user = await authenticateSocket(token);
      if (user) {
        socket.userId = user.id;
        socket.userRole = user.role;
        connectedUsers.set(user.id, socket.id);
        socket.emit('authenticated', { userId: user.id, role: user.role });
        console.log(`✅ Socket authenticated: User ${user.id} (${user.role})`);
      } else {
        socket.emit('authentication_error', { message: 'Invalid token' });
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('authentication_error', { message: 'Authentication failed' });
    }
  });

  // Join a term room for real-time updates
  socket.on('join_term', (termId) => {
    socket.join(`term_${termId}`);
    console.log(`User ${socket.userId} joined term ${termId}`);
  });

  // Leave a term room
  socket.on('leave_term', (termId) => {
    socket.leave(`term_${termId}`);
    console.log(`User ${socket.userId} left term ${termId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`🔌 User ${socket.userId} disconnected`);
    }
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  🎓 Accelerated Course Selection System Server        ║
║  ✅ Server running on port ${PORT}                       ║
║  🌐 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}           ║
║  🔌 WebSocket ready for real-time updates             ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end();
  });
});

module.exports = { app, io };
