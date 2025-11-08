-- MVP Schema for EduChain
-- Simplified version focusing on core features

-- Drop existing tables if they exist
DROP TABLE IF EXISTS recommendation_explanations CASCADE;
DROP TABLE IF EXISTS privacy_logs CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS task_ratings CASCADE;
DROP TABLE IF EXISTS task_submissions CASCADE;
DROP TABLE IF EXISTS staking_transactions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  role TEXT CHECK (role IN ('student', 'teacher')) NOT NULL,
  token_balance NUMERIC DEFAULT 0 CHECK (token_balance >= 0),
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  completed_count INTEGER DEFAULT 0,
  is_mentor BOOLEAN DEFAULT false,
  total_reviews INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. HOMEWORKS TABLE
-- ============================================
CREATE TABLE homeworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  max_students INTEGER NOT NULL CHECK (max_students > 0),
  current_students INTEGER DEFAULT 0 CHECK (current_students >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: current students cannot exceed max
  CONSTRAINT current_not_exceed_max CHECK (current_students <= max_students)
);

-- ============================================
-- 3. ENROLLMENTS TABLE
-- ============================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  homework_id UUID REFERENCES homeworks(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'reviewed')) DEFAULT 'active',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One student can only enroll once per homework
  UNIQUE(student_id, homework_id)
);

-- ============================================
-- 4. QUESTIONS TABLE
-- ============================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  homework_id UUID REFERENCES homeworks(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. ANSWERS TABLE
-- ============================================
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  answerer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  answer_text TEXT NOT NULL,
  is_from_teacher BOOLEAN DEFAULT false,
  tokens_earned NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  homework_id UUID REFERENCES homeworks(id) ON DELETE CASCADE NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One review per reviewer per student per homework
  UNIQUE(reviewer_id, student_id, homework_id)
);

-- ============================================
-- 7. VOTES TABLE (DAO System)
-- ============================================
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  voted_for_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL,
  voter_role TEXT CHECK (voter_role IN ('student', 'teacher')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One vote per voter per votee
  UNIQUE(voter_id, voted_for_id)
);

-- ============================================
-- 8. TOKEN TRANSACTIONS TABLE
-- ============================================
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('earned', 'spent', 'initial', 'mentor_reward')) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_homeworks_teacher ON homeworks(teacher_id);
CREATE INDEX idx_homeworks_active ON homeworks(is_active);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_homework ON enrollments(homework_id);
CREATE INDEX idx_questions_student ON questions(student_id);
CREATE INDEX idx_questions_homework ON questions(homework_id);
CREATE INDEX idx_questions_answered ON questions(is_answered);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_answerer ON answers(answerer_id);
CREATE INDEX idx_reviews_student ON reviews(student_id);
CREATE INDEX idx_reviews_homework ON reviews(homework_id);
CREATE INDEX idx_votes_voter ON votes(voter_id);
CREATE INDEX idx_votes_voted_for ON votes(voted_for_id);
CREATE INDEX idx_token_transactions_user ON token_transactions(user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update current_students count on enrollment
CREATE OR REPLACE FUNCTION update_homework_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE homeworks
    SET current_students = current_students + 1
    WHERE id = NEW.homework_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE homeworks
    SET current_students = GREATEST(0, current_students - 1)
    WHERE id = OLD.homework_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_homework_count
AFTER INSERT OR DELETE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION update_homework_student_count();

-- Function: Update question answered status
CREATE OR REPLACE FUNCTION mark_question_answered()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE questions
  SET is_answered = true
  WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_answered
AFTER INSERT ON answers
FOR EACH ROW
EXECUTE FUNCTION mark_question_answered();

-- Function: Update student rating when reviewed
CREATE OR REPLACE FUNCTION update_student_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
BEGIN
  SELECT AVG(stars), COUNT(*)
  INTO avg_rating, review_count
  FROM reviews
  WHERE student_id = NEW.student_id;

  UPDATE profiles
  SET
    rating = ROUND(avg_rating, 2),
    total_reviews = review_count
  WHERE id = NEW.student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_student_rating();

-- Function: Update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE profiles SET upvotes = upvotes + 1 WHERE id = NEW.voted_for_id;
    ELSE
      UPDATE profiles SET downvotes = downvotes + 1 WHERE id = NEW.voted_for_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE profiles SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.voted_for_id;
    ELSE
      UPDATE profiles SET downvotes = GREATEST(0, downvotes - 1) WHERE id = OLD.voted_for_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Remove old vote
    IF OLD.vote_type = 'upvote' THEN
      UPDATE profiles SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.voted_for_id;
    ELSE
      UPDATE profiles SET downvotes = GREATEST(0, downvotes - 1) WHERE id = OLD.voted_for_id;
    END IF;
    -- Add new vote
    IF NEW.vote_type = 'upvote' THEN
      UPDATE profiles SET upvotes = upvotes + 1 WHERE id = NEW.voted_for_id;
    ELSE
      UPDATE profiles SET downvotes = downvotes + 1 WHERE id = NEW.voted_for_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_votes
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_vote_counts();

-- Function: Add token transaction and update balance
CREATE OR REPLACE FUNCTION process_token_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET token_balance = token_balance + NEW.amount
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_tokens
AFTER INSERT ON token_transactions
FOR EACH ROW
EXECUTE FUNCTION process_token_transaction();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Everyone can view, users can update their own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Homeworks: Everyone can view, teachers can create/update their own
CREATE POLICY "Homeworks are viewable by everyone"
  ON homeworks FOR SELECT
  USING (true);

CREATE POLICY "Teachers can create homeworks"
  ON homeworks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can update own homeworks"
  ON homeworks FOR UPDATE
  USING (teacher_id IN (SELECT id FROM profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- Enrollments: Everyone can view, students can enroll
CREATE POLICY "Enrollments are viewable by everyone"
  ON enrollments FOR SELECT
  USING (true);

CREATE POLICY "Students can enroll"
  ON enrollments FOR INSERT
  WITH CHECK (true);

-- Questions: Everyone can view, students can ask
CREATE POLICY "Questions are viewable by everyone"
  ON questions FOR SELECT
  USING (true);

CREATE POLICY "Students can ask questions"
  ON questions FOR INSERT
  WITH CHECK (true);

-- Answers: Everyone can view, teachers/mentors can answer
CREATE POLICY "Answers are viewable by everyone"
  ON answers FOR SELECT
  USING (true);

CREATE POLICY "Teachers and mentors can answer"
  ON answers FOR INSERT
  WITH CHECK (true);

-- Reviews: Everyone can view, teachers/mentors can review
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Teachers and mentors can review"
  ON reviews FOR INSERT
  WITH CHECK (true);

-- Votes: Everyone can view and vote
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote"
  ON votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own votes"
  ON votes FOR UPDATE
  USING (voter_id IN (SELECT id FROM profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- Token transactions: Users can view their own
CREATE POLICY "Users can view own transactions"
  ON token_transactions FOR SELECT
  USING (user_id IN (SELECT id FROM profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

CREATE POLICY "Anyone can create transactions"
  ON token_transactions FOR INSERT
  WITH CHECK (true);
