import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (email, password, firstName, lastName, studentId) =>
    api.post('/auth/register', { email, password, firstName, lastName, studentId }),

  me: () => api.get('/auth/me'),

  verify: () => api.post('/auth/verify'),
};

// Courses API
export const coursesAPI = {
  getTermCourses: (termId) => api.get(`/courses/term/${termId}`),

  getCourse: (courseId) => api.get(`/courses/${courseId}`),

  getTerms: () => api.get('/courses/terms/list'),

  getActiveTerm: () => api.get('/courses/terms/active'),

  getGroupedCourses: (termId) => api.get(`/courses/term/${termId}/grouped`),
};

// Selections API
export const selectionsAPI = {
  getSelections: (termId) => api.get(`/selections/term/${termId}`),

  selectCourse: (courseId, termId, preferenceRank) =>
    api.post('/selections/select', { courseId, termId, preferenceRank }),

  removeSelection: (selectionId) => api.delete(`/selections/${selectionId}`),

  clearSelections: (termId) => api.delete(`/selections/term/${termId}/clear`),
};

// Admin API
export const adminAPI = {
  getStudentSelections: (termId) => api.get(`/admin/selections/term/${termId}`),

  createTerm: (data) => api.post('/admin/terms', data),

  updateTerm: (termId, data) => api.put(`/admin/terms/${termId}`, data),

  uploadCourses: (termId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('termId', termId);
    return api.post('/admin/courses/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  runOptimization: (termId) => api.post(`/admin/optimize/${termId}`),

  getAssignments: (termId) => api.get(`/admin/assignments/${termId}`),

  createCourse: (data) => api.post('/admin/courses', data),

  updateCourse: (courseId, data) => api.put(`/admin/courses/${courseId}`, data),

  deleteCourse: (courseId) => api.delete(`/admin/courses/${courseId}`),
};

export default api;
