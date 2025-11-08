'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  getHomework,
  getEnrollments,
  createSubmission,
  getSubmissions,
  getTaskResources,
} from '@/lib/supabase/queries';
import type { Homework, EnrollmentWithDetails, Submission, TaskResource } from '@/lib/types/database';
import { Upload, FileText, CheckCircle, MessageCircle, Loader2, ArrowLeft, Download, AlertTriangle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function StudentHomeworkPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const params = useParams();
  const homeworkId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [uploading, setUploading] = useState(false);
  const [taskResources, setTaskResources] = useState<TaskResource[]>([]);

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

        // Load enrollment
        const enrollmentsData = await getEnrollments({
          homeworkId,
          studentId: profileData.id,
        });

        if (enrollmentsData.length === 0) {
          alert('You are not enrolled in this task');
          router.push('/dashboard/student');
          return;
        }

        setEnrollment(enrollmentsData[0]);

        // Load existing submission if exists
        const { data: submissionData } = await supabase
          .from('enrollments')
          .select('submission_text')
          .eq('id', enrollmentsData[0].id)
          .single();

        if (submissionData?.submission_text) {
          setSubmissionText(submissionData.submission_text);
        }

        // Load file submissions
        const submissionsData = await getSubmissions({
          enrollmentId: enrollmentsData[0].id,
        });
        setSubmissions(submissionsData);

        // Load task resources from teacher
        const resourcesData = await getTaskResources({
          homeworkId,
        });
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

  async function handleSubmitSolution() {
    if (!enrollment || !submissionText.trim()) return;

    setSubmitting(true);
    try {
      // Update enrollment with submission
      const { error } = await supabase
        .from('enrollments')
        .update({
          submission_text: submissionText,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', enrollment.id);

      if (error) throw error;

      // Reload enrollment
      const enrollmentsData = await getEnrollments({
        homeworkId,
        studentId: profile.id,
      });

      setEnrollment(enrollmentsData[0]);
      alert('Solution submitted successfully! ✅ Your teacher will review it soon.');
    } catch (error: any) {
      console.error('Error submitting solution:', error);
      alert('Error submitting solution. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileUpload() {
    if (!uploadedFile || !enrollment || !profile) return;

    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${profile.id}/${enrollment.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('submissions')
        .upload(fileName, uploadedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('submissions')
        .getPublicUrl(fileName);

      // Create submission record
      await createSubmission({
        enrollment_id: enrollment.id,
        student_id: profile.id,
        homework_id: homeworkId,
        file_url: publicUrl,
        file_name: uploadedFile.name,
        file_type: uploadedFile.type,
      });

      // Reload submissions
      const submissionsData = await getSubmissions({
        enrollmentId: enrollment.id,
      });
      setSubmissions(submissionsData);

      setUploadedFile(null);
      alert('File uploaded successfully! ✅');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile || !homework || !enrollment) {
    return null;
  }

  const canSubmit = enrollment.status === 'active';
  const isCompleted = enrollment.status === 'completed';
  const isReviewed = enrollment.status === 'reviewed';

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
            </div>
            <Badge
              variant={
                isReviewed ? 'default' : isCompleted ? 'secondary' : 'outline'
              }
              className="text-lg px-4 py-2"
            >
              {isReviewed ? 'Reviewed' : isCompleted ? 'Submitted' : 'Active'}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Link href={`/dashboard/student/homework/${homeworkId}/questions`} className="flex-1">
            <Button variant="outline" className="w-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              Ask Questions
            </Button>
          </Link>
        </div>

        {/* Review Score (if reviewed) */}
        {isReviewed && enrollment.review_score !== null && (
          <Card className="mb-8 border-green-500 bg-green-50 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">
                Your Score: {enrollment.review_score} / 5 ⭐
              </CardTitle>
              {enrollment.review_comment && (
                <CardDescription className="text-green-800 dark:text-green-200">
                  Teacher's feedback: {enrollment.review_comment}
                </CardDescription>
              )}
            </CardHeader>
          </Card>
        )}

        {/* Task Resources from Teacher */}
        {taskResources.length > 0 && (
          <Card className="mb-8 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Task Resources
              </CardTitle>
              <CardDescription>
                Materials provided by your teacher for this task
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

        {/* File Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Files
            </CardTitle>
            <CardDescription>
              Upload your work in any format (PDF, DOCX, ZIP, images, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  type="file"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="flex-1"
                  disabled={!canSubmit}
                  accept="*/*"
                />
                <Button
                  onClick={handleFileUpload}
                  disabled={!uploadedFile || uploading || !canSubmit}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>

              {/* Uploaded Files List */}
              {submissions.length > 0 && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm mb-3">Uploaded Files:</h3>
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{submission.file_name}</p>
                          <p className="text-xs text-zinc-500">
                            Uploaded on {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={submission.status === 'reviewed' ? 'default' : 'secondary'}>
                          {submission.status}
                        </Badge>
                        <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Solution (Text) */}
        <Card className={canSubmit ? 'border-blue-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {canSubmit ? 'Submit Your Solution (Text)' : 'Your Text Submission'}
            </CardTitle>
            <CardDescription>
              {canSubmit
                ? 'Or write your solution below and submit when ready'
                : isCompleted
                ? 'Your solution has been submitted and is awaiting review'
                : 'Your solution has been reviewed by your teacher'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Write your solution here..."
                rows={12}
                className="w-full font-mono"
                disabled={!canSubmit}
              />
              {canSubmit && (
                <Button
                  onClick={handleSubmitSolution}
                  disabled={!submissionText.trim() || submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Text Solution
                    </>
                  )}
                </Button>
              )}
              {isCompleted && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <p className="font-semibold">Submitted on {new Date(enrollment.completed_at || '').toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
