'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getAvailableHomeworks,
  getEnrollments,
  getQuestions,
  enrollInHomework,
  checkMentorEligibility,
} from '@/lib/supabase/queries';
import type { HomeworkWithTeacher, EnrollmentWithDetails, Question } from '@/lib/types/database';
import {
  BookOpen,
  Users,
  Star,
  Coins,
  Trophy,
  MessageCircle,
  CheckCircle,
  Award,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function StudentDashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [availableHomeworks, setAvailableHomeworks] = useState<HomeworkWithTeacher[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [canBecomeMentor, setCanBecomeMentor] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Wait for wallet to reconnect on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialCheckDone(true);
    }, 3000); // Wait 3 seconds for wallet reconnection

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only redirect if we've waited and still not connected
    if (initialCheckDone && !isConnected) {
      router.push('/');
      return;
    }

    if (!isConnected) return;

    async function loadData() {
      if (!address) return;

      try {
        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', address.toLowerCase())
          .single();

        if (!profileData || profileData.role !== 'student') {
          router.push('/dashboard');
          return;
        }

        setProfile(profileData);

        // Check mentor eligibility
        const eligible = await checkMentorEligibility(profileData.id);
        setCanBecomeMentor(eligible && !profileData.is_mentor);

        // Load available homeworks
        const homeworksData = await getAvailableHomeworks();
        console.log('Available homeworks:', homeworksData);
        setAvailableHomeworks(homeworksData);

        // Load my enrollments
        const enrollmentsData = await getEnrollments({ studentId: profileData.id });
        console.log('My enrollments:', enrollmentsData);
        setMyEnrollments(enrollmentsData);

        // Load my questions
        const questionsData = await getQuestions({ studentId: profileData.id });
        setMyQuestions(questionsData);
      } catch (error: any) {
        console.error('Error loading data:', error);
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [address, isConnected, router, initialCheckDone]);

  async function handleEnroll(homeworkId: string) {
    if (!profile) return;

    setEnrolling(homeworkId);
    try {
      await enrollInHomework(profile.id, homeworkId);

      // Refresh data
      const enrollmentsData = await getEnrollments({ studentId: profile.id });
      setMyEnrollments(enrollmentsData);

      const homeworksData = await getAvailableHomeworks();
      setAvailableHomeworks(homeworksData);

      alert('Enrolled successfully! ✅');
    } catch (error: any) {
      console.error('Error enrolling:', error);
      if (error.message?.includes('duplicate')) {
        alert('You are already enrolled in this task!');
      } else {
        alert('Error enrolling. Please try again.');
      }
    } finally {
      setEnrolling(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return null;
  }

  const unansweredQuestions = myQuestions.filter(q => !q.is_answered).length;

  return (
    <div className="container mx-auto py-8 px-4 mesh-gradient min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Student Dashboard</h1>
          <p className="text-lg text-foreground/80 font-medium">
            Browse tasks, ask questions, and learn! 🚀
          </p>
        </div>

        {/* Mentor Eligibility Banner */}
        {canBecomeMentor && (
          <div className="mb-6 liquid-glass rounded-3xl p-6 animate-slide-in glow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center ring-2 ring-secondary/50 shadow-lg">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg text-foreground">
                    You're eligible to become a Mentor! ✨
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You have {profile?.rating?.toFixed(1) || '0.0'}+ stars and {profile?.completed_count || 0}+ completed tasks
                  </p>
                </div>
              </div>
              <Link href="/dashboard/student/become-mentor">
                <button className="liquid-glass px-6 py-3 rounded-xl text-sm font-bold text-foreground hover:text-primary transition-all flex items-center gap-2 bg-gradient-to-br from-secondary/20 to-primary/20 hover:scale-105">
                  <Award className="w-5 h-5" />
                  Become a Mentor
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="liquid-glass rounded-2xl p-6 hover-lift animate-fade-in group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">My Enrollments</p>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all group-hover:scale-110">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{myEnrollments.length}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">active tasks</p>
          </div>

          <div className="liquid-glass rounded-2xl p-6 hover-lift animate-fade-in group" style={{animationDelay: '100ms'}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Completed</p>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all group-hover:scale-110">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile?.completed_count || 0}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">tasks finished</p>
          </div>

          <div className="liquid-glass rounded-2xl p-6 hover-lift animate-fade-in group" style={{animationDelay: '200ms'}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">My Rating</p>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all group-hover:scale-110">
                <Star className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile?.rating?.toFixed(1) || '0.0'}<span className="text-2xl">/5</span></div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              {profile?.total_reviews || 0} {(profile?.total_reviews || 0) === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          <div className="liquid-glass rounded-2xl p-6 hover-lift animate-fade-in group" style={{animationDelay: '300ms'}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Token Balance</p>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all group-hover:scale-110">
                <Coins className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile?.token_balance || 0}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">tokens</p>
          </div>
        </div>

        {/* NFT Achievements Card */}
        <div className="mb-8 liquid-glass rounded-3xl p-6 sm:p-8 hover-lift">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-2 ring-primary/50 shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">NFT Achievements</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  View your collection of achievement badges earned from completed tasks
                </p>
              </div>
            </div>
            <Link href="/dashboard/student/achievements" className="w-full sm:w-auto">
              <button className="liquid-glass px-6 py-3 rounded-xl text-sm font-bold text-foreground hover:text-primary transition-all flex items-center justify-center gap-2 bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:scale-105 w-full sm:w-auto whitespace-nowrap">
                <Trophy className="w-5 h-5" />
                View All Achievements
              </button>
            </Link>
          </div>
        </div>

        {/* My Enrollments */}
        {myEnrollments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">My Enrollments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myEnrollments.map((enrollment) => {
                return (
                  <Card key={enrollment.id} className="liquid-glass rounded-3xl overflow-visible hover-lift group border-0">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {enrollment.homework?.title}
                          </CardTitle>
                          <CardDescription>
                            Teacher: {enrollment.homework?.teacher?.username || 'Unknown'}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            enrollment.status === 'reviewed'
                              ? 'default'
                              : enrollment.status === 'completed'
                              ? 'secondary'
                              : 'outline'
                          }
                          className={enrollment.status === 'reviewed' ? 'bg-primary' : ''}
                        >
                          {enrollment.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {enrollment.homework?.description || 'No description'}
                      </p>

                      {/* Teacher Feedback - Only shown if reviewed */}
                      {enrollment.status === 'reviewed' && enrollment.review_score !== null && (
                        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-foreground">Teacher Feedback:</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < enrollment.review_score!
                                      ? 'fill-primary text-primary'
                                      : 'fill-muted text-muted'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                              {enrollment.review_score}/5
                            </span>
                            <span className="text-xs text-muted-foreground">stars</span>
                          </div>
                          {enrollment.review_comment && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Comment:</p>
                              <p className="text-sm text-foreground italic line-clamp-2">
                                "{enrollment.review_comment}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Link href={`/dashboard/student/homework/${enrollment.homework_id}`} className="flex-1">
                          <Button variant="default" size="sm" className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all">
                            <Eye className="w-4 h-4 mr-1.5" />
                            View Task
                          </Button>
                        </Link>
                        <Link
                          href={`/dashboard/student/homework/${enrollment.homework_id}/questions`}
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full border-secondary/40 text-secondary hover:bg-secondary/10 hover:border-secondary/60 hover:text-secondary shadow-sm hover:shadow-md transition-all">
                            <MessageCircle className="w-4 h-4 mr-1.5" />
                            Questions
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Tasks */}
        <div>
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Available Tasks</h2>
          {availableHomeworks.length === 0 ? (
            <div className="liquid-glass rounded-3xl p-12 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 ring-2 ring-primary/30">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <p className="text-muted-foreground text-lg">No tasks available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableHomeworks.map((homework) => {
                const isEnrolled = myEnrollments.some(
                  (e) => e.homework_id === homework.id
                );
                const slotsLeft = homework.max_students - homework.current_students;

                return (
                    <Card
                      key={homework.id}
                      className={isEnrolled ? 'liquid-glass rounded-3xl overflow-visible hover-lift ring-2 ring-primary/50 shadow-lg shadow-primary/20 border-0' : 'liquid-glass rounded-3xl overflow-visible hover-lift hover:ring-2 hover:ring-primary/30 transition-all border-0'}
                    >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{homework.title}</CardTitle>
                        {isEnrolled && (
                          <Badge variant="default" className="bg-primary">
                            Enrolled
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        Teacher: {homework.teacher.username || 'Unknown'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {homework.description || 'No description provided'}
                      </p>
                      <div className="flex items-center justify-between text-sm mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {homework.current_students}/{homework.max_students} students
                          </span>
                        </div>
                        <Badge
                          variant={slotsLeft > 3 ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {slotsLeft} {slotsLeft === 1 ? 'slot' : 'slots'} left
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/student/task/${homework.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full border-accent/40 text-accent hover:bg-accent/10 hover:border-accent/60 hover:text-accent shadow-sm hover:shadow-md transition-all">
                            <Eye className="w-4 h-4 mr-1.5" />
                            Details
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="flex-[1.5] bg-gradient-to-r from-primary via-secondary to-primary hover:from-primary/90 hover:via-secondary/90 hover:to-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isEnrolled || enrolling === homework.id || slotsLeft === 0}
                          onClick={() => handleEnroll(homework.id)}
                        >
                          {enrolling === homework.id
                            ? 'Enrolling...'
                            : isEnrolled
                            ? 'Enrolled ✓'
                            : slotsLeft === 0
                            ? 'Full'
                            : 'Enroll Now'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
