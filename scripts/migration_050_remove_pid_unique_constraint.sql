-- Migration 050: Remove unique constraint on projects.pid field
-- This allows multiple projects to have the same Parcel Identifier (PID)

-- Drop the unique constraint on the pid column
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_pid_key;

-- Optional: Add a comment to document this change
COMMENT ON COLUMN projects.pid IS 'Parcel Identifier - duplicates are now allowed as per client requirements';
