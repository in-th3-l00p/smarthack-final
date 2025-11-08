-- Add Submissions Table for File Uploads
-- Students can upload files for their homework

-- ============================================
-- SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  homework_id UUID REFERENCES homeworks(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('submitted', 'reviewed')) DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Indexes for better performance
  CONSTRAINT fk_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_homework FOREIGN KEY (homework_id) REFERENCES homeworks(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_submissions_enrollment ON submissions(enrollment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_homework ON submissions(homework_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Everyone can view submissions
CREATE POLICY "Submissions are viewable by everyone"
  ON submissions FOR SELECT
  USING (true);

-- Students can upload submissions
CREATE POLICY "Students can upload submissions"
  ON submissions FOR INSERT
  WITH CHECK (true);

-- Teachers can update submission status
CREATE POLICY "Teachers can update submissions"
  ON submissions FOR UPDATE
  USING (true);

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Note: This needs to be run in the Supabase dashboard SQL editor
-- or via the Supabase Storage UI

-- Create storage bucket for submissions (if not exists)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('submissions', 'submissions', true)
-- ON CONFLICT (id) DO NOTHING;

-- Enable public access to submissions bucket
-- CREATE POLICY "Public Access"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'submissions');

-- Allow authenticated users to upload
-- CREATE POLICY "Authenticated users can upload"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'submissions' AND auth.role() = 'authenticated');
