'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createHomework, createTokenTransaction, createTaskResource } from '@/lib/supabase/queries';
import { BookOpen, Loader2, Coins, AlertCircle, Upload, FileText, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function CreateHomeworkPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    max_students: 10,
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    async function loadProfile() {
      if (!address) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', address.toLowerCase())
          .single();

        if (!data || data.role !== 'teacher') {
          router.push('/dashboard');
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }

    loadProfile();
  }, [address, isConnected, router]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
    // Reset the input
    e.target.value = '';
  }

  function removeFile(index: number) {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || profile.token_balance < 1) {
      alert('You need at least 1 token to create a task!');
      return;
    }

    setLoading(true);
    try {
      // Create homework
      const homework = await createHomework({
        teacher_id: profile.id,
        title: formData.title,
        description: formData.description,
        max_students: formData.max_students,
      });

      // Upload resource files if any
      const uploadResults = { success: 0, failed: 0, failedFiles: [] as string[] };

      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}/${homework.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase
              .storage
              .from('task-resources')
              .upload(fileName, file);

            if (uploadError) {
              console.error('Error uploading file:', uploadError);
              uploadResults.failed++;
              uploadResults.failedFiles.push(file.name);
              continue; // Skip this file and continue with others
            }

            // Get public URL
            const { data: { publicUrl } } = supabase
              .storage
              .from('task-resources')
              .getPublicUrl(fileName);

            // Create task resource record
            await createTaskResource({
              homework_id: homework.id,
              teacher_id: profile.id,
              file_url: publicUrl,
              file_name: file.name,
              file_type: file.type,
            });

            uploadResults.success++;
          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError);
            uploadResults.failed++;
            uploadResults.failedFiles.push(file.name);
          }
        }
      }

      // Deduct 1 token
      await createTokenTransaction({
        user_id: profile.id,
        amount: -1,
        type: 'spent',
        description: `Created homework: ${formData.title}`,
      });

      // Provide detailed feedback about upload results
      if (uploadedFiles.length > 0) {
        if (uploadResults.failed === 0) {
          alert(`Task created successfully! ✅\nAll ${uploadResults.success} files uploaded.`);
        } else if (uploadResults.success > 0) {
          alert(`Task created with warnings! ⚠️\n${uploadResults.success} files uploaded successfully.\n${uploadResults.failed} files failed:\n${uploadResults.failedFiles.join('\n')}`);
        } else {
          alert(`Task created but file upload failed! ❌\nFailed files:\n${uploadResults.failedFiles.join('\n')}\nPlease try uploading the files again from the task page.`);
        }
      } else {
        alert('Task created successfully! ✅');
      }

      router.push('/dashboard/teacher');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-3xl">Create New Task</CardTitle>
            </div>
            <CardDescription>
              Publish a task for students to enroll and ask questions
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Token Balance Display */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Your Token Balance:</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{profile.token_balance}</span>
              </div>
              <p className="text-sm text-blue-900 dark:text-blue-100 mt-2">
                Creating a task costs <strong>1 token</strong>
              </p>
            </div>

            {/* Insufficient Tokens Warning */}
            {profile.token_balance < 1 && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-900 dark:text-red-100">
                    <strong>Insufficient tokens!</strong> You need at least 1 token to create a task.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Mathematics - Algebra Basics"
                  className="mt-2"
                  disabled={profile.token_balance < 1}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the task, what students will learn, requirements, etc."
                  rows={6}
                  className="mt-2"
                  disabled={profile.token_balance < 1}
                />
              </div>

              <div>
                <Label htmlFor="max_students">Maximum Students *</Label>
                <Input
                  id="max_students"
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                  className="mt-2"
                  disabled={profile.token_balance < 1}
                />
                <p className="text-sm text-zinc-500 mt-2">
                  Maximum number of students who can enroll in this task
                </p>
              </div>

              {/* File Upload Section */}
              <div>
                <Label htmlFor="files">Task Resources (Optional)</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      id="files"
                      type="file"
                      onChange={handleFileSelect}
                      className="flex-1"
                      disabled={profile.token_balance < 1}
                      accept="*/*"
                      multiple
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('files')?.click()}
                      disabled={profile.token_balance < 1}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Add Files
                    </Button>
                  </div>
                  <p className="text-sm text-zinc-500">
                    Upload resource files (PDFs, images, documents) that students can download
                  </p>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="border rounded-lg p-3 space-y-2">
                      <p className="text-sm font-semibold mb-2">Files to upload ({uploadedFiles.length}):</p>
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-zinc-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || profile.token_balance < 1}
                  className="flex-1"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4 mr-2" />
                      Create Task (1 token)
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
