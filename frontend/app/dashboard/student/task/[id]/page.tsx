'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getHomework,
  getTaskResources,
  enrollInHomework,
} from '@/lib/supabase/queries';
import type { Homework, TaskResource } from '@/lib/types/database';
import { ArrowLeft, Download, FileText, Users, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function StudentTaskViewPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const params = useParams();
  const homeworkId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [taskResources, setTaskResources] = useState<TaskResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

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

        // Load homework
        const homeworkData = await getHomework(homeworkId);
        setHomework(homeworkData);

        // Check if already enrolled
        const { data: enrollmentData } = await supabase
          .from('enrollments')
          .select('*')
          .eq('homework_id', homeworkId)
          .eq('student_id', profileData.id)
          .single();

        setIsEnrolled(!!enrollmentData);

        // Load task resources
        const resourcesData = await getTaskResources({ homeworkId });
        setTaskResources(resourcesData);
      } catch (error: any) {
        console.error('Error loading data:', error);
        alert('Error loading task details');
        router.push('/dashboard/student');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [address, isConnected, router, homeworkId]);

  async function handleEnroll() {
    if (!profile || !homework) return;

    setEnrolling(true);
    try {
      await enrollInHomework(profile.id, homework.id);
      alert('Enrolled successfully! ✅');
      router.push(`/dashboard/student/homework/${homework.id}`);
    } catch (error: any) {
      console.error('Error enrolling:', error);
      if (error.message?.includes('duplicate')) {
        alert('You are already enrolled in this task!');
      } else {
        alert('Error enrolling. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile || !homework) {
    return null;
  }

  const deadline = new Date(homework.deadline);
  const slotsLeft = homework.max_students - homework.current_students;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/student">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{homework.title}</h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {homework.description || 'No description provided'}
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                Teacher: {homework.teacher?.username || 'Unknown'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                <p className="text-sm font-semibold text-blue-600">
                  Deadline: {deadline.toLocaleString()}
                </p>
              </div>
            </div>
            {isEnrolled && (
              <Badge variant="default" className="text-lg px-4 py-2 bg-green-600">
                Enrolled
              </Badge>
            )}
          </div>
        </div>

        {/* Task Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Task Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-zinc-500" />
                  <span className="text-sm">
                    <strong>{homework.current_students}</strong> / {homework.max_students} students enrolled
                  </span>
                </div>
                <Badge variant={slotsLeft > 3 ? 'secondary' : 'destructive'}>
                  {slotsLeft} {slotsLeft === 1 ? 'slot' : 'slots'} left
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-zinc-500" />
                <span className="text-sm">
                  <strong>Deadline:</strong> {deadline.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Resources from Teacher */}
        {taskResources.length > 0 && (
          <Card className="mb-8 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Task Resources
              </CardTitle>
              <CardDescription>
                Materials provided by the teacher for this task
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {taskResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">{resource.file_name}</p>
                        <p className="text-xs text-zinc-500">
                          Uploaded on {new Date(resource.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {taskResources.length === 0 && (
          <Card className="mb-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-zinc-400 mb-4" />
              <p className="text-zinc-600">No resources available for this task yet</p>
            </CardContent>
          </Card>
        )}

        {/* Enrollment Action */}
        {!isEnrolled && (
          <Card className="border-blue-500">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Ready to start learning?</h3>
                <p className="text-zinc-600">
                  Enroll in this task to access questions, submit your work, and get feedback from your teacher.
                </p>
                <Button
                  onClick={handleEnroll}
                  disabled={enrolling || slotsLeft === 0}
                  size="lg"
                  className="w-full max-w-md"
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enrolling...
                    </>
                  ) : slotsLeft === 0 ? (
                    'Task is Full'
                  ) : (
                    'Enroll Now'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isEnrolled && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
                  You're enrolled in this task!
                </h3>
                <p className="text-green-700 dark:text-green-200">
                  Go to your enrolled tasks to submit your work and ask questions.
                </p>
                <Link href={`/dashboard/student/homework/${homework.id}`}>
                  <Button size="lg" className="w-full max-w-md bg-green-600 hover:bg-green-700">
                    Go to Task Workspace
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
