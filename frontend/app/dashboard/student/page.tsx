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

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

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
  }, [address, isConnected, router]);

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
    <div className="container mx-auto py-8 px-4 gradient-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Browse tasks, ask questions, and learn!
          </p>
        </div>

        {/* Mentor Eligibility Banner */}
        {canBecomeMentor && (
          <Card className="mb-6 glass-card rounded-2xl border-secondary/50 animate-slide-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center ring-1 ring-secondary/20">
                    <Trophy className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      You're eligible to become a Mentor!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You have {profile?.rating?.toFixed(1) || '0.0'}+ stars and {profile?.completed_count || 0}+
                      completed tasks
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/student/become-mentor">
                  <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl transition-all">
                    <Award className="w-4 h-4 mr-2" />
                    Become a Mentor
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card rounded-2xl hover-lift border-primary/10 animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-medium">My Enrollments</CardTitle>
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{myEnrollments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">active tasks</p>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-2xl hover-lift border-primary/10 animate-fade-in" style={{animationDelay: '100ms'}}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile?.completed_count || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">tasks finished</p>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-2xl hover-lift border-primary/10 animate-fade-in" style={{animationDelay: '200ms'}}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-medium">My Rating</CardTitle>
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile?.rating?.toFixed(1) || '0.0'}/5</div>
              <p className="text-xs text-muted-foreground mt-1">
                {profile?.total_reviews || 0} {(profile?.total_reviews || 0) === 1 ? 'review' : 'reviews'}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-2xl hover-lift border-primary/10 animate-fade-in" style={{animationDelay: '300ms'}}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-medium">Token Balance</CardTitle>
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile?.token_balance || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">tokens</p>
            </CardContent>
          </Card>
        </div>

        {/* NFT Achievements Card */}
        <Card className="mb-8 glass-card rounded-2xl hover-lift border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-1 ring-primary/20">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  NFT Achievements
                </CardTitle>
                <CardDescription>
                  View your collection of achievement badges earned from completed tasks
                </CardDescription>
              </div>
              <Link href="/dashboard/student/achievements">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                  View All Achievements
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* My Enrollments */}
        {myEnrollments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">My Enrollments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myEnrollments.map((enrollment) => {
                return (
                  <Card key={enrollment.id} className="glass-card rounded-2xl hover-lift border-primary/30">
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
                      <div className="space-y-2">
                        <Link href={`/dashboard/student/homework/${enrollment.homework_id}`}>
                          <Button variant="default" size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Eye className="w-4 h-4 mr-2" />
                            View Task
                          </Button>
                        </Link>
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/student/homework/${enrollment.homework_id}/questions`}
                            className="flex-1"
                          >
                            <Button variant="outline" size="sm" className="w-full border-primary/30 hover:bg-primary/5">
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Questions
                            </Button>
                          </Link>
                        </div>
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
          <h2 className="text-2xl font-bold mb-4">Available Tasks</h2>
          {availableHomeworks.length === 0 ? (
            <Card className="glass-card rounded-2xl border-primary/10">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-primary mb-4" />
                <p className="text-muted-foreground">No tasks available at the moment</p>
              </CardContent>
            </Card>
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
                    className={isEnrolled ? 'glass-card rounded-2xl hover-lift border-primary/50' : 'glass-card rounded-2xl hover-lift border-primary/10 hover:border-primary/30 transition-all'}
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
                      <div className="space-y-2">
                        <Link href={`/dashboard/student/task/${homework.id}`}>
                          <Button variant="outline" size="sm" className="w-full border-primary/30 hover:bg-primary/5">
                            <Eye className="w-4 h-4 mr-2" />
                            View Task Details
                          </Button>
                        </Link>
                        <Button
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                          disabled={isEnrolled || enrolling === homework.id || slotsLeft === 0}
                          onClick={() => handleEnroll(homework.id)}
                        >
                          {enrolling === homework.id
                            ? 'Enrolling...'
                            : isEnrolled
                            ? 'Already Enrolled'
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
