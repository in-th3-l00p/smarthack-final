-- Add support for teacher reviews
-- Students can now review teachers in addition to teachers reviewing students

-- First, drop the existing constraint and make student_id optional
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_student_id_fkey,
  ALTER COLUMN student_id DROP NOT NULL;

-- Add teacher_id column (nullable)
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Re-add the student_id foreign key
ALTER TABLE reviews
  ADD CONSTRAINT reviews_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add check constraint to ensure either student_id OR teacher_id is set (but not both)
ALTER TABLE reviews
  ADD CONSTRAINT reviews_target_check
  CHECK (
    (student_id IS NOT NULL AND teacher_id IS NULL) OR
    (student_id IS NULL AND teacher_id IS NOT NULL)
  );

-- Drop old unique constraint
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_reviewer_id_student_id_homework_id_key;

-- Add new unique constraints
-- One review per reviewer per student per homework
CREATE UNIQUE INDEX IF NOT EXISTS reviews_student_unique
  ON reviews(reviewer_id, student_id, homework_id)
  WHERE student_id IS NOT NULL;

-- One review per reviewer per teacher per homework
CREATE UNIQUE INDEX IF NOT EXISTS reviews_teacher_unique
  ON reviews(reviewer_id, teacher_id, homework_id)
  WHERE teacher_id IS NOT NULL;

-- Add index for teacher reviews
CREATE INDEX IF NOT EXISTS idx_reviews_teacher ON reviews(teacher_id) WHERE teacher_id IS NOT NULL;

-- Update the rating calculation function to handle teacher reviews separately
CREATE OR REPLACE FUNCTION update_rating_on_review()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
  target_profile_id UUID;
BEGIN
  -- Determine which profile to update (student or teacher)
  IF NEW.student_id IS NOT NULL THEN
    target_profile_id := NEW.student_id;
  ELSIF NEW.teacher_id IS NOT NULL THEN
    target_profile_id := NEW.teacher_id;
  ELSE
    RETURN NEW; -- Should not happen due to check constraint
  END IF;

  -- Calculate average rating for the target profile
  SELECT AVG(stars), COUNT(*)
  INTO avg_rating, review_count
  FROM reviews
  WHERE (student_id = target_profile_id OR teacher_id = target_profile_id);

  -- Update the profile
  UPDATE profiles
  SET
    rating = ROUND(avg_rating, 2),
    total_reviews = review_count
  WHERE id = target_profile_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS trigger_update_rating ON reviews;
DROP TRIGGER IF EXISTS trigger_update_student_rating ON reviews;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_rating_on_review();

-- Update RLS policy to allow students to review teachers
-- (The existing policy already allows this, but let's be explicit)
DROP POLICY IF EXISTS "Teachers and mentors can review" ON reviews;

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE reviews IS 'Reviews can be for students (by teachers/mentors) or for teachers (by students)';
COMMENT ON COLUMN reviews.student_id IS 'Set when reviewing a student (mutually exclusive with teacher_id)';
COMMENT ON COLUMN reviews.teacher_id IS 'Set when reviewing a teacher (mutually exclusive with student_id)';
