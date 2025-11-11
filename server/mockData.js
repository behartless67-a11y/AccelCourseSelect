// Mock database data for testing without PostgreSQL

const bcrypt = require('bcryptjs');

// Hash password synchronously for mock data
const hashPassword = (password) => bcrypt.hashSync(password, 10);

// Mock users
const users = [
  {
    id: 1,
    email: 'admin@batten.virginia.edu',
    password_hash: hashPassword('admin123'),
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    student_id: null,
  },
  {
    id: 2,
    email: 'student1@virginia.edu',
    password_hash: hashPassword('password123'),
    first_name: 'John',
    last_name: 'Doe',
    role: 'student',
    student_id: 'STU001',
  },
  {
    id: 3,
    email: 'student2@virginia.edu',
    password_hash: hashPassword('password123'),
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'student',
    student_id: 'STU002',
  },
  {
    id: 4,
    email: 'student3@virginia.edu',
    password_hash: hashPassword('password123'),
    first_name: 'Michael',
    last_name: 'Johnson',
    role: 'student',
    student_id: 'STU003',
  },
  {
    id: 5,
    email: 'student4@virginia.edu',
    password_hash: hashPassword('password123'),
    first_name: 'Emily',
    last_name: 'Williams',
    role: 'student',
    student_id: 'STU004',
  },
  {
    id: 6,
    email: 'student5@virginia.edu',
    password_hash: hashPassword('password123'),
    first_name: 'David',
    last_name: 'Brown',
    role: 'student',
    student_id: 'STU005',
  },
  {
    id: 7,
    email: 'student6@virginia.edu',
    password_hash: hashPassword('password123'),
    first_name: 'Sarah',
    last_name: 'Davis',
    role: 'student',
    student_id: 'STU006',
  },
  {
    id: 8,
    email: 'student7@virginia.edu',
    password_hash: hashPassword('password123'),
    first_name: 'James',
    last_name: 'Miller',
    role: 'student',
    student_id: 'STU007',
  },
  {
    id: 9,
    email: 'student8@virginia.edu',
    password_hash: hashPassword('password123'),
    first_name: 'Jennifer',
    last_name: 'Wilson',
    role: 'student',
    student_id: 'STU008',
  },
  {
    id: 10,
    email: 'student9@virginia.edu',
    password_hash: hashPassword('password123'),
    first_name: 'Robert',
    last_name: 'Moore',
    role: 'student',
    student_id: 'STU009',
  },
  {
    id: 11,
    email: 'student10@virginia.edu',
    password_hash: hashPassword('password123'),
    first_name: 'Lisa',
    last_name: 'Taylor',
    role: 'student',
    student_id: 'STU010',
  },
  {
    id: 12,
    email: 'student11@virginia.edu',
    password_hash: hashPassword('password123'),
    first_name: 'Christopher',
    last_name: 'Anderson',
    role: 'student',
    student_id: 'STU011',
  },
  {
    id: 13,
    email: 'student12@virginia.edu',
    password_hash: hashPassword('password123'),
    first_name: 'Amanda',
    last_name: 'Thomas',
    role: 'student',
    student_id: 'STU012',
  },
];

// Mock terms
const terms = [
  {
    id: 1,
    name: 'Spring 2026',
    year: 2026,
    season: 'Spring',
    selection_opens_at: new Date('2025-11-01'),
    selection_closes_at: new Date('2025-12-15'),
    is_active: true,
  },
];

// Mock course groups
const courseGroups = [
  { id: 1, code: 'ECON', name: 'Economics' },
  { id: 2, code: 'RMDA', name: 'Research Methods and Data Analysis' },
  { id: 3, code: 'POLICY', name: 'Policy Analysis' },
];

