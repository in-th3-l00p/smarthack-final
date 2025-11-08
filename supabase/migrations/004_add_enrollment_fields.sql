-- Add submission fields to enrollments table
-- This allows students to submit text-based solutions as well

ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS submission_text TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_score INTEGER CHECK (review_score >= 1 AND review_score <= 5),
ADD COLUMN IF NOT EXISTS review_comment TEXT;
