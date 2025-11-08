-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('teacher', 'student', 'both')) DEFAULT 'student',
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  reputation_score INTEGER DEFAULT 0,
  total_tasks_created INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  total_tasks_attempted INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  stake_amount NUMERIC NOT NULL CHECK (stake_amount > 0),
  reward_amount NUMERIC NOT NULL CHECK (reward_amount > 0),
  student_stake_required NUMERIC NOT NULL CHECK (student_stake_required > 0),
  max_attempts INTEGER DEFAULT 3,
  time_limit_minutes INTEGER,
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  total_attempts INTEGER DEFAULT 0,
  successful_completions INTEGER DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Task submissions table
CREATE TABLE task_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  submission_content TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  stake_amount NUMERIC NOT NULL,
  reward_earned NUMERIC DEFAULT 0,
  teacher_feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, student_id)
);

-- Staking transactions table
CREATE TABLE staking_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES task_submissions(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('stake', 'reward', 'penalty', 'refund')) NOT NULL,
  amount NUMERIC NOT NULL,
  tx_hash TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task ratings table
CREATE TABLE task_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, student_id)
);

-- Teacher ratings table
CREATE TABLE teacher_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat rooms table (for teacher-student collaboration)
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('task_discussion', 'general', 'ai_assistance')) DEFAULT 'task_discussion',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat room participants table
CREATE TABLE chat_room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_ai_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation explanations table (for transparency)
CREATE TABLE recommendation_explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  explanation TEXT NOT NULL,
  relevance_score NUMERIC,
  factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User data access log (for GDPR compliance)
CREATE TABLE user_data_access_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT CHECK (action IN ('view', 'export', 'delete')) NOT NULL,
  data_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('task_submitted', 'task_graded', 'new_task', 'message', 'reward')) NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_teacher_id ON tasks(teacher_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_task_submissions_student_id ON task_submissions(student_id);
CREATE INDEX idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX idx_staking_transactions_user_id ON staking_transactions(user_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can view all profiles, but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks: Everyone can view active tasks, only teachers can create/update their own
CREATE POLICY "Active tasks are viewable by everyone" ON tasks FOR SELECT USING (status = 'active' OR teacher_id = auth.uid());
CREATE POLICY "Teachers can create tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = teacher_id);

-- Task submissions: Students can view/create their own, teachers can view submissions for their tasks
CREATE POLICY "Students can view own submissions" ON task_submissions FOR SELECT USING (auth.uid() = student_id OR auth.uid() IN (SELECT teacher_id FROM tasks WHERE id = task_id));
CREATE POLICY "Students can create submissions" ON task_submissions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Teachers can update submissions for their tasks" ON task_submissions FOR UPDATE USING (auth.uid() IN (SELECT teacher_id FROM tasks WHERE id = task_id));

-- Staking transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON staking_transactions FOR SELECT USING (auth.uid() = user_id);

-- Task ratings: Everyone can view, only students who completed the task can rate
CREATE POLICY "Task ratings are viewable by everyone" ON task_ratings FOR SELECT USING (true);
CREATE POLICY "Students can rate completed tasks" ON task_ratings FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Teacher ratings: Everyone can view, only students can rate
CREATE POLICY "Teacher ratings are viewable by everyone" ON teacher_ratings FOR SELECT USING (true);
CREATE POLICY "Students can rate teachers" ON teacher_ratings FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Chat rooms: Participants can view their rooms
CREATE POLICY "Participants can view their chat rooms" ON chat_rooms FOR SELECT USING (
  id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid())
);

-- Chat messages: Participants can view and send messages in their rooms
CREATE POLICY "Participants can view messages in their rooms" ON chat_messages FOR SELECT USING (
  room_id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Participants can send messages" ON chat_messages FOR INSERT WITH CHECK (
  room_id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid())
);

-- Recommendations: Users can view their own recommendations
CREATE POLICY "Users can view own recommendations" ON recommendation_explanations FOR SELECT USING (auth.uid() = user_id);

-- User data access log: Users can view their own logs
CREATE POLICY "Users can view own access log" ON user_data_access_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own access log" ON user_data_access_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: Users can view and update their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_submissions_updated_at BEFORE UPDATE ON task_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
