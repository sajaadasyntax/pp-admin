"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TestBulletinPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to bulletin page
    router.push('/dashboard/bulletin');
  }, [router]);

  return (
    <div className="p-4">
      <h1 className="text-lg font-medium">جاري التحويل...</h1>
      <p>يتم الآن تحويلك إلى صفحة النشرات.</p>
    </div>
  );
}