'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function HomeworkRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const homeworkId = params.id as string;

  useEffect(() => {
    router.replace(`/dashboard/student/homework/${homeworkId}/questions`);
  }, [homeworkId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  );
}
