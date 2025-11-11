const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const mockData = require('./mockData');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT Helper
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'mock-secret-key',
    { expiresIn: '7d' }
  );
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { message: 'Access token required' } });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mock-secret-key');
    const user = mockData.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: { message: 'User not found' } });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: { message: 'Invalid or expired token' } });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Admin access required' } });
  }
  next();
};

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName, studentId } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: { message: 'All fields are required' } });
  }

  const existingUser = mockData.findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: { message: 'User with this email already exists' } });
  }

  const newUser = mockData.addUser(email, password, firstName, lastName, studentId);
  const token = generateToken(newUser);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      role: newUser.role,
    },
    token,
  });
});

// Login (TEST MODE - Password not validated)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Login attempt (TEST MODE - password not validated):', email);

  if (!email || !password) {
    console.log('❌ Missing credentials');
    return res.status(400).json({ error: { message: 'Email and password are required' } });
  }

  const user = mockData.findUserByEmail(email);
  if (!user) {
    console.log('❌ User not found:', email);
    return res.status(401).json({ error: { message: 'Invalid credentials' } });
  }

  console.log('✅ User found:', user.email, '| Skipping password validation (TEST MODE)');
  const token = generateToken(user);
  console.log('✅ Login successful (TEST MODE):', user.email);

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    },
    token,
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      role: req.user.role,
    },
  });
});

// Verify token
app.post('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      role: req.user.role,
    },
  });
});

// ============ COURSES ROUTES ============

// Get all courses for a term
app.get('/api/courses/term/:termId', authenticateToken, (req, res) => {
  const courses = mockData.getCoursesByTerm(parseInt(req.params.termId));
  res.json({ courses, count: courses.length });
});

// Get active term
app.get('/api/courses/terms/active', authenticateToken, (req, res) => {
  const term = mockData.getActiveTerm();
  if (!term) {
    return res.status(404).json({ error: { message: 'No active term found' } });
  }
  res.json({ term });
});

// Get all terms
app.get('/api/courses/terms/list', authenticateToken, (req, res) => {
  res.json({ terms: mockData.terms });
});

// ============ SELECTIONS ROUTES ============

// Get user's selections
app.get('/api/selections/term/:termId', authenticateToken, (req, res) => {
  const selections = mockData.getUserSelections(req.user.id, parseInt(req.params.termId));
  res.json({ selections });
});

// Select a course
app.post('/api/selections/select', authenticateToken, (req, res) => {
  const { courseId, termId, preferenceRank } = req.body;

  if (!courseId || !termId || !preferenceRank) {
    return res.status(400).json({ error: { message: 'Course ID, term ID, and preference rank are required' } });
  }

  if (preferenceRank < 1 || preferenceRank > 3) {
    return res.status(400).json({ error: { message: 'Preference rank must be between 1 and 3' } });
  }

  const selection = mockData.addSelection(req.user.id, courseId, termId, preferenceRank);

  // Broadcast real-time update
  const courses = mockData.getCoursesByTerm(termId);
  const updatedCourse = courses.find(c => c.id === courseId);
  io.to(`term_${termId}`).emit('course_updated', updatedCourse);

  res.status(201).json({
    message: 'Selection saved successfully',
    selection,
  });
});

// Remove a selection
app.delete('/api/selections/:selectionId', authenticateToken, (req, res) => {
  const success = mockData.removeSelection(parseInt(req.params.selectionId), req.user.id);

  if (!success) {
    return res.status(404).json({ error: { message: 'Selection not found' } });
  }

  // Broadcast update
  const term = mockData.getActiveTerm();
  const courses = mockData.getCoursesByTerm(term.id);
  courses.forEach(course => {
    io.to(`term_${term.id}`).emit('course_updated', course);
  });

  res.json({ message: 'Selection removed successfully' });
});

// ============ ADMIN ROUTES ============

// Get all student selections
app.get('/api/admin/selections/term/:termId', authenticateToken, requireAdmin, (req, res) => {
  const students = mockData.getAllStudentSelections(parseInt(req.params.termId));
  res.json({ students });
});

