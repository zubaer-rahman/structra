import { Migration } from '../migrations';

export const migration_044_add_file_upload_columns: Migration = {
  id: '044_add_file_upload_columns',
  version: 44,
  name: 'add_file_upload_columns',
  checksum: 'f7e8d9c0b1a2', // Hash for file upload columns migration
  up: async (client) => {
    // Add portfolio_file column to store file references for portfolio
    await client.query(`
      ALTER TABLE contractor_profiles 
      ADD COLUMN portfolio_file JSONB;
    `);

    // Add license_file column to store file references for licenses  
    await client.query(`
      ALTER TABLE contractor_profiles 
      ADD COLUMN license_file JSONB;
    `);

    // Add comments to document the new columns
    await client.query(`
      COMMENT ON COLUMN contractor_profiles.portfolio_file IS 'Array of file references for portfolio files. Structure: [{id: string, filename: string, url: string, size?: number, mimeType?: string, uploadedAt?: Date}]';
    `);

    await client.query(`
      COMMENT ON COLUMN contractor_profiles.license_file IS 'Array of file references for license files. Structure: [{id: string, filename: string, url: string, size?: number, mimeType?: string, uploadedAt?: Date}]';
    `);

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX idx_contractor_profiles_portfolio_file ON contractor_profiles USING GIN (portfolio_file);
    `);

    await client.query(`
      CREATE INDEX idx_contractor_profiles_license_file ON contractor_profiles USING GIN (license_file);
    `);
  },
  down: async (client) => {
    // Remove indexes
    await client.query(`
      DROP INDEX IF EXISTS idx_contractor_profiles_portfolio_file;
    `);

    await client.query(`
      DROP INDEX IF EXISTS idx_contractor_profiles_license_file;
    `);

    // Remove columns
    await client.query(`
      ALTER TABLE contractor_profiles 
      DROP COLUMN IF EXISTS portfolio_file;
    `);

    await client.query(`
      ALTER TABLE contractor_profiles 
      DROP COLUMN IF EXISTS license_file;
    `);
  },
};
