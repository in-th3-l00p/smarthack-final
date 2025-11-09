'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getHomeworks, getEnrollments, getQuestions, getSubmissions } from '@/lib/supabase/queries';
import type { Homework, Profile, Question, Submission } from '@/lib/types/database';
import { Plus, BookOpen, Users, HelpCircle, Coins, TrendingUp, FileText } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function TeacherDashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unansweredQuestions, setUnansweredQuestions] = useState<Question[]>([]);
  const [unreviewedSubmissions, setUnreviewedSubmissions] = useState<Submission[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
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

        if (!profileData || profileData.role !== 'teacher') {
          router.push('/dashboard');
          return;
        }

        setProfile(profileData);

        // Load teacher's homeworks
        const homeworksData = await getHomeworks({ teacherId: profileData.id });
        setHomeworks(homeworksData);

        // Calculate total enrolled students
        let totalEnrolled = 0;
        for (const hw of homeworksData) {
          totalEnrolled += hw.current_students;
        }
        setTotalStudents(totalEnrolled);

        // Load unanswered questions and unreviewed submissions in parallel
        const homeworkIds = homeworksData.map(hw => hw.id);

        // Use Promise.all for parallel queries instead of sequential
        const [questionsResults, submissionsResults] = await Promise.all([
          Promise.all(homeworkIds.map(hwId =>
            getQuestions({ homeworkId: hwId, isAnswered: false }).catch(err => {
              console.error(`Error loading questions for homework ${hwId}:`, err);
              return [];
            })
          )),
          Promise.all(homeworkIds.map(hwId =>
            getSubmissions({ homeworkId: hwId, status: 'submitted' }).catch(err => {
              console.error(`Error loading submissions for homework ${hwId}:`, err);
              return [];
            })
          ))
        ]);

        // Flatten results
        const allQuestions = questionsResults.flat();
        const allSubmissions = submissionsResults.flat();

        setUnansweredQuestions(allQuestions);
        setUnreviewedSubmissions(allSubmissions);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [address, isConnected, router, initialCheckDone]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 gradient-bg min-h-screen">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Manage tasks, answer questions, and review students
          </p>
        </div>
        <Link href="/dashboard/teacher/create-homework">
          <Button size="lg" disabled={profile.token_balance < 1} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all">
            <Plus className="w-5 h-5 mr-2" />
            Create Task
          </Button>
        </Link>
      </div>

      {/* Token Balance Warning */}
      {profile.token_balance < 1 && (
        <Card className="mb-6 glass-card rounded-2xl border-primary/20 animate-slide-in">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-1 ring-primary/20">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <p className="text-foreground">
                <strong>Insufficient tokens!</strong> You need at least 1 token to create a task.
                Each task costs 1 token.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="glass-card rounded-2xl hover-lift border-primary/10 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-medium">Token Balance</CardTitle>
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile.token_balance}</div>
            <p className="text-xs text-muted-foreground mt-1">tokens available</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl hover-lift border-primary/10 animate-fade-in" style={{animationDelay: '100ms'}}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{homeworks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {homeworks.filter(h => h.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl hover-lift border-primary/10 animate-fade-in" style={{animationDelay: '200ms'}}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">enrolled across all tasks</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl hover-lift border-primary/10 animate-fade-in" style={{animationDelay: '300ms'}}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-medium">Unanswered Questions</CardTitle>
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{unansweredQuestions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/teacher/questions" className="text-primary hover:underline">
                View all →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl hover-lift border-primary/10 animate-fade-in" style={{animationDelay: '400ms'}}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-medium">Unreviewed Work</CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{unreviewedSubmissions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/teacher/submissions" className="text-primary hover:underline">
                View all →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Your Rating & Votes */}
      <Card className="mb-8 glass-card rounded-2xl hover-lift border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-1 ring-primary/20">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            Your Reputation
          </CardTitle>
          <CardDescription>Based on student reviews and community votes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 glass-card rounded-xl border-primary/10">
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile.rating.toFixed(1)}/5</div>
              <div className="text-sm text-foreground mt-2">Average Rating</div>
              <div className="text-xs text-muted-foreground mt-1">
                {profile.total_reviews} {profile.total_reviews === 1 ? 'review' : 'reviews'}
              </div>
            </div>
            <div className="text-center p-6 glass-card rounded-xl border-primary/10">
              <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile.upvotes}</div>
              <div className="text-sm text-foreground mt-2">Upvotes</div>
              <div className="text-xs text-muted-foreground mt-1">from DAO voting</div>
            </div>
            <div className="text-center p-6 glass-card rounded-xl border-primary/10">
              <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile.downvotes}</div>
              <div className="text-sm text-foreground mt-2">Downvotes</div>
              <div className="text-xs text-muted-foreground mt-1">from DAO voting</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Tasks</h2>
        {homeworks.length === 0 ? (
          <Card className="glass-card rounded-2xl border-primary/10">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-primary mb-4" />
              <p className="text-muted-foreground mb-4">You haven't created any tasks yet</p>
              <Link href="/dashboard/teacher/create-homework">
                <Button disabled={profile.token_balance < 1} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                  Create Your First Task
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homeworks.map((homework) => (
              <Card key={homework.id} className="glass-card rounded-2xl hover-lift border-primary/10 hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{homework.title}</CardTitle>
                    <Badge variant={homework.is_active ? 'default' : 'secondary'} className={homework.is_active ? 'bg-primary' : ''}>
                      {homework.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {homework.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Students enrolled:</span>
                      <span className="font-semibold">
                        {homework.current_students} / {homework.max_students}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link href={`/dashboard/teacher/homework/${homework.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full border-primary/30 hover:bg-primary/5">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/dashboard/teacher/homework/${homework.id}/review`} className="flex-1">
                        <Button variant="default" size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                          Review Students
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
