import { Migration } from '../migrations';

export const migration_051_add_review_consent_fields: Migration = {
  id: '051_add_review_consent_fields',
  version: 51,
  name: 'Add consent fields to reviews table',
  checksum: 'o5p6q7r8s9t0',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS homeowner_consent_for_photos BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS consent_given_by UUID REFERENCES public.users(id);
    `);
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE reviews 
      DROP COLUMN IF EXISTS homeowner_consent_for_photos,
      DROP COLUMN IF EXISTS consent_given_at,
      DROP COLUMN IF EXISTS consent_given_by;
    `);
  }
};
