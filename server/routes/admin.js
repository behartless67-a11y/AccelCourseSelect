const express = require('express');
const multer = require('multer');
const csv = require('csv-parse');
const fs = require('fs');
const { spawn } = require('child_process');
const { query, transaction } = require('../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all student selections for a term (admin view)
router.get('/selections/term/:termId', async (req, res) => {
  try {
    const { termId } = req.params;

    const result = await query(
      `SELECT
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.student_id,
        ss.id as selection_id,
        ss.preference_rank,
        ss.status,
        c.id as course_id,
        c.code,
        c.name,
        c.section_number,
        cg.code as group_code,
        ss.created_at
      FROM users u
      LEFT JOIN student_selections ss ON u.id = ss.user_id AND ss.term_id = $1
      LEFT JOIN courses c ON ss.course_id = c.id
      LEFT JOIN course_groups cg ON c.group_id = cg.id
      WHERE u.role = 'student'
      ORDER BY u.last_name, u.first_name, ss.preference_rank`,
      [termId]
    );

    // Group by student
    const studentSelections = result.rows.reduce((acc, row) => {
      const key = row.user_id;
      if (!acc[key]) {
        acc[key] = {
          userId: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          studentId: row.student_id,
          selections: [],
        };
      }
      if (row.selection_id) {
        acc[key].selections.push({
          selectionId: row.selection_id,
          preferenceRank: row.preference_rank,
          status: row.status,
          courseId: row.course_id,
          code: row.code,
          name: row.name,
          sectionNumber: row.section_number,
          groupCode: row.group_code,
          createdAt: row.created_at,
        });
      }
      return acc;
    }, {});

    res.json({ students: Object.values(studentSelections) });
  } catch (error) {
    console.error('Error fetching student selections:', error);
    res.status(500).json({ error: { message: 'Failed to fetch student selections' } });
  }
});

// Create a new term
router.post('/terms', async (req, res) => {
  try {
    const { name, year, season, selectionOpensAt, selectionClosesAt, isActive } = req.body;

    if (!name || !year || !season || !selectionOpensAt || !selectionClosesAt) {
      return res.status(400).json({ error: { message: 'All fields are required' } });
    }

    // If marking as active, deactivate other terms
    if (isActive) {
      await query('UPDATE terms SET is_active = false');
    }

    const result = await query(
      `INSERT INTO terms (name, year, season, selection_opens_at, selection_closes_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, year, season, selectionOpensAt, selectionClosesAt, isActive || false]
    );

    res.status(201).json({ term: result.rows[0] });
  } catch (error) {
    console.error('Error creating term:', error);
    res.status(500).json({ error: { message: 'Failed to create term' } });
  }
});

// Update term
router.put('/terms/:termId', async (req, res) => {
  try {
    const { termId } = req.params;
    const { name, year, season, selectionOpensAt, selectionClosesAt, isActive } = req.body;

    // If marking as active, deactivate other terms
    if (isActive) {
      await query('UPDATE terms SET is_active = false WHERE id != $1', [termId]);
    }

    const result = await query(
      `UPDATE terms
       SET name = COALESCE($1, name),
           year = COALESCE($2, year),
           season = COALESCE($3, season),
           selection_opens_at = COALESCE($4, selection_opens_at),
           selection_closes_at = COALESCE($5, selection_closes_at),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [name, year, season, selectionOpensAt, selectionClosesAt, isActive, termId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Term not found' } });
    }

    res.json({ term: result.rows[0] });
  } catch (error) {
    console.error('Error updating term:', error);
    res.status(500).json({ error: { message: 'Failed to update term' } });
  }
});

// Upload courses via CSV
router.post('/courses/upload', upload.single('file'), async (req, res) => {
  try {
    const { termId } = req.body;

    if (!termId) {
      return res.status(400).json({ error: { message: 'Term ID is required' } });
    }

    if (!req.file) {
      return res.status(400).json({ error: { message: 'CSV file is required' } });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const records = [];

    // Parse CSV
    const parser = csv.parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    parser.on('data', (record) => records.push(record));

    await new Promise((resolve, reject) => {
      parser.on('end', resolve);
      parser.on('error', reject);
      parser.write(fileContent);
      parser.end();
    });

    // Process records in transaction
    const result = await transaction(async (client) => {
      let insertedCount = 0;

      for (const record of records) {
        const {
          group_code,
          course_code,
          course_name,
          course_type,
          section_number,
          capacity,
          schedule,
          instructor,
          room,
        } = record;

        // Get or create course group
        let groupResult = await client.query(
          'SELECT id FROM course_groups WHERE code = $1',
          [group_code]
        );

        let groupId;
        if (groupResult.rows.length === 0) {
          groupResult = await client.query(
            'INSERT INTO course_groups (code, name) VALUES ($1, $2) RETURNING id',
            [group_code, group_code]
          );
        }
        groupId = groupResult.rows[0].id;

        // Insert course
        await client.query(
          `INSERT INTO courses (term_id, group_id, code, name, course_type, section_number, capacity, schedule, instructor, room)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (term_id, code, section_number) DO UPDATE
           SET capacity = $7, schedule = $8, instructor = $9, room = $10, updated_at = CURRENT_TIMESTAMP`,
          [termId, groupId, course_code, course_name, course_type || 'section', section_number, parseInt(capacity) || 0, schedule, instructor, room]
        );

        insertedCount++;
      }

      return insertedCount;
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ message: `Successfully uploaded ${result} courses` });
  } catch (error) {
    console.error('Error uploading courses:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: { message: 'Failed to upload courses' } });
  }
});

// Run optimization algorithm
router.post('/optimize/:termId', async (req, res) => {
  try {
    const { termId } = req.params;

    // Check if Python script exists
    const pythonScript = './server/algorithm/optimize.py';
    if (!fs.existsSync(pythonScript)) {
      return res.status(500).json({ error: { message: 'Optimization script not found' } });
    }

    // Run Python script
    const pythonProcess = spawn('python', [pythonScript, termId]);
    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error('Python script error:', error);
        return res.status(500).json({ error: { message: 'Optimization failed', details: error } });
      }

      // Broadcast update to all clients
      const io = req.app.get('io');
      io.to(`term_${termId}`).emit('assignments_updated', { termId });

      res.json({ message: 'Optimization completed successfully', output });
    });
  } catch (error) {
    console.error('Error running optimization:', error);
    res.status(500).json({ error: { message: 'Failed to run optimization' } });
  }
});

// Get optimization results
router.get('/assignments/:termId', async (req, res) => {
  try {
    const { termId } = req.params;

    const result = await query(
      `SELECT
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        ca.assigned_preference,
        c.id as course_id,
        c.code,
        c.name,
        c.section_number,
        cg.code as group_code,
        ca.assigned_at
      FROM course_assignments ca
      JOIN users u ON ca.user_id = u.id
      LEFT JOIN courses c ON ca.course_id = c.id
      LEFT JOIN course_groups cg ON c.group_id = cg.id
      WHERE ca.term_id = $1
      ORDER BY u.last_name, u.first_name`,
      [termId]
    );

    res.json({ assignments: result.rows });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: { message: 'Failed to fetch assignments' } });
  }
});

