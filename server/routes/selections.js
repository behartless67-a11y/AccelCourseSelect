const express = require('express');
const { query, transaction } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's course selections for a term
router.get('/term/:termId', authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;
    const userId = req.user.id;

    const result = await query(
      `SELECT
        ss.id,
        ss.preference_rank,
        ss.status,
        c.id as course_id,
        c.code,
        c.name,
        c.course_type,
        c.section_number,
        c.schedule,
        cg.code as group_code,
        cg.name as group_name,
        ss.created_at,
        ss.updated_at
      FROM student_selections ss
      JOIN courses c ON ss.course_id = c.id
      LEFT JOIN course_groups cg ON c.group_id = cg.id
      WHERE ss.user_id = $1 AND ss.term_id = $2
      ORDER BY ss.preference_rank`,
      [userId, termId]
    );

    res.json({ selections: result.rows });
  } catch (error) {
    console.error('Error fetching selections:', error);
    res.status(500).json({ error: { message: 'Failed to fetch selections' } });
  }
});

// Submit or update a course selection
router.post('/select', authenticateToken, async (req, res) => {
  try {
    const { courseId, termId, preferenceRank } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!courseId || !termId || !preferenceRank) {
      return res.status(400).json({ error: { message: 'Course ID, term ID, and preference rank are required' } });
    }

    if (preferenceRank < 1 || preferenceRank > 3) {
      return res.status(400).json({ error: { message: 'Preference rank must be between 1 and 3' } });
    }

    // Check if term is active and selection period is open
    const termCheck = await query(
      `SELECT is_active, selection_opens_at, selection_closes_at
       FROM terms
       WHERE id = $1`,
      [termId]
    );

    if (termCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Term not found' } });
    }

    const term = termCheck.rows[0];
    const now = new Date();

    if (!term.is_active) {
      return res.status(400).json({ error: { message: 'This term is not currently accepting selections' } });
    }

    if (now < new Date(term.selection_opens_at) || now > new Date(term.selection_closes_at)) {
      return res.status(400).json({ error: { message: 'Selection period is not currently open' } });
    }

    // Use transaction to ensure atomicity
    const result = await transaction(async (client) => {
      // Check if course exists
      const courseCheck = await client.query(
        'SELECT id, capacity FROM courses WHERE id = $1 AND term_id = $2',
        [courseId, termId]
      );

      if (courseCheck.rows.length === 0) {
        throw new Error('Course not found');
      }

      // Insert or update selection
      const selectionResult = await client.query(
        `INSERT INTO student_selections (user_id, course_id, term_id, preference_rank, status)
         VALUES ($1, $2, $3, $4, 'pending')
         ON CONFLICT (user_id, term_id, preference_rank)
         DO UPDATE SET course_id = $2, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, courseId, termId, preferenceRank]
      );

      // Log the selection
      await client.query(
        `INSERT INTO selection_audit_log (user_id, course_id, action, preference_rank)
         VALUES ($1, $2, 'selected', $3)`,
        [userId, courseId, preferenceRank]
      );

      return selectionResult.rows[0];
    });

    // Broadcast real-time update to all connected clients
    const io = req.app.get('io');
    const updatedCourse = await query(
      `SELECT
        c.id,
        c.code,
        c.capacity,
        COUNT(DISTINCT ss.user_id) as current_requests,
        c.capacity - COUNT(DISTINCT ss.user_id) as seats_remaining
      FROM courses c
      LEFT JOIN student_selections ss ON c.id = ss.course_id
      WHERE c.id = $1
      GROUP BY c.id`,
      [courseId]
    );

    if (updatedCourse.rows.length > 0) {
      io.to(`term_${termId}`).emit('course_updated', updatedCourse.rows[0]);
    }

    res.status(201).json({
      message: 'Selection saved successfully',
      selection: result,
    });
  } catch (error) {
    console.error('Error saving selection:', error);
    res.status(500).json({ error: { message: error.message || 'Failed to save selection' } });
  }
});

// Remove a course selection
router.delete('/:selectionId', authenticateToken, async (req, res) => {
  try {
    const { selectionId } = req.params;
    const userId = req.user.id;

    // Get selection details before deleting
    const selectionCheck = await query(
      'SELECT course_id, term_id FROM student_selections WHERE id = $1 AND user_id = $2',
      [selectionId, userId]
    );

    if (selectionCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Selection not found' } });
    }

    const { course_id, term_id } = selectionCheck.rows[0];

    // Delete selection
    await query('DELETE FROM student_selections WHERE id = $1 AND user_id = $2', [selectionId, userId]);

    // Log the action
    await query(
      `INSERT INTO selection_audit_log (user_id, course_id, action)
       VALUES ($1, $2, 'deselected')`,
      [userId, course_id]
    );

    // Broadcast real-time update
    const io = req.app.get('io');
    const updatedCourse = await query(
      `SELECT
        c.id,
        c.code,
        c.capacity,
        COUNT(DISTINCT ss.user_id) as current_requests,
        c.capacity - COUNT(DISTINCT ss.user_id) as seats_remaining
      FROM courses c
      LEFT JOIN student_selections ss ON c.id = ss.course_id
      WHERE c.id = $1
      GROUP BY c.id`,
      [course_id]
    );

    if (updatedCourse.rows.length > 0) {
      io.to(`term_${term_id}`).emit('course_updated', updatedCourse.rows[0]);
    }

    res.json({ message: 'Selection removed successfully' });
  } catch (error) {
    console.error('Error removing selection:', error);
    res.status(500).json({ error: { message: 'Failed to remove selection' } });
  }
});

// Clear all selections for a term
router.delete('/term/:termId/clear', authenticateToken, async (req, res) => {
  try {
    const { termId } = req.params;
    const userId = req.user.id;

    await query('DELETE FROM student_selections WHERE user_id = $1 AND term_id = $2', [userId, termId]);

    res.json({ message: 'All selections cleared successfully' });
  } catch (error) {
    console.error('Error clearing selections:', error);
    res.status(500).json({ error: { message: 'Failed to clear selections' } });
  }
});

module.exports = router;
