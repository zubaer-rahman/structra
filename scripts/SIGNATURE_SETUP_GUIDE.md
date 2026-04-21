# Signature System Database Setup Guide

This guide will help you set up the digital signature system in your database.

## 📋 Prerequisites

- PostgreSQL database with UUID extension enabled
- Admin access to your database
- Database editor (pgAdmin, DBeaver, or similar)

## 🚀 Quick Setup

### Step 1: Run the Migration
1. Open your database editor
2. Connect to your Structra database
3. Open the file `scripts/signature_migration.sql`
4. Execute the entire script

### Step 2: Verify Installation
1. Open the file `scripts/signature_verification.sql`
2. Execute the script
3. Check that all components show "EXISTS" status

### Step 3: Test the System
1. Visit `/profile-signature-demo` in your application
2. Try creating a signature in the contractor or homeowner profile
3. Generate a sample PDF to test integration

## 📁 Files Overview

### `signature_migration.sql`
- Creates the `signatures` table
- Creates the `signature_audit_logs` table
- Adds signature fields to `agreements` table
- Creates necessary functions and triggers
- Adds performance indexes

### `signature_rollback.sql`
- Removes all signature system components
- Use this if you need to undo the migration

### `signature_verification.sql`
- Checks if all components are properly installed
- Verifies functions and triggers work correctly
- Shows table structure and constraints

## 🔍 What Gets Created

### Tables
- **`signatures`**: Stores digital signature data
- **`signature_audit_logs`**: Tracks all signature events

### Functions
- **`generate_signature_hash()`**: Creates SHA-256 hash for signatures
- **`log_signature_event()`**: Logs signature events for audit trail

### Triggers
- **`signatures_audit_trigger`**: Automatically logs signature changes

### Indexes
- Performance indexes on commonly queried columns
- Foreign key indexes for joins

## 🛠️ Troubleshooting

### If Migration Fails
1. Check that you have admin privileges
2. Ensure UUID extension is enabled: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
3. Check for any existing tables with conflicting names

### If Verification Fails
1. Re-run the migration script
2. Check database logs for errors
3. Ensure all functions and triggers were created

### If Rollback is Needed
1. Run `signature_rollback.sql`
2. Verify all components are removed
3. Re-run migration if needed

## 📊 Database Schema

### Signatures Table
```sql
CREATE TABLE signatures (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signature_data TEXT NOT NULL,
  signature_type TEXT NOT NULL DEFAULT 'handwritten',
  user_id UUID REFERENCES users(id) NOT NULL,
  document_id UUID,
  document_type TEXT,
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signer_role TEXT,
  ip_address INET,
  user_agent TEXT,
  signature_hash TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}' NOT NULL
);
```

### Audit Logs Table
```sql
CREATE TABLE signature_audit_logs (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signature_id UUID REFERENCES signatures(id) NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  actor_role TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}' NOT NULL,
  previous_values JSONB,
  new_values JSONB
);
```

## ✅ Success Indicators

After running the migration, you should see:
- ✅ `signatures` table created
- ✅ `signature_audit_logs` table created
- ✅ Functions created and working
- ✅ Triggers active
- ✅ Indexes created
- ✅ Agreement table updated with signature fields

## 🔄 Next Steps

1. **Test the API**: Visit `/api/signatures` to test the endpoints
2. **Create Signatures**: Use the profile pages to create test signatures
3. **Generate PDFs**: Test PDF generation with embedded signatures
4. **Monitor Logs**: Check audit logs for signature events

## 📞 Support

If you encounter any issues:
1. Check the verification script results
2. Review database error logs
3. Ensure all prerequisites are met
4. Try the rollback and re-migration process

The signature system is now ready to use in your Structra application!
