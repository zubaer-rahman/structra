import { Migration } from '../server/database/migrations';

export const migration_046_add_slug_fields: Migration = {
  id: '046_add_slug_fields',
  version: 46,
  name: 'Add slug fields for SEO-friendly URLs',
  checksum: 'a1b2c3d4e5f6',
  up: async (db) => {
    // Add slug field to projects table
    await db.execute(`
      ALTER TABLE projects 
      ADD COLUMN slug VARCHAR(255) UNIQUE;
    `);

    // Add slug field to contractor_profiles table  
    await db.execute(`
      ALTER TABLE contractor_profiles
      ADD COLUMN slug VARCHAR(255) UNIQUE;
    `);

    // Create indexes for better performance on slug lookups
    await db.execute(`
      CREATE INDEX idx_projects_slug ON projects(slug);
    `);

    await db.execute(`
      CREATE INDEX idx_contractor_profiles_slug ON contractor_profiles(slug);
    `);

    // Add comments to document the new columns
    await db.execute(`
      COMMENT ON COLUMN projects.slug IS 'SEO-friendly URL slug generated from project title, e.g., "kitchen-renovation-downtown-vancouver"';
    `);

    await db.execute(`
      COMMENT ON COLUMN contractor_profiles.slug IS 'SEO-friendly URL slug generated from contractor name, e.g., "john-smith-contracting"';
    `);
  },
  down: async (db) => {
    // Remove indexes
    await db.execute(`
      DROP INDEX IF EXISTS idx_projects_slug;
    `);

    await db.execute(`
      DROP INDEX IF EXISTS idx_contractor_profiles_slug;
    `);

    // Remove slug columns
    await db.execute(`
      ALTER TABLE projects 
      DROP COLUMN IF EXISTS slug;
    `);

    await db.execute(`
      ALTER TABLE contractor_profiles
      DROP COLUMN IF EXISTS slug;
    `);
  }
};
