-- Accelerated Course Selection System Database Schema

-- Users table (students and admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student', -- 'student' or 'admin'
    student_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Terms table (e.g., Spring 2026, Fall 2026)
CREATE TABLE IF NOT EXISTS terms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    season VARCHAR(20) NOT NULL, -- 'Spring', 'Fall', 'Summer'
    selection_opens_at TIMESTAMP NOT NULL,
    selection_closes_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course groups (ECON, RMDA, POLICY, etc.)
CREATE TABLE IF NOT EXISTS course_groups (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    term_id INTEGER REFERENCES terms(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES course_groups(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL, -- e.g., 'LPPA 7110'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    course_type VARCHAR(20) NOT NULL DEFAULT 'section', -- 'section' or 'discussion'
    section_number VARCHAR(10), -- e.g., '001', '002'
    capacity INTEGER NOT NULL DEFAULT 0,
    schedule VARCHAR(255), -- e.g., 'Tu/Th 11am-12:15pm'
    instructor VARCHAR(255),
    room VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(term_id, code, section_number)
);

-- Student course selections/preferences
CREATE TABLE IF NOT EXISTS student_selections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    term_id INTEGER REFERENCES terms(id) ON DELETE CASCADE,
    preference_rank INTEGER NOT NULL, -- 1, 2, or 3
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'assigned', 'waitlisted', 'not_assigned'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, term_id, preference_rank),
    CONSTRAINT valid_preference CHECK (preference_rank BETWEEN 1 AND 3)
);

-- Final course assignments (after algorithm runs)
CREATE TABLE IF NOT EXISTS course_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    term_id INTEGER REFERENCES terms(id) ON DELETE CASCADE,
    assigned_preference INTEGER, -- Which preference rank was assigned (1, 2, 3, or NULL if none)
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, term_id)
);

-- Audit log for real-time seat tracking
CREATE TABLE IF NOT EXISTS selection_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'selected', 'deselected', 'updated'
    preference_rank INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_courses_term ON courses(term_id);
CREATE INDEX idx_courses_group ON courses(group_id);
CREATE INDEX idx_student_selections_user ON student_selections(user_id);
CREATE INDEX idx_student_selections_term ON student_selections(term_id);
CREATE INDEX idx_student_selections_course ON student_selections(course_id);
CREATE INDEX idx_course_assignments_user ON course_assignments(user_id);
CREATE INDEX idx_course_assignments_term ON course_assignments(term_id);

-- View for current seat availability
CREATE OR REPLACE VIEW course_availability AS
SELECT
    c.id as course_id,
    c.term_id,
    c.code,
    c.name,
    c.section_number,
    c.capacity,
    COUNT(DISTINCT ss.user_id) as current_requests,
    c.capacity - COUNT(DISTINCT ss.user_id) as seats_remaining,
    CASE
        WHEN COUNT(DISTINCT ss.user_id) >= c.capacity THEN 'full'
        WHEN COUNT(DISTINCT ss.user_id) >= c.capacity * 0.9 THEN 'filling'
        ELSE 'available'
    END as availability_status
FROM courses c
LEFT JOIN student_selections ss ON c.id = ss.course_id
GROUP BY c.id, c.term_id, c.code, c.name, c.section_number, c.capacity;

-- View for student selection summary
CREATE OR REPLACE VIEW student_selection_summary AS
SELECT
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    ss.term_id,
    ss.preference_rank,
    c.code,
    c.name,
    c.section_number,
    ss.status,
    ca.course_id as assigned_course_id
FROM users u
LEFT JOIN student_selections ss ON u.id = ss.user_id
LEFT JOIN courses c ON ss.course_id = c.id
LEFT JOIN course_assignments ca ON u.id = ca.user_id AND ss.term_id = ca.term_id
WHERE u.role = 'student'
ORDER BY u.last_name, u.first_name, ss.preference_rank;
