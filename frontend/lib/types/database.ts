// ============================================
// DATABASE TYPES - MVP Schema
// ============================================

export type UserRole = 'student' | 'teacher';
export type EnrollmentStatus = 'active' | 'completed' | 'reviewed' | 'missed';
export type VoteType = 'upvote' | 'downvote';
export type TransactionType = 'earned' | 'spent' | 'initial' | 'mentor_reward' | 'penalty';
export type SubmissionStatus = 'submitted' | 'reviewed';

// ============================================
// PROFILE
// ============================================
export interface Profile {
  id: string;
  wallet_address: string;
  username?: string;
  role: UserRole;
  token_balance: number;
  rating: number;
  completed_count: number;
  is_mentor: boolean;
  total_reviews: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

// ============================================
// HOMEWORK
// ============================================
export interface Homework {
  id: string;
  teacher_id: string;
  title: string;
  description?: string;
  max_students: number;
  current_students: number;
  is_active: boolean;
  deadline: string;
  created_at: string;
  // Joined data
  teacher?: Profile;
}

// ============================================
// ENROLLMENT
// ============================================
export interface Enrollment {
  id: string;
  student_id: string;
  homework_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  submission_text?: string;
  completed_at?: string;
  review_score?: number;
  review_comment?: string;
  // Joined data
  student?: Profile;
  homework?: Homework;
}

// ============================================
// QUESTION
// ============================================
export interface Question {
  id: string;
  student_id: string;
  homework_id: string;
  question_text: string;
  is_answered: boolean;
  created_at: string;
  // Joined data
  student?: Profile;
  homework?: Homework;
  answers?: Answer[];
}

// ============================================
// ANSWER
// ============================================
export interface Answer {
  id: string;
  question_id: string;
  answerer_id: string;
  answer_text: string;
  is_from_teacher: boolean;
  tokens_earned: number;
  created_at: string;
  // Joined data
  answerer?: Profile;
  question?: Question;
}

// ============================================
// REVIEW
// ============================================
export interface Review {
  id: string;
  reviewer_id: string;
  student_id: string;
  homework_id: string;
  stars: number; // 1-5
  comment?: string;
  created_at: string;
  // Joined data
  reviewer?: Profile;
  student?: Profile;
  homework?: Homework;
}

// ============================================
// VOTE (DAO System)
// ============================================
export interface Vote {
  id: string;
  voter_id: string;
  voted_for_id: string;
  vote_type: VoteType;
  voter_role: UserRole;
  created_at: string;
  // Joined data
  voter?: Profile;
  voted_for?: Profile;
}

// ============================================
// TOKEN TRANSACTION
// ============================================
export interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  description?: string;
  created_at: string;
  // Joined data
  user?: Profile;
}

// ============================================
// SUBMISSION (Student Work Upload)
// ============================================
export interface Submission {
  id: string;
  enrollment_id: string;
  student_id: string;
  homework_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_at?: string;
  // Joined data
  student?: Profile;
  homework?: Homework;
  enrollment?: Enrollment;
}

// ============================================
// TASK RESOURCE (Teacher Resource Upload)
// ============================================
export interface TaskResource {
  id: string;
  homework_id: string;
  teacher_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
  // Joined data
  homework?: Homework;
  teacher?: Profile;
}

// ============================================
// HELPER TYPES
// ============================================

export interface HomeworkWithTeacher extends Homework {
  teacher: Profile;
}

export interface QuestionWithDetails extends Question {
  student: Profile;
  homework: Homework;
  answers: (Answer & { answerer: Profile })[];
}

export interface EnrollmentWithDetails extends Enrollment {
  student: Profile;
  homework: HomeworkWithTeacher;
}

export interface SubmissionWithDetails extends Submission {
  student: Profile;
  homework: Homework;
  enrollment: Enrollment;
}

export interface TaskResourceWithDetails extends TaskResource {
  homework: Homework;
  teacher: Profile;
}
