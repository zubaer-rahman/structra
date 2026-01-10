/**
 * Migration 050: Remove unique constraint on projects.pid field
 * 
 * This migration removes the unique constraint on the pid column in the projects table,
 * allowing multiple projects to have the same Parcel Identifier (PID) as requested by the client.
 * 
 * Run this migration in your Supabase SQL editor or via the Supabase CLI.
 */

export const migration_050_remove_pid_unique_constraint = `
-- Migration 050: Remove unique constraint on projects.pid field
-- This allows multiple projects to have the same Parcel Identifier (PID)

-- Drop the unique constraint on the pid column
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_pid_key;

-- Optional: Add a comment to document this change
COMMENT ON COLUMN projects.pid IS 'Parcel Identifier - duplicates are now allowed as per client requirements';
`;

// Instructions for running this migration:
console.log(`
To apply this migration:

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Run the following SQL:

${migration_050_remove_pid_unique_constraint}

Alternatively, if you have Supabase CLI installed:
supabase db reset --db-url "your-database-url"
`);