// Mock courses - data from screenshot
const courses = [
  // ECON courses
  { id: 1, term_id: 1, group_id: 1, code: 'LPPA 7110', name: 'Economics of Public Policy II', course_type: 'Section', section_number: '001', capacity: 17, schedule: 'Tu/Th 11am-12:15pm', group_code: 'ECON', group_name: 'Economics' },
  { id: 2, term_id: 1, group_id: 1, code: 'LPPA 7110', name: 'Economics of Public Policy II', course_type: 'Section', section_number: '002', capacity: 16, schedule: 'Tu/Th 2-3:15pm', group_code: 'ECON', group_name: 'Economics' },
  { id: 3, term_id: 1, group_id: 1, code: 'LPPA 7110', name: 'Economics of Public Policy II', course_type: 'Discussion', section_number: '100', capacity: 8, schedule: 'M 5-5:50pm', group_code: 'ECON', group_name: 'Economics' },
  { id: 4, term_id: 1, group_id: 1, code: 'LPPA 7110', name: 'Economics of Public Policy II', course_type: 'Discussion', section_number: '101', capacity: 8, schedule: 'Tu 5-5:50pm', group_code: 'ECON', group_name: 'Economics' },
  { id: 5, term_id: 1, group_id: 1, code: 'LPPA 7110', name: 'Economics of Public Policy II', course_type: 'Discussion', section_number: '102', capacity: 9, schedule: 'M 6-6:50pm', group_code: 'ECON', group_name: 'Economics' },
  { id: 6, term_id: 1, group_id: 1, code: 'LPPA 7110', name: 'Economics of Public Policy II', course_type: 'Discussion', section_number: '103', capacity: 8, schedule: 'W 1-1:50pm', group_code: 'ECON', group_name: 'Economics' },

  // RMDA courses
  { id: 7, term_id: 1, group_id: 2, code: 'LPPA 7160', name: 'Research Methods and Data Analysis II', course_type: 'Section', section_number: '001', capacity: 16, schedule: 'M/W 9:30-10:45am', group_code: 'RMDA', group_name: 'Research Methods and Data Analysis' },
  { id: 8, term_id: 1, group_id: 2, code: 'LPPA 7160', name: 'Research Methods and Data Analysis II', course_type: 'Section', section_number: '002', capacity: 17, schedule: 'M/W 11am-12:15pm', group_code: 'RMDA', group_name: 'Research Methods and Data Analysis' },
  { id: 9, term_id: 1, group_id: 2, code: 'LPPA 7160', name: 'Research Methods and Data Analysis II', course_type: 'Discussion', section_number: '100', capacity: 8, schedule: 'M 10-10:50am', group_code: 'RMDA', group_name: 'Research Methods and Data Analysis' },
  { id: 10, term_id: 1, group_id: 2, code: 'LPPA 7160', name: 'Research Methods and Data Analysis II', course_type: 'Discussion', section_number: '101', capacity: 8, schedule: 'M 11-11:50am', group_code: 'RMDA', group_name: 'Research Methods and Data Analysis' },
  { id: 11, term_id: 1, group_id: 2, code: 'LPPA 7160', name: 'Research Methods and Data Analysis II', course_type: 'Discussion', section_number: '102', capacity: 9, schedule: 'M 6-6:50pm', group_code: 'RMDA', group_name: 'Research Methods and Data Analysis' },
  { id: 12, term_id: 1, group_id: 2, code: 'LPPA 7160', name: 'Research Methods and Data Analysis II', course_type: 'Discussion', section_number: '103', capacity: 8, schedule: 'Tu 4-4:50pm', group_code: 'RMDA', group_name: 'Research Methods and Data Analysis' },

  // POLICY courses
  { id: 13, term_id: 1, group_id: 3, code: 'LPPP 6250', name: 'Introduction to Policy Analysis', course_type: 'Section', section_number: '001', capacity: 17, schedule: 'M/W 2-3:15pm', group_code: 'POLICY', group_name: 'Policy Analysis' },
  { id: 14, term_id: 1, group_id: 3, code: 'LPPP 6250', name: 'Introduction to Policy Analysis', course_type: 'Section', section_number: '002', capacity: 16, schedule: 'M/W 3:30-4:45pm', group_code: 'POLICY', group_name: 'Policy Analysis' },
  { id: 15, term_id: 1, group_id: 3, code: 'LPPP 6250', name: 'Introduction to Policy Analysis', course_type: 'Discussion', section_number: '100', capacity: 8, schedule: 'M 2-2:50pm', group_code: 'POLICY', group_name: 'Policy Analysis' },
  { id: 16, term_id: 1, group_id: 3, code: 'LPPP 6250', name: 'Introduction to Policy Analysis', course_type: 'Discussion', section_number: '101', capacity: 8, schedule: 'M 4-4:50pm', group_code: 'POLICY', group_name: 'Policy Analysis' },
  { id: 17, term_id: 1, group_id: 3, code: 'LPPP 6250', name: 'Introduction to Policy Analysis', course_type: 'Discussion', section_number: '102', capacity: 8, schedule: 'W 5-5:50pm', group_code: 'POLICY', group_name: 'Policy Analysis' },
  { id: 18, term_id: 1, group_id: 3, code: 'LPPP 6250', name: 'Introduction to Policy Analysis', course_type: 'Discussion', section_number: '103', capacity: 9, schedule: 'W 6-6:50pm', group_code: 'POLICY', group_name: 'Policy Analysis' },
];

