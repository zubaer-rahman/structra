import dotenv from "dotenv";
import path from "path";
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function initStorage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const bucketName = 'structra-files';

  console.log(`🏗️  Initializing Supabase Storage: ${bucketName}...`);

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) throw listError;

    const bucketExists = buckets.find(b => b.name === bucketName);

    if (bucketExists) {
      console.log(`✅ Bucket "${bucketName}" already exists.`);
    } else {
      console.log(`📝 Creating bucket "${bucketName}"...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: [
          'image/*',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ]
      });

      if (createError) throw createError;
      console.log(`✅ Bucket "${bucketName}" created successfully!`);
    }

    // Update bucket to be public if it wasn't
    const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
      public: true
    });
    
    if (updateError) {
      console.warn(`⚠️  Warning: Could not set bucket to public: ${updateError.message}`);
    } else {
      console.log(`🌐 Bucket "${bucketName}" is now public.`);
    }

    // Apply RLS Policies via SQL
    console.log(`🔐 Applying RLS policies for "${bucketName}"...`);
    const policiesSql = `
      -- Allow public access to read files
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
          CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = '${bucketName}' );
        END IF;
      END $$;

      -- Allow authenticated users to upload files
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload files' AND tablename = 'objects' AND schemaname = 'storage') THEN
          CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = '${bucketName}' AND auth.role() = 'authenticated' );
        END IF;
      END $$;

      -- Allow users to update their own files
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own files' AND tablename = 'objects' AND schemaname = 'storage') THEN
          CREATE POLICY "Users can update their own files" ON storage.objects FOR UPDATE USING ( bucket_id = '${bucketName}' AND (storage.foldername(name))[1] = auth.uid()::text );
        END IF;
      END $$;

      -- Allow users to delete their own files
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own files' AND tablename = 'objects' AND schemaname = 'storage') THEN
          CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE USING ( bucket_id = '${bucketName}' AND (storage.foldername(name))[1] = auth.uid()::text );
        END IF;
      END $$;
    `;

    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: policiesSql });

    if (sqlError) {
      console.error(`❌ Failed to apply policies via RPC: ${sqlError.message}`);
      console.log(`💡 Please run the following SQL manually in your Supabase SQL Editor:`);
      console.log(`\n${policiesSql}\n`);
    } else {
      console.log(`✅ RLS policies applied successfully!`);
    }

  } catch (error) {
    console.error("❌ Failed to initialize storage:", error);
    process.exit(1);
  }
}

initStorage();
