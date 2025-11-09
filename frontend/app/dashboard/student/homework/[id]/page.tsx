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
  getReviews,
  getBadges,
  deleteSubmission,
  updateEnrollmentStatus,
  createReview,
  getVotes,
  createVote,
  updateVote,
} from '@/lib/supabase/queries';
import type { Homework, EnrollmentWithDetails, Submission, TaskResource } from '@/lib/types/database';
import { Upload, FileText, CheckCircle, MessageCircle, Loader2, ArrowLeft, Download, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { MintBadgeModal } from '@/components/MintBadgeModal';

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

  // Badge modal state
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [canMintBadge, setCanMintBadge] = useState(false);

  // Teacher review state
  const [teacherReviewStars, setTeacherReviewStars] = useState(0);
  const [teacherReviewComment, setTeacherReviewComment] = useState('');
  const [hasReviewedTeacher, setHasReviewedTeacher] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // DAO Voting state
  const [teacherVote, setTeacherVote] = useState<'upvote' | 'downvote' | null>(null);
  const [votingLoading, setVotingLoading] = useState(false);

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
        console.log('🔍 Loading resources for homework:', homeworkId);
        const resourcesData = await getTaskResources({
          homeworkId,
        });
        console.log('📦 Resources loaded:', resourcesData);
        setTaskResources(resourcesData);

        // Check if student can mint a badge (5-star review + no badge yet)
        console.log('🎖️ Checking badge eligibility...');
        console.log('Enrollment status:', enrollmentsData[0]?.status);

        if (enrollmentsData.length > 0 && enrollmentsData[0].status === 'reviewed') {
          console.log('✅ Enrollment is reviewed, checking for 5-star review...');

          // Check if student has 5-star review
          const reviews = await getReviews({
            homeworkId,
            studentId: profileData.id
          });
          console.log('📝 Reviews found:', reviews.length, reviews);

          const fiveStarReview = reviews.find(r => r.stars === 5);
          console.log('⭐ 5-star review:', fiveStarReview);

          if (fiveStarReview) {
            console.log('✅ Has 5-star review! Checking for existing badges...');

            // Check if badge already minted
            const existingBadges = await getBadges({
              studentId: profileData.id,
              homeworkId,
            });
            console.log('🏅 Existing badges:', existingBadges.length, existingBadges);

            if (existingBadges.length === 0) {
              // Can mint badge!
              console.log('🎉 CAN MINT BADGE! Showing modal...');
              setCanMintBadge(true);
              setShowBadgeModal(true);
            } else {
              console.log('⚠️ Badge already minted');
            }
          } else {
            console.log('⚠️ No 5-star review found');
          }
        } else {
          console.log('⚠️ Enrollment not reviewed yet or no enrollments');
        }

        // Check if student has already reviewed the teacher
        if (homeworkData?.teacher_id && profileData?.id) {
          const teacherReviews = await getReviews({
            homeworkId,
          });
          const existingTeacherReview = teacherReviews.find(
            r => r.reviewer_id === profileData.id && r.teacher_id === homeworkData.teacher_id
          );
          if (existingTeacherReview) {
            setHasReviewedTeacher(true);
          }
        }

        // Check if student has already voted for the teacher (DAO voting)
        if (homeworkData?.teacher_id && profileData?.id) {
          const votes = await getVotes({
            voterId: profileData.id,
            votedForId: homeworkData.teacher_id,
          });
          if (votes.length > 0) {
            setTeacherVote(votes[0].vote_type);
          }
        }
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
      const fileName = `${profile.id}/${enrollment.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('submissions')
        .upload(fileName, uploadedFile);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        let errorMessage = 'Failed to upload file to storage.';

        if (uploadError.message.includes('row-level security')) {
          errorMessage = 'Storage access denied. Please check your permissions.';
        } else if (uploadError.message.includes('size')) {
          errorMessage = 'File is too large. Maximum file size is 50MB.';
        } else if (uploadError.message) {
          errorMessage = `Upload failed: ${uploadError.message}`;
        }

        alert(`❌ ${errorMessage}\n\nFile: ${uploadedFile.name}\n\nPlease try again or contact your teacher if the problem persists.`);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('submissions')
        .getPublicUrl(fileName);

      // Create submission record
      try {
        await createSubmission({
          enrollment_id: enrollment.id,
          student_id: profile.id,
          homework_id: homeworkId,
          file_url: publicUrl,
          file_name: uploadedFile.name,
          file_type: uploadedFile.type,
        });
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        // If DB insert fails, try to clean up the uploaded file
        await supabase.storage.from('submissions').remove([fileName]);
        alert(`❌ Failed to save submission to database.\n\nFile: ${uploadedFile.name}\nError: ${dbError.message || 'Unknown error'}\n\nPlease try again or contact your teacher.`);
        return;
      }

      // Mark enrollment as completed (so teacher can see it)
      if (enrollment.status === 'active') {
        console.log('📝 Updating enrollment status to completed...', enrollment.id);
        const { data: updatedEnrollment, error: updateError } = await supabase
          .from('enrollments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', enrollment.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Failed to update enrollment status:', updateError);
        } else {
          console.log('✅ Enrollment updated successfully:', updatedEnrollment);
          // Update local enrollment state with the actual data from DB
          setEnrollment(updatedEnrollment);
        }
      }

      // Reload submissions
      const submissionsData = await getSubmissions({
        enrollmentId: enrollment.id,
      });
      setSubmissions(submissionsData);

      setUploadedFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      alert(`✅ File uploaded successfully!\n\n${uploadedFile.name}\n\nYour submission is now complete. You can withdraw it before the teacher reviews it using the "Withdraw Submission" button above.`);
    } catch (error: any) {
      console.error('Unexpected error uploading file:', error);
      alert(`❌ Unexpected error uploading file.\n\nFile: ${uploadedFile.name}\nPlease try again or contact your teacher if the problem persists.`);
    } finally {
      setUploading(false);
    }
  }

  async function handleUnsubmit() {
    if (!enrollment || !submissions.length) return;

    const confirmed = confirm(
      'Are you sure you want to withdraw your submission? This will delete all your uploaded files and you can submit again.'
    );

    if (!confirmed) return;

    setUploading(true);
    try {
      // Delete all submissions
      for (const submission of submissions) {
        // Delete from storage
        const fileName = submission.file_url.split('/').pop();
        if (fileName) {
          const storagePath = `${profile?.id}/${enrollment.id}/${fileName}`;
          await supabase.storage.from('submissions').remove([storagePath]);
        }

        // Delete submission record
        await deleteSubmission(submission.id);
      }

      // Update enrollment status back to active
      await updateEnrollmentStatus(enrollment.id, 'active');

      // Refresh data
      const enrollmentsData = await getEnrollments({
        studentId: profile?.id,
        homeworkId: homeworkId,
      });
      if (enrollmentsData.length > 0) {
        setEnrollment(enrollmentsData[0]);
      }

      setSubmissions([]);
      alert('✅ Submission withdrawn successfully! You can now submit again.');
    } catch (error) {
      console.error('Error withdrawing submission:', error);
      alert('❌ Error withdrawing submission. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmitTeacherReview() {
    if (!profile || !homework || teacherReviewStars === 0) return;

    setSubmittingReview(true);
    try {
      await createReview({
        reviewer_id: profile.id,
        teacher_id: homework.teacher_id,
        homework_id: homeworkId,
        stars: teacherReviewStars,
        comment: teacherReviewComment.trim() || undefined,
      });

      setHasReviewedTeacher(true);
      alert(`✅ Review submitted! You gave ${teacherReviewStars} star${teacherReviewStars !== 1 ? 's' : ''} to your teacher.`);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('❌ Error submitting review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleVoteTeacher(voteType: 'upvote' | 'downvote') {
    if (!profile || !homework?.teacher_id) return;

    setVotingLoading(true);
    try {
      if (teacherVote) {
        // Update existing vote
        await updateVote(profile.id, homework.teacher_id, voteType);
      } else {
        // Create new vote
        await createVote({
          voter_id: profile.id,
          voted_for_id: homework.teacher_id,
          vote_type: voteType,
          voter_role: 'student',
        });
      }

      // Update profile vote counts in profiles table
      const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('upvotes, downvotes')
        .eq('id', homework.teacher_id)
        .single();

      if (teacherProfile) {
        const updates: any = {};

        if (teacherVote === 'upvote' && voteType === 'downvote') {
          // Changed from upvote to downvote
          updates.upvotes = Math.max(0, teacherProfile.upvotes - 1);
          updates.downvotes = teacherProfile.downvotes + 1;
        } else if (teacherVote === 'downvote' && voteType === 'upvote') {
          // Changed from downvote to upvote
          updates.downvotes = Math.max(0, teacherProfile.downvotes - 1);
          updates.upvotes = teacherProfile.upvotes + 1;
        } else if (!teacherVote && voteType === 'upvote') {
          // New upvote
          updates.upvotes = teacherProfile.upvotes + 1;
        } else if (!teacherVote && voteType === 'downvote') {
          // New downvote
          updates.downvotes = teacherProfile.downvotes + 1;
        }

        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', homework.teacher_id);
      }

      setTeacherVote(voteType);
      alert(`✅ Vote submitted! You ${voteType === 'upvote' ? '👍 liked' : '👎 disliked'} this teacher.`);
    } catch (error) {
      console.error('Error voting:', error);
      alert('❌ Error submitting vote. Please try again.');
    } finally {
      setVotingLoading(false);
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

  // Debug logging
  console.log('🔍 Enrollment status:', enrollment.status);
  console.log('🔍 isCompleted:', isCompleted);
  console.log('🔍 isReviewed:', isReviewed);
  console.log('🔍 submissions.length:', submissions.length);

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

          {isCompleted && !isReviewed && submissions.length > 0 && (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleUnsubmit}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Withdraw Submission
                </>
              )}
            </Button>
          )}
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Uploaded Files:</h3>
                    {isCompleted && !isReviewed && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleUnsubmit}
                        disabled={uploading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Withdraw Submission
                      </Button>
                    )}
                  </div>
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
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-semibold">
                      Submitted on {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {isReviewed && enrollment.review_score && (
                    <div className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Teacher's Rating:</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-2xl ${
                              i < enrollment.review_score! ? 'text-yellow-500' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="text-lg font-bold text-blue-600">{enrollment.review_score} / 5 stars</p>
                      {enrollment.review_comment && (
                        <div className="mt-2 w-full">
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Comment:</p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">"{enrollment.review_comment}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teacher's Review/Feedback - Show if task has been reviewed */}
        {isReviewed && enrollment.review_score !== null && (
          <Card className="border-primary mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Teacher's Review
              </CardTitle>
              <CardDescription>
                Feedback from your teacher on this assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Stars Display */}
                <div>
                  <p className="text-sm font-semibold mb-3">Rating:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 ${
                            star <= enrollment.review_score!
                              ? 'fill-primary text-primary'
                              : 'fill-muted text-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent ml-2">
                      {enrollment.review_score}/5
                    </span>
                  </div>
                </div>

                {/* Teacher's Comment */}
                {enrollment.review_comment && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Teacher's Comment:</p>
                    <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-primary/20">
                      <p className="text-base text-foreground whitespace-pre-wrap italic">
                        "{enrollment.review_comment}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Tokens Earned Info */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    <strong>Tokens Earned:</strong> {
                      enrollment.review_score === 5 ? '50 tokens' :
                      enrollment.review_score === 4 ? '30 tokens' :
                      enrollment.review_score === 3 ? '10 tokens' : '0 tokens'
                    } for this assignment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rate Your Teacher */}
        {isReviewed && !hasReviewedTeacher && homework?.teacher && (
          <Card className="border-purple-500 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                Rate Your Teacher
              </CardTitle>
              <CardDescription>
                Share your experience with {homework.teacher.username}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">How many stars?</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setTeacherReviewStars(star)}
                        className={`text-4xl transition-colors ${
                          star <= teacherReviewStars ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {teacherReviewStars > 0 && (
                    <p className="text-sm text-purple-600 mt-2">{teacherReviewStars} star{teacherReviewStars !== 1 ? 's' : ''} selected</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Comment (optional)</p>
                  <Textarea
                    value={teacherReviewComment}
                    onChange={(e) => setTeacherReviewComment(e.target.value)}
                    placeholder="Share your thoughts about the teacher's guidance and feedback..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSubmitTeacherReview}
                  disabled={teacherReviewStars === 0 || submittingReview}
                  className="w-full"
                  size="lg"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {hasReviewedTeacher && (
          <Card className="border-green-500 mt-8">
            <CardContent className="py-6">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <p className="font-semibold">You have already reviewed your teacher. Thank you for your feedback!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* DAO Voting - Like/Dislike Teacher (shown after review is complete) */}
        {isReviewed && (
          <Card className="border-blue-500 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-blue-600" />
                DAO Voting - Rate This Teacher
              </CardTitle>
              <CardDescription>
                Help the community by voting on the teacher's quality. Your vote contributes to the teacher's DAO reputation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={() => handleVoteTeacher('upvote')}
                  disabled={votingLoading || teacherVote === 'upvote'}
                  variant={teacherVote === 'upvote' ? 'default' : 'outline'}
                  size="lg"
                  className={`flex items-center gap-2 ${teacherVote === 'upvote' ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-600 hover:bg-green-50'}`}
                >
                  {votingLoading && teacherVote !== 'upvote' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ThumbsUp className="w-5 h-5" />
                  )}
                  <span className="font-semibold">Like</span>
                  {teacherVote === 'upvote' && <CheckCircle className="w-4 h-4" />}
                </Button>

                <Button
                  onClick={() => handleVoteTeacher('downvote')}
                  disabled={votingLoading || teacherVote === 'downvote'}
                  variant={teacherVote === 'downvote' ? 'default' : 'outline'}
                  size="lg"
                  className={`flex items-center gap-2 ${teacherVote === 'downvote' ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-600 hover:bg-red-50'}`}
                >
                  {votingLoading && teacherVote !== 'downvote' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ThumbsDown className="w-5 h-5" />
                  )}
                  <span className="font-semibold">Dislike</span>
                  {teacherVote === 'downvote' && <CheckCircle className="w-4 h-4" />}
                </Button>
              </div>

              {teacherVote && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    You {teacherVote === 'upvote' ? '👍 liked' : '👎 disliked'} this teacher. You can change your vote anytime.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Badge Minting Modal */}
      {canMintBadge && homework && profile && (
        <MintBadgeModal
          open={showBadgeModal}
          onOpenChange={setShowBadgeModal}
          studentId={profile.id}
          studentName={profile.username || 'Student'}
          homeworkId={homeworkId}
          homeworkTitle={homework.title}
          teacherId={homework.teacher_id}
          teacherName={homework.teacher?.username || 'Teacher'}
          onMinted={() => {
            // After minting, hide modal and prevent showing again
            setCanMintBadge(false);
            setShowBadgeModal(false);
          }}
        />
      )}
    </div>
  );
}
