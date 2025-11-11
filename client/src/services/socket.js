import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3002';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      if (token) {
        this.socket.emit('authenticate', token);
      }
    });

    this.socket.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data);
    });

    this.socket.on('authentication_error', (error) => {
      console.error('❌ Socket authentication error:', error);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinTerm(termId) {
    if (this.socket?.connected) {
      this.socket.emit('join_term', termId);
      console.log(`📝 Joined term ${termId}`);
    }
  }

  leaveTerm(termId) {
    if (this.socket?.connected) {
      this.socket.emit('leave_term', termId);
      console.log(`👋 Left term ${termId}`);
    }
  }

  // Subscribe to course updates
  onCourseUpdated(callback) {
    if (this.socket) {
      this.socket.on('course_updated', callback);
      this.listeners.set('course_updated', callback);
    }
  }

  // Subscribe to assignment updates
  onAssignmentsUpdated(callback) {
    if (this.socket) {
      this.socket.on('assignments_updated', callback);
      this.listeners.set('assignments_updated', callback);
    }
  }

  // Unsubscribe from events
  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }

  // Cleanup all listeners
  removeAllListeners() {
    if (this.socket) {
      this.listeners.forEach((callback, event) => {
        this.socket.off(event, callback);
      });
      this.listeners.clear();
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export default new SocketService();
