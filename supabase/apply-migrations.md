# Apply Database Migrations - UPDATED

## ⚠️ IMPORTANT: Run these migrations in your Supabase Dashboard NOW!

Your application is currently **broken** because these database tables don't exist yet.

---

## Quick Steps:

### 1. **Open Supabase Dashboard**
   - Go to your Supabase project: https://app.supabase.com
   - Navigate to **SQL Editor**

### 2. **Copy & Run Migration 003** (Submissions Table)
   - Open: `migrations/003_add_submissions.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run**

### 3. **Copy & Run Migration 004** (Enrollment Fields)
   - Open: `migrations/004_add_enrollment_fields.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run**

### 4. **Copy & Run Migration 005** (Task Resources)
   - Open: `migrations/005_add_task_resources.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run**

### 5. **Copy & Run Migration 006** (Storage Buckets + Cleanup)
   - Open: `migrations/006_setup_storage_and_cleanup.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run**
   - This will:
     - ✅ Create storage buckets (submissions, task-resources)
     - ✅ Set up all storage policies automatically
     - ✅ Remove deadline column (no longer used)
     - ✅ Clean up enrollment statuses

### 6. **Copy & Run Migration 007** (NFT Badges)
   - Open: `migrations/007_add_badges.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run**
   - This will:
     - ✅ Create badges table for NFT achievements
     - ✅ Set up policies for viewing and creating badges

### 7. **Copy & Run Migration 008** (Teacher Reviews) ⭐ NEW!
   - Open: `migrations/008_add_teacher_reviews.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run**
   - This will:
     - ✅ Add teacher_id column to reviews table
     - ✅ Allow students to review teachers
     - ✅ Update rating calculation for both students and teachers
     - ✅ Add unique constraints for teacher reviews

---

## 8. **Verify Everything Works**

Run this query in SQL Editor to verify:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('submissions', 'task_resources', 'homeworks', 'enrollments', 'badges', 'reviews');

-- Check storage buckets exist
SELECT id, name, public
FROM storage.buckets
WHERE id IN ('submissions', 'task-resources');

-- Check homeworks does NOT have deadline column (should return 0 rows)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'homeworks'
AND column_name = 'deadline';

-- Check reviews table has teacher_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews'
AND column_name IN ('student_id', 'teacher_id')
ORDER BY column_name;
```

Expected results:
- ✅ 6 tables found: submissions, task_resources, homeworks, enrollments, badges, reviews
- ✅ 2 buckets found: submissions, task-resources
- ✅ 0 rows for deadline column (it should be removed)
- ✅ Both student_id and teacher_id columns exist in reviews table (both nullable)

---

## What These Migrations Do:

1. ✅ **003**: Creates `submissions` table for student file uploads
2. ✅ **004**: Adds `submission_text`, `review_score`, `review_comment`, `completed_at` to enrollments
3. ✅ **005**: Creates `task_resources` table for teacher resource uploads
4. ✅ **006**:
   - Creates storage buckets automatically
   - Sets up all storage policies
   - Removes deadline functionality
   - Cleans up enrollment statuses
5. ✅ **007**: Creates `badges` table for NFT achievements
6. ✅ **008**:
   - Adds teacher_id to reviews table
   - Enables students to review teachers
   - Updates rating triggers for both students and teachers

---

## After Running Migrations:

1. **Refresh your application** - The errors should disappear
2. **Test file uploads**:
   - As a teacher: Create a homework and upload resource files
   - As a student: Enroll in homework and upload submission files
3. **All file upload error handling is now in place** with detailed user feedback

---

## Troubleshooting:

**If you get "permission denied" errors:**
- Make sure you're logged in as the database owner
- Try running each migration separately

**If storage buckets fail to create:**
- Go to Storage section in dashboard
- Manually create buckets: `submissions` and `task-resources`
- Make both public
- Then re-run migration 006 (just the policy parts will execute)

**If you see "already exists" errors:**
- This is OK! It means the migration was already partially applied
- The migrations use `IF NOT EXISTS` and `ON CONFLICT` to be safe
