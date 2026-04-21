import { Migration } from '../migrations';

export const migration_039_add_before_after_photos: Migration = {
  id: '039_add_before_after_photos',
  version: 39,
  name: 'Add after_photo field to projects table',
  checksum: 'c4d5e6f7g8h9',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS after_photo JSONB;
      COMMENT ON COLUMN projects.after_photo IS 'Photo representing the completed work area. Required to be uploaded when project is marked as completed. The before photo is taken from the first photo in the project_photos array.';
    `);
  },
  down: async (db) => {
    await db.execute(`ALTER TABLE projects DROP COLUMN IF EXISTS after_photo;`);
  }
};