// Create a new course
app.post('/api/admin/courses', authenticateToken, requireAdmin, (req, res) => {
  const { termId, groupCode, code, name, courseType, sectionNumber, capacity, schedule, instructor, room } = req.body;

  if (!termId || !code || !name || !capacity) {
    return res.status(400).json({ error: { message: 'Required fields missing: termId, code, name, capacity' } });
  }

  const newCourse = mockData.addCourse({
    termId: parseInt(termId),
    groupCode: groupCode || 'OTHER',
    code,
    name,
    courseType,
    sectionNumber,
    capacity,
    schedule,
    instructor,
    room,
  });

  res.status(201).json({ course: newCourse });
});

// Update a course
app.put('/api/admin/courses/:courseId', authenticateToken, requireAdmin, (req, res) => {
  const { courseId } = req.params;
  const { capacity, schedule, instructor, room, code, name, courseType, sectionNumber, groupCode } = req.body;

  const updates = {};
  if (capacity !== undefined) updates.capacity = parseInt(capacity);
  if (schedule !== undefined) updates.schedule = schedule;
  if (instructor !== undefined) updates.instructor = instructor;
  if (room !== undefined) updates.room = room;
  if (code !== undefined) updates.code = code;
  if (name !== undefined) updates.name = name;
  if (courseType !== undefined) updates.course_type = courseType;
  if (sectionNumber !== undefined) updates.section_number = sectionNumber;
  if (groupCode !== undefined) {
    updates.group_code = groupCode;
    updates.group_name = groupCode;
  }

  const updatedCourse = mockData.updateCourse(parseInt(courseId), updates);

  if (!updatedCourse) {
    return res.status(404).json({ error: { message: 'Course not found' } });
  }

  // Broadcast update
  const term = mockData.getActiveTerm();
  io.to(`term_${term.id}`).emit('course_updated', updatedCourse);

  res.json({ course: updatedCourse });
});

// Delete a course
app.delete('/api/admin/courses/:courseId', authenticateToken, requireAdmin, (req, res) => {
  const { courseId } = req.params;

  const success = mockData.deleteCourse(parseInt(courseId));

  if (!success) {
    return res.status(404).json({ error: { message: 'Course not found' } });
  }

  res.json({ message: 'Course deleted successfully' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'mock', timestamp: new Date().toISOString() });
});

// WebSocket connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 New socket connection: ${socket.id}`);

  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mock-secret-key');
      const user = mockData.findUserById(decoded.userId);
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
      socket.emit('authentication_error', { message: 'Authentication failed' });
    }
  });

  socket.on('join_term', (termId) => {
    socket.join(`term_${termId}`);
    console.log(`User ${socket.userId} joined term ${termId}`);
  });

  socket.on('leave_term', (termId) => {
    socket.leave(`term_${termId}`);
    console.log(`User ${socket.userId} left term ${termId}`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`🔌 User ${socket.userId} disconnected`);
    }
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
║  🎓 Accelerated Course Selection System (MOCK MODE)   ║
║  ✅ Server running on port ${PORT}                       ║
║  🌐 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3001'}           ║
║  🔌 WebSocket ready for real-time updates             ║
║  📊 Using mock in-memory database                     ║
╚════════════════════════════════════════════════════════╝

Test Accounts:
  Admin:     admin@batten.virginia.edu / admin123
  Student1:  student1@virginia.edu / password123
  Student2:  student2@virginia.edu / password123
  Student3:  student3@virginia.edu / password123
  Student4:  student4@virginia.edu / password123
  Student5:  student5@virginia.edu / password123
  Student6:  student6@virginia.edu / password123
  Student7:  student7@virginia.edu / password123
  Student8:  student8@virginia.edu / password123
  Student9:  student9@virginia.edu / password123
  Student10: student10@virginia.edu / password123
  Student11: student11@virginia.edu / password123
  Student12: student12@virginia.edu / password123
  `);
});

module.exports = { app, io };