// Mock student selections
let studentSelections = [
  {
    id: 1,
    user_id: 2,
    course_id: 1,
    term_id: 1,
    preference_rank: 1,
    status: 'pending',
    created_at: new Date('2025-11-05'),
  },
  {
    id: 2,
    user_id: 2,
    course_id: 5,
    term_id: 1,
    preference_rank: 2,
    status: 'pending',
    created_at: new Date('2025-11-05'),
  },
];

// Helper functions
const findUserByEmail = (email) => users.find(u => u.email === email);
const findUserById = (id) => users.find(u => u.id === id);
const getActiveTerm = () => terms.find(t => t.is_active);
const getCoursesByTerm = (termId) => {
  return courses.map(course => {
    const requests = studentSelections.filter(s => s.course_id === course.id).length;
    return {
      ...course,
      current_requests: requests,
      seats_remaining: course.capacity - requests,
    };
  });
};
const getUserSelections = (userId, termId) => {
  return studentSelections
    .filter(s => s.user_id === userId && s.term_id === termId)
    .map(selection => {
      const course = courses.find(c => c.id === selection.course_id);
      return {
        ...selection,
        code: course.code,
        name: course.name,
        course_type: course.course_type,
        section_number: course.section_number,
        schedule: course.schedule,
        group_code: course.group_code,
        group_name: course.group_name,
      };
    });
};

const addSelection = (userId, courseId, termId, preferenceRank) => {
  // Remove existing selection with same rank
  studentSelections = studentSelections.filter(
    s => !(s.user_id === userId && s.term_id === termId && s.preference_rank === preferenceRank)
  );

  const newSelection = {
    id: studentSelections.length + 1,
    user_id: userId,
    course_id: courseId,
    term_id: termId,
    preference_rank: preferenceRank,
    status: 'pending',
    created_at: new Date(),
  };

  studentSelections.push(newSelection);
  return newSelection;
};

const removeSelection = (selectionId, userId) => {
  const index = studentSelections.findIndex(s => s.id === selectionId && s.user_id === userId);
  if (index !== -1) {
    studentSelections.splice(index, 1);
    return true;
  }
  return false;
};

const getAllStudentSelections = (termId) => {
  const students = users.filter(u => u.role === 'student');
  return students.map(student => {
    const selections = studentSelections
      .filter(s => s.user_id === student.id && s.term_id === termId)
      .map(selection => {
        const course = courses.find(c => c.id === selection.course_id);
        return {
          selectionId: selection.id,
          preferenceRank: selection.preference_rank,
          status: selection.status,
          courseId: course.id,
          code: course.code,
          name: course.name,
          sectionNumber: course.section_number,
          groupCode: course.group_code,
          createdAt: selection.created_at,
        };
      });

    return {
      userId: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      studentId: student.student_id,
      selections,
    };
  });
};

const addUser = (email, password, firstName, lastName, studentId) => {
  const newUser = {
    id: users.length + 1,
    email,
    password_hash: hashPassword(password),
    first_name: firstName,
    last_name: lastName,
    role: 'student',
    student_id: studentId,
  };
  users.push(newUser);
  return newUser;
};

const addCourse = (courseData) => {
  const { termId, groupCode, code, name, courseType, sectionNumber, capacity, schedule, instructor, room } = courseData;

  const newCourse = {
    id: courses.length + 1,
    term_id: termId,
    group_code: groupCode,
    group_name: groupCode, // For simplicity, use same as code
    code,
    name,
    course_type: courseType || 'Section',
    section_number: sectionNumber,
    capacity: parseInt(capacity) || 0,
    schedule: schedule || null,
    instructor: instructor || null,
    room: room || null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  courses.push(newCourse);
  return newCourse;
};

const updateCourse = (courseId, updates) => {
  const index = courses.findIndex(c => c.id === courseId);
  if (index === -1) return null;

  courses[index] = {
    ...courses[index],
    ...updates,
    updated_at: new Date(),
  };

  return courses[index];
};

const deleteCourse = (courseId) => {
  const index = courses.findIndex(c => c.id === courseId);
  if (index === -1) return false;

  // Also remove any selections for this course
  studentSelections = studentSelections.filter(s => s.course_id !== courseId);

  courses.splice(index, 1);
  return true;
};

module.exports = {
  users,
  terms,
  courseGroups,
  courses,
  studentSelections,
  findUserByEmail,
  findUserById,
  getActiveTerm,
  getCoursesByTerm,
  getUserSelections,
  addSelection,
  removeSelection,
  getAllStudentSelections,
  addUser,
  addCourse,
  updateCourse,
  deleteCourse,
};
