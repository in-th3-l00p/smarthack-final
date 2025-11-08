# Apply Submissions Migration

To apply the new submissions table migration, follow these steps:

1. **Open Supabase Dashboard**: Go to your Supabase project dashboard

2. **SQL Editor**: Navigate to the SQL Editor section

3. **Run Migration**: Copy and paste the content from `migrations/003_add_submissions.sql` and execute it

4. **Create Storage Bucket**:
   - Go to Storage section
   - Create a new bucket named `submissions`
   - Make it public
   - Add the following policies:

```sql
-- Allow public SELECT access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'submissions');

-- Allow authenticated INSERT
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'submissions');

-- Allow authenticated UPDATE (for their own files)
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'submissions');

-- Allow authenticated DELETE (for their own files)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'submissions');
```

5. **Verify**: Check that the `submissions` table has been created successfully

## What was changed:

1. ✅ Added submissions table with file upload support
2. ✅ Added student file upload functionality
3. ✅ Added teacher submission review page
4. ✅ Added "Unreviewed Work" section in teacher dashboard
5. ✅ Dashboard now redirects to role-specific pages after login
