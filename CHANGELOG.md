# Changelog

## [Latest Update] - 2025-11-08

### Added

#### 1. Auto-redirect după login
- Dashboard-ul principal (`/dashboard/page.tsx`) acum redirecționează automat utilizatorii către dashboard-ul specific rolului lor (student/teacher)
- Home page-ul (`/`) rămâne accesibil ca buton în navbar

#### 2. Student File Upload System
- **Locație**: `/dashboard/student/homework/[id]/page.tsx`
- Studenții pot acum încărca fișiere în orice format (PDF, DOCX, ZIP, images, etc.)
- Suport pentru multiple fișiere per task
- Fișierele sunt stocate în Supabase Storage în bucket-ul `submissions`
- Afișare listă cu toate fișierele încărcate, cu status și dată
- Posibilitate de download pentru fiecare fișier

#### 3. Teacher Submissions Review Page
- **Locație**: `/dashboard/teacher/submissions/page.tsx`
- Profesorii pot vedea toate fișierele încărcate de studenți
- Filtrare după status: All, Unreviewed, Reviewed
- Download direct pentru fiecare fișier
- Marcare fișiere ca "reviewed"
- Informații detaliate: student, task, dată upload, etc.

#### 4. Unreviewed Work Section
- Adăugat card "Unreviewed Work" în dashboard-ul profesorului
- Afișează numărul de submission-uri care nu au fost revizuite
- Link direct către pagina de submissions
- Poziționat lângă "Unanswered Questions" pentru vizibilitate

### Technical Changes

#### Database Schema
- **New Table**: `submissions`
  - `id`: UUID primary key
  - `enrollment_id`: Reference la enrollment
  - `student_id`: Reference la student
  - `homework_id`: Reference la homework
  - `file_url`: URL-ul fișierului în storage
  - `file_name`: Numele original al fișierului
  - `file_type`: Tipul MIME al fișierului
  - `status`: 'submitted' | 'reviewed'
  - `submitted_at`: Data upload-ului
  - `reviewed_at`: Data revizuirii (nullable)

- **Updated Table**: `enrollments`
  - `submission_text`: Text submission (optional)
  - `completed_at`: Data finalizării
  - `review_score`: Scor (1-5)
  - `review_comment`: Comentariu profesor

#### New Files
1. `frontend/lib/types/database.ts` - Added `Submission`, `SubmissionStatus`, `SubmissionWithDetails`
2. `frontend/lib/supabase/queries.ts` - Added submission queries:
   - `getSubmissions()`
   - `createSubmission()`
   - `updateSubmissionStatus()`
   - `getUnreviewedSubmissions()`
3. `frontend/app/dashboard/teacher/submissions/page.tsx` - New teacher submissions page
4. `supabase/migrations/003_add_submissions.sql` - Submissions table migration
5. `supabase/migrations/004_add_enrollment_fields.sql` - Enrollment fields migration
6. `supabase/apply-migrations.md` - Migration instructions

#### Updated Files
1. `frontend/app/dashboard/student/homework/[id]/page.tsx`:
   - Added file upload functionality
   - Added uploaded files list with download buttons
   - Separated text submission from file submission

2. `frontend/app/dashboard/teacher/page.tsx`:
   - Added "Unreviewed Work" stats card
   - Load unreviewed submissions count
   - Updated grid layout to 5 columns

### Migration Instructions

To apply these changes:

1. **Database Migration**:
   ```bash
   # Apply migrations in Supabase SQL Editor:
   # 1. Run migrations/003_add_submissions.sql
   # 2. Run migrations/004_add_enrollment_fields.sql
   ```

2. **Storage Setup**:
   - Create `submissions` bucket in Supabase Storage
   - Set it as public
   - Apply storage policies (see `apply-migrations.md`)

3. **Frontend**:
   ```bash
   cd frontend
   npm install  # If needed
   npm run dev
   ```

### Features Summary

✅ Students can upload files in any format for their homework
✅ Students can see all their uploaded files with status
✅ Teachers have a dedicated page to view all student submissions
✅ Teachers can download and review student files
✅ Teachers can mark submissions as reviewed
✅ Dashboard shows unreviewed work count
✅ Auto-redirect to role-specific dashboard after login
✅ Both text and file submissions supported

### User Flow

**For Students**:
1. Login → Auto-redirect to student dashboard
2. Go to a task → Upload files section
3. Select any file type → Upload
4. View all uploaded files with status
5. Can also submit text-based solution

**For Teachers**:
1. Login → Auto-redirect to teacher dashboard
2. See "Unreviewed Work" count in stats
3. Click "View all" → Submissions page
4. Filter by status (All/Unreviewed/Reviewed)
5. Download files, mark as reviewed
