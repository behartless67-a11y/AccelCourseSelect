-- Initialize a sample term with Spring 2026 courses
-- Run this file after database migration to set up a test environment

-- Create Spring 2026 term
INSERT INTO terms (name, year, season, selection_opens_at, selection_closes_at, is_active)
VALUES ('Spring 2026', 2026, 'Spring', NOW(), NOW() + INTERVAL '30 days', true)
ON CONFLICT DO NOTHING;

-- Get the term ID (you'll need this for other operations)
SELECT id, name FROM terms WHERE name = 'Spring 2026';

-- Note: After running this, use the term ID to upload courses via the admin interface
-- Or manually insert sample course data here
