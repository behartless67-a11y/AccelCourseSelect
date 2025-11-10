const express = require('express');
const { query } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all courses for a specific term with availability
router.get('/term/:termId', authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;

    const result = await query(
      `SELECT
        c.id,
        c.code,
        c.name,
        c.description,
        c.course_type,
        c.section_number,
        c.capacity,
        c.schedule,
        c.instructor,
        c.room,
        cg.code as group_code,
        cg.name as group_name,
        COALESCE(COUNT(DISTINCT ss.user_id), 0) as current_requests,
        c.capacity - COALESCE(COUNT(DISTINCT ss.user_id), 0) as seats_remaining,
        c.updated_at
      FROM courses c
      LEFT JOIN course_groups cg ON c.group_id = cg.id
      LEFT JOIN student_selections ss ON c.id = ss.course_id AND ss.term_id = $1
      WHERE c.term_id = $1
      GROUP BY c.id, cg.code, cg.name
      ORDER BY cg.code, c.course_type, c.section_number`,
      [termId]
    );

    res.json({
      courses: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: { message: 'Failed to fetch courses' } });
  }
});

// Get a specific course with details
router.get('/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await query(
      `SELECT
        c.*,
        cg.code as group_code,
        cg.name as group_name,
        COALESCE(COUNT(DISTINCT ss.user_id), 0) as current_requests,
        c.capacity - COALESCE(COUNT(DISTINCT ss.user_id), 0) as seats_remaining
      FROM courses c
      LEFT JOIN course_groups cg ON c.group_id = cg.id
      LEFT JOIN student_selections ss ON c.id = ss.course_id
      WHERE c.id = $1
      GROUP BY c.id, cg.code, cg.name`,
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Course not found' } });
    }

    res.json({ course: result.rows[0] });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: { message: 'Failed to fetch course' } });
  }
});

// Get all active terms
router.get('/terms/list', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, year, season, selection_opens_at, selection_closes_at, is_active
       FROM terms
       ORDER BY year DESC,
         CASE season
           WHEN 'Spring' THEN 1
           WHEN 'Summer' THEN 2
           WHEN 'Fall' THEN 3
         END DESC`
    );

    res.json({ terms: result.rows });
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ error: { message: 'Failed to fetch terms' } });
  }
});

// Get the active term
router.get('/terms/active', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, year, season, selection_opens_at, selection_closes_at FROM terms WHERE is_active = true LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'No active term found' } });
    }

    res.json({ term: result.rows[0] });
  } catch (error) {
    console.error('Error fetching active term:', error);
    res.status(500).json({ error: { message: 'Failed to fetch active term' } });
  }
});

// Get courses grouped by course group (ECON, RMDA, POLICY, etc.)
router.get('/term/:termId/grouped', authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;

    const result = await query(
      `SELECT
        cg.id as group_id,
        cg.code as group_code,
        cg.name as group_name,
        json_agg(
          json_build_object(
            'id', c.id,
            'code', c.code,
            'name', c.name,
            'courseType', c.course_type,
            'sectionNumber', c.section_number,
            'capacity', c.capacity,
            'schedule', c.schedule,
            'currentRequests', COALESCE(request_counts.count, 0),
            'seatsRemaining', c.capacity - COALESCE(request_counts.count, 0)
          ) ORDER BY c.course_type, c.section_number
        ) as courses
      FROM course_groups cg
      LEFT JOIN courses c ON c.group_id = cg.id AND c.term_id = $1
      LEFT JOIN (
        SELECT course_id, COUNT(DISTINCT user_id) as count
        FROM student_selections
        WHERE term_id = $1
        GROUP BY course_id
      ) request_counts ON c.id = request_counts.course_id
      WHERE c.id IS NOT NULL
      GROUP BY cg.id, cg.code, cg.name
      ORDER BY cg.code`,
      [termId]
    );

    res.json({ groups: result.rows });
  } catch (error) {
    console.error('Error fetching grouped courses:', error);
    res.status(500).json({ error: { message: 'Failed to fetch grouped courses' } });
  }
});

module.exports = router;
