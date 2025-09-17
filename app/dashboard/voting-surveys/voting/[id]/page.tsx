"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { apiUrl } from '../../../../config/api';

type VotingItem = {
  id: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  voteType?: 'electoral' | 'opinion';
  status?: 'active' | 'upcoming' | 'closed';
  published?: boolean;
  options?: Array<{ text: string; votes?: number }>;
};

export default function VotingDetailsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const votingId = (params?.id as string) || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingItem, setVotingItem] = useState<VotingItem | null>(null);

  const fetchVotingItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${apiUrl}/content/voting`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to load voting items');
      const data: VotingItem[] = await response.json();
      const found = data.find((v) => v.id === votingId) || null;
      if (!found) setError('العنصر غير موجود');
      setVotingItem(found);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [token, votingId]);

  useEffect(() => {
    if (token && votingId) fetchVotingItems();
  }, [token, votingId, fetchVotingItems]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary-600)] border-t-transparent"></div>
          <p className="text-[var(--neutral-600)]">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !votingItem) {
    return (
      <div className="p-6">
        <div className="mb-4 text-red-600">{error || 'العنصر غير موجود'}</div>
        <button
          onClick={() => router.push('/dashboard/voting-surveys')}
          className="rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
        >
          الرجوع للقائمة
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">{votingItem.title}</h1>
          <p className="text-sm text-[var(--neutral-500)]">
            {votingItem.voteType === 'electoral' ? 'تصويت انتخابي' : 'تصويت رأي'}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/voting-surveys')}
          className="rounded-md border border-[var(--neutral-300)] px-4 py-2 text-[var(--neutral-700)] hover:bg-[var(--neutral-50)]"
        >
          رجوع
        </button>
      </div>

      {votingItem.description && (
        <div className="mb-6 rounded-lg border border-[var(--neutral-200)] bg-white p-4 text-[var(--neutral-700)]">
          {votingItem.description}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[var(--neutral-200)] bg-white p-4">
          <div className="text-xs text-[var(--neutral-500)]">تاريخ البدء</div>
          <div className="text-[var(--neutral-900)]">{votingItem.startDate || '-'}</div>
        </div>
        <div className="rounded-lg border border-[var(--neutral-200)] bg-white p-4">
          <div className="text-xs text-[var(--neutral-500)]">تاريخ الانتهاء</div>
          <div className="text-[var(--neutral-900)]">{votingItem.endDate || '-'}</div>
        </div>
        <div className="rounded-lg border border-[var(--neutral-200)] bg-white p-4">
          <div className="text-xs text-[var(--neutral-500)]">الحالة</div>
          <div className="text-[var(--neutral-900)]">
            {votingItem.status === 'active' ? 'نشط' : votingItem.status === 'upcoming' ? 'قادم' : 'منتهي'}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--neutral-200)] bg-white p-4">
        <h3 className="mb-4 text-lg font-semibold text-[var(--neutral-900)]">الخيارات</h3>
        {votingItem.options && votingItem.options.length > 0 ? (
          <div className="space-y-2">
            {votingItem.options.map((opt, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-md border border-[var(--neutral-200)] p-3">
                <div className="text-[var(--neutral-800)]">{opt.text}</div>
                {typeof opt.votes === 'number' && (
                  <div className="text-sm text-[var(--neutral-600)]">أصوات: {opt.votes}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[var(--neutral-600)]">لا توجد خيارات</div>
        )}
      </div>
    </div>
  );
}


