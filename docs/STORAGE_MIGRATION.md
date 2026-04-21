# Storage Migration: Cloudinary to Supabase

This document outlines the migration from Cloudinary to Supabase storage for handling file uploads in the BuildReady application.

## Overview

The application has been migrated from using Cloudinary for file storage to using Supabase's built-in storage service. This change provides:

- **Cost savings**: Supabase storage is more cost-effective for most use cases
- **Better integration**: Native integration with the existing Supabase backend
- **Simplified architecture**: Single service for database and file storage
- **Enhanced security**: Row-level security policies for file access control

## Changes Made

### 1. New Supabase Storage Service

Created `lib/services/SupabaseStorageService.ts` with the following features:

- File validation (size, type, etc.)
- File upload to Supabase storage
- File deletion
- URL generation (public and signed)
- Bucket management
- Error handling and fallbacks

### 2. Updated File Handling Hook

Modified `lib/hooks/useFileHandling.ts` to:

- Use Supabase storage instead of Cloudinary
- Handle Supabase-specific response formats
- Maintain the same API for components using the hook
- Provide fallback behavior when Supabase is not configured

### 3. Storage Buckets

The service uses a single storage bucket with organized folders:

- `buildready-files`: Single bucket for all files, organized into folders:
  - `photos/`: Photo storage for projects
  - `documents/`: Document storage for projects
  - `other/`: Other file types

## Setup Instructions

### 1. Environment Variables

Ensure you have the following environment variables set:

```bash
# Required for client-side operations
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Required for admin operations (bucket creation, etc.)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Enable Storage in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Storage in the left sidebar
3. Ensure storage is enabled for your project

### 3. Create Storage Buckets

Run the setup script to create the necessary storage buckets:

```bash
node scripts/setup-storage.js
```

Or manually create the bucket in the Supabase dashboard:

- `buildready-files` (public) - Single bucket for all files with organized folders

### 4. Configure Storage Policies

Set up appropriate Row Level Security (RLS) policies for your storage buckets. Example policies:

#### Public Read Access
```sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'buildready-files');
```

#### Authenticated User Upload
```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'buildready-files' 
  AND auth.role() = 'authenticated'
);
```

#### User Can Delete Own Files
```sql
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'buildready-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## API Changes

### Before (Cloudinary)
```typescript
import { cloudinaryService, CloudinaryUploadResult } from "@/lib/services/CloudinaryService"

interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  format: string
  width?: number
  height?: number
  bytes: number
  resource_type: string
  created_at: string
}
```

### After (Supabase)
```typescript
import { supabaseStorageService, SupabaseUploadResult } from "@/lib/services/SupabaseStorageService"

interface SupabaseUploadResult {
  id: string
  url: string
  path: string
  size: number
  mimeType: string
  uploadedAt: string
  bucket: string
}
```

## Migration Notes

### File IDs
- **Before**: Used Cloudinary's `public_id`
- **After**: Uses Supabase storage path as the ID

### File URLs
- **Before**: Used Cloudinary's `secure_url`
- **After**: Uses Supabase's public URL

### File Metadata
- **Before**: Cloudinary provided format, dimensions, etc.
- **After**: Basic file information (size, type, upload date)

## Testing

After migration, test the following functionality:

1. **File Upload**: Upload various file types (images, documents)
2. **File Validation**: Ensure file size and type restrictions work
3. **File Display**: Verify uploaded files display correctly
4. **File Deletion**: Test removing files from projects
5. **Error Handling**: Test with invalid files and network issues

## Fallback Behavior

When Supabase is not configured, the service provides fallback behavior:

- Creates mock upload results using blob URLs
- Logs warnings to the console
- Allows development/testing without full setup

## Troubleshooting

### Common Issues

1. **"Supabase storage is not configured"**
   - Check environment variables
   - Verify Supabase project URL and keys

2. **"Upload failed: Insufficient permissions"**
   - Check storage bucket policies
   - Verify RLS is configured correctly

3. **Files not displaying**
   - Check bucket public access settings
   - Verify storage policies allow public read access

### Debug Mode

Enable debug mode in development:

```typescript
// In lib/supabase.ts
debug: process.env.NODE_ENV === 'development'
```

## Performance Considerations

- Supabase storage has different performance characteristics than Cloudinary
- Large files may take longer to upload
- Consider implementing progress indicators for better UX
- Monitor storage usage and costs in Supabase dashboard

## Future Enhancements

- Implement signed URLs for private files
- Add image transformation capabilities
- Implement file compression
- Add CDN integration if needed
- Implement file versioning
