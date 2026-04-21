-- Migration 039: Add after_photo field to projects table
-- The before photo will be taken from the first photo in the project_photos array
-- Only the after_photo field is stored in the database

-- Add after_photo column (JSONB to store FileReference object)  
ALTER TABLE projects 
ADD COLUMN after_photo JSONB;

-- Add comment to document the purpose of this field
COMMENT ON COLUMN projects.after_photo IS 'Photo representing the completed work area. Required to be uploaded when project is marked as completed. The before photo is taken from the first photo in the project_photos array.';

-- Create index on after_photo for performance (optional, since it's JSONB)
CREATE INDEX idx_projects_after_photo ON projects USING GIN (after_photo);
