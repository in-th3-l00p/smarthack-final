'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getHomework, getEnrollments, updateHomework, deleteHomework, getTaskResources, createTaskResource, deleteTaskResource } from '@/lib/supabase/queries';
import type { HomeworkWithTeacher, EnrollmentWithDetails, TaskResource } from '@/lib/types/database';
import { BookOpen, Users, ArrowLeft, Settings as SettingsIcon, Upload, FileText, Download, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function HomeworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [homework, setHomework] = useState<HomeworkWithTeacher | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [taskResources, setTaskResources] = useState<TaskResource[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    async function loadData() {
      if (!address || !params.id) return;

      try {
        // Verify teacher ownership
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

        // Load homework
        const homeworkData = await getHomework(params.id as string);

        // Verify ownership
        if (homeworkData.teacher_id !== profileData.id) {
          alert('You do not have access to this task');
          router.push('/dashboard/teacher');
          return;
        }

        setHomework(homeworkData);

        // Load enrollments
        const enrollmentsData = await getEnrollments({ homeworkId: params.id as string });
        setEnrollments(enrollmentsData);

        // Load task resources
        const resourcesData = await getTaskResources({ homeworkId: params.id as string });
        setTaskResources(resourcesData);
      } catch (error: any) {
        console.error('Error loading task:', error);
        alert('Error loading task details');
        router.push('/dashboard/teacher');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [address, isConnected, params.id, router]);

  async function toggleActive() {
    if (!homework) return;

    setToggling(true);
    try {
      await updateHomework(homework.id, { is_active: !homework.is_active });
      setHomework({ ...homework, is_active: !homework.is_active });
    } catch (error) {
      console.error('Error toggling task status:', error);
      alert('Error updating task status');
    } finally {
      setToggling(false);
    }
  }

  async function handleDeleteTask() {
    if (!homework) return;

    if (!confirm('Are you sure you want to delete this task? This action cannot be undone. All enrollments, submissions, and resources will be deleted.')) {
      return;
    }

    setDeleting(true);
    try {
      // Delete all task resources from storage first
      for (const resource of taskResources) {
        const urlParts = resource.file_url.split('/task-resources/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('task-resources').remove([filePath]);
        }
      }

      // Delete the homework (cascade will delete enrollments, submissions, etc.)
      await deleteHomework(homework.id);

      alert('Task deleted successfully!');
      router.push('/dashboard/teacher');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleFileUpload() {
    if (!uploadedFile || !homework || !profile) return;

    setUploading(true);
    try {
      console.log('📤 Starting file upload...');
      console.log('File:', uploadedFile.name, 'Type:', uploadedFile.type, 'Size:', uploadedFile.size);
      console.log('Homework ID:', homework.id);
      console.log('Teacher ID:', profile.id);

      // Upload file to Supabase Storage
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${profile.id}/${homework.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      console.log('🗂️ Uploading to path:', fileName);

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('task-resources')
        .upload(fileName, uploadedFile);

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        let errorMessage = 'Failed to upload file to storage.';

        if (uploadError.message.includes('row-level security')) {
          errorMessage = 'Storage access denied. Please check your permissions.';
        } else if (uploadError.message.includes('size')) {
          errorMessage = 'File is too large. Maximum file size is 50MB.';
        } else if (uploadError.message) {
          errorMessage = `Upload failed: ${uploadError.message}`;
        }

        alert(`❌ ${errorMessage}\n\nFile: ${uploadedFile.name}`);
        return;
      }

      console.log('✅ Storage upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('task-resources')
        .getPublicUrl(fileName);

      console.log('🔗 Public URL:', publicUrl);

      // Create task resource record
      try {
        console.log('💾 Creating database record...');
        const dbRecord = {
          homework_id: homework.id,
          teacher_id: profile.id,
          file_url: publicUrl,
          file_name: uploadedFile.name,
          file_type: uploadedFile.type,
        };
        console.log('Record data:', dbRecord);

        const createdResource = await createTaskResource(dbRecord);
        console.log('✅ Database record created:', createdResource);
      } catch (dbError: any) {
        console.error('❌ Database error:', dbError);
        console.error('Error details:', {
          message: dbError?.message,
          code: dbError?.code,
          details: dbError?.details,
          hint: dbError?.hint,
        });
        // If DB insert fails, try to clean up the uploaded file
        await supabase.storage.from('task-resources').remove([fileName]);
        alert(`❌ Failed to save file metadata to database.\n\nFile: ${uploadedFile.name}\nError: ${dbError.message || 'Unknown error'}`);
        return;
      }

      // Reload task resources
      console.log('🔄 Reloading task resources...');
      const resourcesData = await getTaskResources({ homeworkId: homework.id });
      console.log('📦 Resources reloaded:', resourcesData);
      setTaskResources(resourcesData);

      setUploadedFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      alert(`✅ Resource file uploaded successfully!\n\n${uploadedFile.name}`);
    } catch (error: any) {
      console.error('❌ Unexpected error uploading file:', error);
      alert(`❌ Unexpected error uploading file.\n\nFile: ${uploadedFile.name}\nPlease try again or contact support if the problem persists.`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteResource(resourceId: string, fileUrl: string) {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/task-resources/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];

        // Delete from storage
        await supabase
          .storage
          .from('task-resources')
          .remove([filePath]);
      }

      // Delete from database
      await deleteTaskResource(resourceId);

      // Reload task resources
      const resourcesData = await getTaskResources({ homeworkId: homework!.id });
      setTaskResources(resourcesData);

      alert('Resource deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      alert('Error deleting resource. Please try again.');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!homework) {
    return null;
  }

  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const completedEnrollments = enrollments.filter(e => e.status === 'completed');
  const reviewedEnrollments = enrollments.filter(e => e.status === 'reviewed');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/teacher">
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
            </div>
            <Badge variant={homework.is_active ? 'default' : 'secondary'} className="text-lg px-4 py-2">
              {homework.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={toggleActive}
            disabled={toggling}
            variant="outline"
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            {toggling ? 'Updating...' : homework.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Link href={`/dashboard/teacher/homework/${homework.id}/review`}>
            <Button>
              Review Submissions ({completedEnrollments.length})
            </Button>
          </Link>
          <Button
            onClick={handleDeleteTask}
            disabled={deleting}
            variant="destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete Task'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{homework.current_students}</div>
              <p className="text-xs text-zinc-500">of {homework.max_students} max</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <BookOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEnrollments.length}</div>
              <p className="text-xs text-zinc-500">working on it</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <BookOpen className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedEnrollments.length}</div>
              <p className="text-xs text-zinc-500">awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviewedEnrollments.length}</div>
              <p className="text-xs text-zinc-500">finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Task Resources Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Task Resources
            </CardTitle>
            <CardDescription>
              Upload resource files (PDFs, images, documents) that students can download
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* File Upload */}
              <div className="flex gap-4">
                <Input
                  type="file"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="flex-1"
                  accept="*/*"
                />
                <Button
                  onClick={handleFileUpload}
                  disabled={!uploadedFile || uploading}
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

              {/* Uploaded Resources List */}
              {taskResources.length > 0 ? (
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm mb-3">Uploaded Resources:</h3>
                  {taskResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
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
                      <div className="flex items-center gap-2">
                        <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteResource(resource.id, resource.file_url)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-600 border rounded-lg">
                  No resources uploaded yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enrolled Students */}
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Students</CardTitle>
            <CardDescription>All students enrolled in this task</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="text-center py-8 text-zinc-600">
                No students enrolled yet
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <div>
                      <p className="font-medium">{enrollment.student?.username || 'Unknown Student'}</p>
                      <p className="text-sm text-zinc-600">
                        Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          enrollment.status === 'reviewed'
                            ? 'default'
                            : enrollment.status === 'completed'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {enrollment.status}
                      </Badge>
                      {enrollment.status === 'completed' && (
                        <Link href={`/dashboard/teacher/homework/${homework.id}/review`}>
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
