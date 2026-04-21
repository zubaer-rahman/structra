-- Enable storage for the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('structra-files', 'structra-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to read files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'structra-files' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'structra-files' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'structra-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'structra-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
