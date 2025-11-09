import { createSupabaseBrowserClient } from './client';
import type {
  Profile,
  Homework,
  Enrollment,
  Question,
  Answer,
  Review,
  Vote,
  TokenTransaction,
  Submission,
  TaskResource,
  Badge,
  HomeworkWithTeacher,
  QuestionWithDetails,
  EnrollmentWithDetails,
  SubmissionWithDetails,
  TaskResourceWithDetails,
  BadgeWithDetails,
} from '@/lib/types/database';

const supabase = createSupabaseBrowserClient();

// ============================================
// PROFILE QUERIES
// ============================================

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getProfileByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Profile | null;
}

export async function createProfile(profile: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profile])
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

// ============================================
// HOMEWORK QUERIES
// ============================================

export async function getHomeworks(filters?: {
  teacherId?: string;
  isActive?: boolean;
  hasSlots?: boolean; // Only homeworks with available slots
}) {
  let query = supabase
    .from('homeworks')
    .select(`
      *,
      teacher:profiles!homeworks_teacher_id_fkey(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.teacherId) {
    query = query.eq('teacher_id', filters.teacherId);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  if (filters?.hasSlots) {
    // Only return homeworks where current_students < max_students
    query = query.lt('current_students', supabase.rpc('max_students'));
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as HomeworkWithTeacher[];
}

export async function getHomework(homeworkId: string) {
  const { data, error } = await supabase
    .from('homeworks')
    .select(`
      *,
      teacher:profiles!homeworks_teacher_id_fkey(*)
    `)
    .eq('id', homeworkId)
    .single();

  if (error) throw error;
  return data as HomeworkWithTeacher;
}

export async function createHomework(homework: {
  teacher_id: string;
  title: string;
  description?: string;
  max_students: number;
}) {
  const homeworkData: any = {
    teacher_id: homework.teacher_id,
    title: homework.title,
    max_students: homework.max_students,
  };

  if (homework.description) {
    homeworkData.description = homework.description;
  }

  const { data, error } = await supabase
    .from('homeworks')
    .insert([homeworkData])
    .select(`
      *,
      teacher:profiles!homeworks_teacher_id_fkey(*)
    `)
    .single();

  if (error) {
    console.error('Error creating homework:', error);
    throw error;
  }
  return data as HomeworkWithTeacher;
}

export async function updateHomework(homeworkId: string, updates: Partial<Homework>) {
  const { data, error } = await supabase
    .from('homeworks')
    .update(updates)
    .eq('id', homeworkId)
    .select()
    .single();

  if (error) throw error;
  return data as Homework;
}

export async function deleteHomework(homeworkId: string) {
  const { error } = await supabase
    .from('homeworks')
    .delete()
    .eq('id', homeworkId);

  if (error) throw error;
}

// ============================================
// ENROLLMENT QUERIES
// ============================================

export async function getEnrollments(filters?: {
  studentId?: string;
  homeworkId?: string;
  status?: string;
}) {
  let query = supabase
    .from('enrollments')
    .select(`
      *,
      student:profiles!enrollments_student_id_fkey(*),
      homework:homeworks(
        *,
        teacher:profiles!homeworks_teacher_id_fkey(*)
      )
    `)
    .order('enrolled_at', { ascending: false });

  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }
  if (filters?.homeworkId) {
    query = query.eq('homework_id', filters.homeworkId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as EnrollmentWithDetails[];
}

export async function enrollInHomework(studentId: string, homeworkId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert([{
      student_id: studentId,
      homework_id: homeworkId,
      status: 'active',
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Enrollment;
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: 'active' | 'completed' | 'reviewed' | 'missed'
) {
  const { data, error } = await supabase
    .from('enrollments')
    .update({ status })
    .eq('id', enrollmentId)
    .select()
    .single();

  if (error) throw error;
  return data as Enrollment;
}

// ============================================
// QUESTION QUERIES
// ============================================

export async function getQuestions(filters?: {
  studentId?: string;
  homeworkId?: string;
  isAnswered?: boolean;
}) {
  let query = supabase
    .from('questions')
    .select(`
      *,
      student:profiles!questions_student_id_fkey(*),
      homework:homeworks(*),
      answers(
        *,
        answerer:profiles!answers_answerer_id_fkey(*)
      )
    `)
    .order('created_at', { ascending: false });

  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }
  if (filters?.homeworkId) {
    query = query.eq('homework_id', filters.homeworkId);
  }
  if (filters?.isAnswered !== undefined) {
    query = query.eq('is_answered', filters.isAnswered);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as QuestionWithDetails[];
}

export async function createQuestion(question: {
  student_id: string;
  homework_id: string;
  question_text: string;
}) {
  const { data, error } = await supabase
    .from('questions')
    .insert([question])
    .select()
    .single();

  if (error) throw error;
  return data as Question;
}

// ============================================
// ANSWER QUERIES
// ============================================

export async function getAnswers(questionId: string) {
  const { data, error } = await supabase
    .from('answers')
    .select(`
      *,
      answerer:profiles!answers_answerer_id_fkey(*)
    `)
    .eq('question_id', questionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as (Answer & { answerer: Profile })[];
}

export async function createAnswer(answer: {
  question_id: string;
  answerer_id: string;
  answer_text: string;
  is_from_teacher: boolean;
  tokens_earned?: number;
}) {
  const { data, error } = await supabase
    .from('answers')
    .insert([answer])
    .select()
    .single();

  if (error) throw error;
  return data as Answer;
}

// ============================================
// REVIEW QUERIES
// ============================================

export async function getReviews(filters?: {
  reviewerId?: string;
  studentId?: string;
  homeworkId?: string;
}) {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(*),
      student:profiles!reviews_student_id_fkey(*),
      homework:homeworks(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.reviewerId) {
    query = query.eq('reviewer_id', filters.reviewerId);
  }
  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }
  if (filters?.homeworkId) {
    query = query.eq('homework_id', filters.homeworkId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Review[];
}

export async function createReview(review: {
  reviewer_id: string;
  student_id?: string;
  teacher_id?: string;
  homework_id: string;
  stars: number;
  comment?: string;
}) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([review])
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

// ============================================
// VOTE QUERIES (DAO)
// ============================================

export async function getVotes(filters?: {
  voterId?: string;
  votedForId?: string;
}) {
  let query = supabase
    .from('votes')
    .select(`
      *,
      voter:profiles!votes_voter_id_fkey(*),
      voted_for:profiles!votes_voted_for_id_fkey(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.voterId) {
    query = query.eq('voter_id', filters.voterId);
  }
  if (filters?.votedForId) {
    query = query.eq('voted_for_id', filters.votedForId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Vote[];
}

export async function createVote(vote: {
  voter_id: string;
  voted_for_id: string;
  vote_type: 'upvote' | 'downvote';
  voter_role: 'student' | 'teacher';
}) {
  const { data, error } = await supabase
    .from('votes')
    .insert([vote])
    .select()
    .single();

  if (error) throw error;
  return data as Vote;
}

export async function updateVote(
  voterId: string,
  votedForId: string,
  voteType: 'upvote' | 'downvote'
) {
  const { data, error } = await supabase
    .from('votes')
    .update({ vote_type: voteType })
    .eq('voter_id', voterId)
    .eq('voted_for_id', votedForId)
    .select()
    .single();

  if (error) throw error;
  return data as Vote;
}

export async function deleteVote(voterId: string, votedForId: string) {
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('voter_id', voterId)
    .eq('voted_for_id', votedForId);

  if (error) throw error;
}

// ============================================
// TOKEN TRANSACTION QUERIES
// ============================================

export async function getTokenTransactions(userId: string) {
  const { data, error } = await supabase
    .from('token_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as TokenTransaction[];
}

export async function createTokenTransaction(transaction: {
  user_id: string;
  amount: number;
  type: 'earned' | 'spent' | 'initial' | 'mentor_reward' | 'penalty';
  description?: string;
}) {
  const { data, error } = await supabase
    .from('token_transactions')
    .insert([transaction])
    .select()
    .single();

  if (error) throw error;
  return data as TokenTransaction;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Check if student can become mentor (rating >= 4 AND completed >= 3)
export async function checkMentorEligibility(studentId: string): Promise<boolean> {
  const profile = await getProfile(studentId);
  return profile.rating >= 4 && profile.completed_count >= 3;
}

// Upgrade student to mentor
export async function upgradToMentor(studentId: string) {
  const isEligible = await checkMentorEligibility(studentId);
  if (!isEligible) {
    throw new Error('Student does not meet mentor requirements');
  }

  return await updateProfile(studentId, { is_mentor: true });
}

// Get questions that mentors can answer (all unanswered questions)
export async function getMentorableQuestions() {
  return await getQuestions({ isAnswered: false });
}

// Get available homeworks (with slots)
export async function getAvailableHomeworks() {
  const { data, error } = await supabase
    .from('homeworks')
    .select(`
      *,
      teacher:profiles!homeworks_teacher_id_fkey(*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching homeworks:', error);
    throw error;
  }

  console.log('Raw homeworks from DB:', data);

  // Filter out homeworks that are full (current_students >= max_students)
  const availableHomeworks = (data as HomeworkWithTeacher[]).filter(
    hw => hw.current_students < hw.max_students
  );

  console.log('Filtered available homeworks:', availableHomeworks);

  return availableHomeworks;
}

// ============================================
// SUBMISSION QUERIES
// ============================================

export async function getSubmissions(filters?: {
  studentId?: string;
  homeworkId?: string;
  enrollmentId?: string;
  status?: 'submitted' | 'reviewed';
}) {
  try {
    let query = supabase
      .from('submissions')
      .select(`
        *,
        student:profiles(*)
      `)
      .order('submitted_at', { ascending: false });

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters?.homeworkId) {
      query = query.eq('homework_id', filters.homeworkId);
    }
    if (filters?.enrollmentId) {
      query = query.eq('enrollment_id', filters.enrollmentId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    // If table doesn't exist yet, return empty array
    if (error && error.code === '42P01') {
      console.warn('submissions table does not exist yet. Please run migration 003.');
      return [];
    }

    if (error) {
      console.error('Supabase error in getSubmissions:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }
    return data as SubmissionWithDetails[];
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }
}

export async function createSubmission(submission: {
  enrollment_id: string;
  student_id: string;
  homework_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
}) {
  const { data, error } = await supabase
    .from('submissions')
    .insert([{
      ...submission,
      status: 'submitted',
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Submission;
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: 'submitted' | 'reviewed'
) {
  const { data, error } = await supabase
    .from('submissions')
    .update({
      status,
      reviewed_at: status === 'reviewed' ? new Date().toISOString() : null
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw error;
  return data as Submission;
}

export async function deleteSubmission(submissionId: string) {
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submissionId);

  if (error) throw error;
}

// Get unreviewed submissions for a teacher's homeworks
export async function getUnreviewedSubmissions(teacherId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      student:profiles!submissions_student_id_fkey(*),
      homework:homeworks!inner(*)
    `)
    .eq('homework.teacher_id', teacherId)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data as SubmissionWithDetails[];
}

// ============================================
// TASK RESOURCE QUERIES
// ============================================

export async function getTaskResources(filters?: {
  homeworkId?: string;
  teacherId?: string;
}) {
  try {
    console.log('📥 getTaskResources called with filters:', filters);

    let query = supabase
      .from('task_resources')
      .select(`
        *,
        homework:homeworks!task_resources_homework_id_fkey(*),
        teacher:profiles!task_resources_teacher_id_fkey(*)
      `)
      .order('uploaded_at', { ascending: false });

    if (filters?.homeworkId) {
      query = query.eq('homework_id', filters.homeworkId);
    }
    if (filters?.teacherId) {
      query = query.eq('teacher_id', filters.teacherId);
    }

    const { data, error } = await query;

    console.log('📥 Query result - Data:', data, 'Error:', error);

    // If table doesn't exist yet, return empty array
    if (error && error.code === '42P01') {
      console.warn('task_resources table does not exist yet. Please run migration 005.');
      return [];
    }

    if (error) {
      console.error('❌ Error in getTaskResources query:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    console.log('✅ Returning', data?.length || 0, 'resources');
    return data as TaskResourceWithDetails[];
  } catch (error) {
    console.error('Error fetching task resources:', error);
    return [];
  }
}

export async function createTaskResource(resource: {
  homework_id: string;
  teacher_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
}) {
  const { data, error } = await supabase
    .from('task_resources')
    .insert([resource])
    .select()
    .single();

  if (error) throw error;
  return data as TaskResource;
}

export async function deleteTaskResource(resourceId: string) {
  const { error } = await supabase
    .from('task_resources')
    .delete()
    .eq('id', resourceId);

  if (error) throw error;
}

// ============================================
// BADGE QUERIES (Proof-of-Learning NFTs)
// ============================================

export async function getBadges(filters?: {
  studentId?: string;
  teacherId?: string;
  homeworkId?: string;
  skillVerified?: string;
}) {
  try {
    let query = supabase
      .from('badges')
      .select(`
        *,
        student:profiles!badges_student_id_fkey(*),
        teacher:profiles!badges_teacher_id_fkey(*),
        homework:homeworks(*)
      `)
      .order('minted_at', { ascending: false });

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters?.teacherId) {
      query = query.eq('teacher_id', filters.teacherId);
    }
    if (filters?.homeworkId) {
      query = query.eq('homework_id', filters.homeworkId);
    }
    if (filters?.skillVerified) {
      query = query.eq('skill_verified', filters.skillVerified);
    }

    const { data, error } = await query;

    // If table doesn't exist yet, return empty array
    if (error && error.code === '42P01') {
      console.warn('badges table does not exist yet. Please run migration 007.');
      return [];
    }

    if (error) throw error;
    return data as BadgeWithDetails[];
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
}

export async function getBadge(badgeId: string) {
  const { data, error } = await supabase
    .from('badges')
    .select(`
      *,
      student:profiles!badges_student_id_fkey(*),
      teacher:profiles!badges_teacher_id_fkey(*),
      homework:homeworks(*)
    `)
    .eq('id', badgeId)
    .single();

  if (error) throw error;
  return data as BadgeWithDetails;
}

export async function createBadge(badge: {
  student_id: string;
  homework_id: string;
  teacher_id: string;
  badge_title: string;
  badge_description?: string;
  badge_image_url: string;
  skill_verified: string;
  token_id: string;
  task_title: string;
  teacher_name?: string;
}) {
  const badgeData = {
    ...badge,
    review_score: 5, // Badges are only for 5-star reviews
    blockchain_network: 'EduChain Testnet',
  };

  const { data, error } = await supabase
    .from('badges')
    .insert([badgeData])
    .select(`
      *,
      student:profiles!badges_student_id_fkey(*),
      teacher:profiles!badges_teacher_id_fkey(*),
      homework:homeworks(*)
    `)
    .single();

  if (error) {
    console.error('Error creating badge:', error);
    throw error;
  }

  return data as BadgeWithDetails;
}

export async function deleteBadge(badgeId: string) {
  const { error } = await supabase
    .from('badges')
    .delete()
    .eq('id', badgeId);

  if (error) throw error;
}

// Generate a unique token ID for badges
export function generateBadgeTokenId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `#${timestamp}${random}`;
}

// Get badge stats for a student
export async function getBadgeStats(studentId: string) {
  const badges = await getBadges({ studentId });

  const stats = {
    total: badges.length,
    bySkill: {} as Record<string, number>,
    recentBadges: badges.slice(0, 5), // Last 5 badges
  };

  // Count badges by skill
  badges.forEach(badge => {
    const skill = badge.skill_verified;
    stats.bySkill[skill] = (stats.bySkill[skill] || 0) + 1;
  });

  return stats;
}

