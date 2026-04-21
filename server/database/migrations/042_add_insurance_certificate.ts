import { Migration } from '../migrations';

export const migration_042_add_insurance_certificate: Migration = {
  id: '042_add_insurance_certificate',
  version: 42,
  name: 'Add insurance certificate field to contractor_profiles table',
  checksum: 'b2c3d4e5f6g7h8i9',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE contractor_profiles 
      ADD COLUMN insurance_certificate JSONB;
    `);

    await db.execute(`
      COMMENT ON COLUMN contractor_profiles.insurance_certificate IS 'Insurance certificate file reference uploaded by admin after verification';
    `);

    await db.execute(`
      CREATE INDEX idx_contractor_profiles_insurance_certificate ON contractor_profiles USING GIN (insurance_certificate);
    `);
  },
  down: async (db) => {
    await db.execute(`
      DROP INDEX IF EXISTS idx_contractor_profiles_insurance_certificate;
    `);

    await db.execute(`
      ALTER TABLE contractor_profiles DROP COLUMN IF EXISTS insurance_certificate;
    `);
  }
};
