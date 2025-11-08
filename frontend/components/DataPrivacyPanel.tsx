'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Eye, Shield, Info } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

interface DataPrivacyPanelProps {
  userId: string;
}

export function DataPrivacyPanel({ userId }: DataPrivacyPanelProps) {
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  async function handleViewData() {
    setLoading(true);
    try {
      // Log the access
      await supabase.from('user_data_access_log').insert([
        { user_id: userId, action: 'view', data_type: 'all' }
      ]);

      // Fetch all user data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: submissions } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('student_id', userId);

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('teacher_id', userId);

      // Display data in a modal or new page
      console.log('User Data:', { profile, submissions, tasks });
      alert('Your data has been loaded. Check the console for details. In production, this would show a detailed view.');
    } catch (error) {
      console.error('Error viewing data:', error);
      alert('Error loading your data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportData() {
    setLoading(true);
    try {
      // Log the access
      await supabase.from('user_data_access_log').insert([
        { user_id: userId, action: 'export', data_type: 'all' }
      ]);

      // Fetch all user data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: submissions } = await supabase
        .from('task_submissions')
        .select('*, task:tasks(*)')
        .eq('student_id', userId);

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('teacher_id', userId);

      const { data: ratings } = await supabase
        .from('task_ratings')
        .select('*')
        .eq('student_id', userId);

      const { data: transactions } = await supabase
        .from('staking_transactions')
        .select('*')
        .eq('user_id', userId);

      const exportData = {
        profile,
        submissions,
        tasks,
        ratings,
        transactions,
        exported_at: new Date().toISOString(),
      };

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting your data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteData() {
    const confirmed = confirm(
      'Are you sure you want to delete all your data? This action cannot be undone. Your account will be permanently deleted.'
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      'This is your final warning. All your tasks, submissions, and profile will be permanently deleted. Type "DELETE" in the next prompt to confirm.'
    );

    if (!doubleConfirm) return;

    const finalConfirm = prompt('Type DELETE to confirm:');
    if (finalConfirm !== 'DELETE') {
      alert('Deletion cancelled.');
      return;
    }

    setLoading(true);
    try {
      // Log the deletion
      await supabase.from('user_data_access_log').insert([
        { user_id: userId, action: 'delete', data_type: 'all' }
      ]);

      // Delete user data (RLS policies will handle cascade)
      await supabase.from('profiles').delete().eq('id', userId);

      alert('Your data has been deleted. You will be logged out.');
      // In production, handle logout and redirect
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Error deleting your data. Please contact support.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <CardTitle>Data Privacy & Transparency</CardTitle>
          </div>
          <CardDescription>
            You have full control over your personal data. View, export, or delete your information at any time.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleViewData}
              disabled={loading}
            >
              <Eye className="w-4 h-4" />
              View My Data
            </Button>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleExportData}
              disabled={loading}
            >
              <Download className="w-4 h-4" />
              Export My Data
            </Button>

            <Button
              variant="destructive"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleDeleteData}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4" />
              Delete My Data
            </Button>
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Info className="w-4 h-4" />
              {showExplanation ? 'Hide' : 'Show'} what data we collect
            </button>

            {showExplanation && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-3">
                <div>
                  <h4 className="font-semibold mb-1">Personal Information</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Wallet address, username, profile picture, and bio
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Activity Data</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Tasks created, tasks attempted, submissions, ratings, and reputation score
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Transaction Data</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Staking transactions, rewards earned, and blockchain transaction hashes
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Communication Data</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Chat messages and interactions with teachers/students
                  </p>
                </div>
                <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-zinc-500">
                    <strong>Why we collect this data:</strong> To provide personalized task recommendations,
                    calculate your reputation score, facilitate learning, and enable secure staking transactions.
                    We never sell your data to third parties.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Algorithmic Transparency</CardTitle>
          <CardDescription>
            Understand how our algorithms make decisions about recommendations and evaluations
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Badge>Recommendations</Badge>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">How tasks are recommended to you:</h4>
                  <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                    <li>• Your skill level (based on completed tasks)</li>
                    <li>• Task difficulty and success rate</li>
                    <li>• Teacher reputation and quality</li>
                    <li>• Reward to stake ratio</li>
                    <li>• Your past performance in similar categories</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Badge variant="secondary">Reputation</Badge>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">How reputation is calculated:</h4>
                  <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                    <li>• <strong>Participation:</strong> Creating or completing tasks (+1 point each)</li>
                    <li>• <strong>Quality:</strong> High ratings from students/teachers (+5 points)</li>
                    <li>• <strong>Success rate:</strong> Bonus for tasks with {'>'}70% completion (+10 points)</li>
                    <li>• <strong>Consistency:</strong> Regular activity over time (+2 points/week)</li>
                  </ul>
                  <p className="text-xs mt-2 text-zinc-500">
                    Note: Reputation cannot be bought. It's earned through genuine participation and quality work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