// Manually add/edit a course
router.post('/courses', async (req, res) => {
  try {
    const {
      termId,
      groupCode,
      code,
      name,
      courseType,
      sectionNumber,
      capacity,
      schedule,
      instructor,
      room,
    } = req.body;

    if (!termId || !code || !name || !capacity) {
      return res.status(400).json({ error: { message: 'Required fields missing' } });
    }

    // Get or create group
    let groupResult = await query('SELECT id FROM course_groups WHERE code = $1', [groupCode]);
    let groupId;

    if (groupResult.rows.length === 0 && groupCode) {
      groupResult = await query(
        'INSERT INTO course_groups (code, name) VALUES ($1, $2) RETURNING id',
        [groupCode, groupCode]
      );
    }
    groupId = groupResult.rows[0]?.id;

    const result = await query(
      `INSERT INTO courses (term_id, group_id, code, name, course_type, section_number, capacity, schedule, instructor, room)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [termId, groupId, code, name, courseType || 'section', sectionNumber, capacity, schedule, instructor, room]
    );

    res.status(201).json({ course: result.rows[0] });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: { message: 'Failed to create course' } });
  }
});

// Update a course
router.put('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { capacity, schedule, instructor, room } = req.body;

    const result = await query(
      `UPDATE courses
       SET capacity = COALESCE($1, capacity),
           schedule = COALESCE($2, schedule),
           instructor = COALESCE($3, instructor),
           room = COALESCE($4, room),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [capacity, schedule, instructor, room, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Course not found' } });
    }

    res.json({ course: result.rows[0] });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: { message: 'Failed to update course' } });
  }
});

// Delete a course
router.delete('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    await query('DELETE FROM courses WHERE id = $1', [courseId]);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: { message: 'Failed to delete course' } });
  }
});

module.exports = router;
