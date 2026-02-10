import { Migration } from '../migrations';

export const migration_045_add_company_logo_image: Migration = {
  id: '045_add_company_logo_image',
  version: 45,
  name: 'Add company_logo_image column to contractor_profiles table',
  checksum: 'i9j0k1l2m3n4',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS company_logo_image JSONB;
      COMMENT ON COLUMN contractor_profiles.company_logo_image IS 'JSON object containing company logo image details';
    `);
  },
  down: async (db) => {
    await db.execute(`ALTER TABLE contractor_profiles DROP COLUMN IF EXISTS company_logo_image;`);
  }
};
