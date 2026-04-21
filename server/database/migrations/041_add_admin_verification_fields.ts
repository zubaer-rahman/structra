import { Migration } from '../migrations';

export const migration_041_add_admin_verification_fields: Migration = {
  id: '041_add_admin_verification_fields',
  version: 41,
  name: 'Add admin verification fields to contractor_profiles table',
  checksum: 'a1b2c3d4e5f6g7h8',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE contractor_profiles 
      ADD COLUMN gst_hst_clearance_document JSONB,
      ADD COLUMN wcb_clearance_document JSONB,
      ADD COLUMN is_admin_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN admin_verification_date TIMESTAMP WITH TIME ZONE;
    `);

    await db.execute(`
      COMMENT ON COLUMN contractor_profiles.gst_hst_clearance_document IS 'GST/HST clearance document file reference uploaded by admin';
    `);

    await db.execute(`
      COMMENT ON COLUMN contractor_profiles.wcb_clearance_document IS 'WCB clearance document file reference uploaded by admin';
    `);

    await db.execute(`
      COMMENT ON COLUMN contractor_profiles.is_admin_verified IS 'Indicates whether contractor has been verified by admin with clearance documents';
    `);

    await db.execute(`
      COMMENT ON COLUMN contractor_profiles.admin_verification_date IS 'Date when admin verification was completed';
    `);

    await db.execute(`
      CREATE INDEX idx_contractor_profiles_admin_verified ON contractor_profiles (is_admin_verified);
    `);

    await db.execute(`
      CREATE INDEX idx_contractor_profiles_admin_verified_true ON contractor_profiles (admin_verification_date) 
      WHERE is_admin_verified = TRUE;
    `);
  },
  down: async (db) => {
    await db.execute(`
      DROP INDEX IF EXISTS idx_contractor_profiles_admin_verified_true;
    `);

    await db.execute(`
      DROP INDEX IF EXISTS idx_contractor_profiles_admin_verified;
    `);

    await db.execute(`
      ALTER TABLE contractor_profiles 
      DROP COLUMN IF EXISTS gst_hst_clearance_document,
      DROP COLUMN IF EXISTS wcb_clearance_document,
      DROP COLUMN IF EXISTS is_admin_verified,
      DROP COLUMN IF EXISTS admin_verification_date;
    `);
  }
};
