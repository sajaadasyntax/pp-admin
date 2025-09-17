"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';

export default function VotingSurveysPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'voting' | 'surveys'>('voting');
  const [votingItems, setVotingItems] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);

  const fetchVotingItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Fetch voting items
      const response = await fetch(`${apiUrl}/content/voting`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch voting items');
      }
      
      const data = await response.json();
      setVotingItems(data);
    } catch (err) {
      console.error('Error fetching voting items:', err);
      setError('فشل في تحميل عناصر التصويت');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Fetch surveys
      const response = await fetch(`${apiUrl}/content/surveys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch surveys');
      }
      
      const data = await response.json();
      setSurveys(data);
    } catch (err) {
      console.error('Error fetching surveys:', err);
      setError('فشل في تحميل الاستبيانات');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      if (activeTab === 'voting') {
        fetchVotingItems();
      } else {
        fetchSurveys();
      }
    }
  }, [token, fetchVotingItems, fetchSurveys, activeTab]);

  const handleCreateVoting = () => {
    router.push('/dashboard/voting-surveys/create-voting');
  };

  const handleCreateSurvey = () => {
    router.push('/dashboard/voting-surveys/create-survey');
  };

  const handleViewVotingDetails = (votingId: string) => {
    router.push(`/dashboard/voting-surveys/voting/${votingId}`);
  };

  const handleViewSurveyDetails = (surveyId: string) => {
    router.push(`/dashboard/voting-surveys/survey/${surveyId}`);
  };

  const handleTabChange = (tab: 'voting' | 'surveys') => {
    setActiveTab(tab);
    setSuccess(null);
  };

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">
            {activeTab === 'voting' ? 'التصويت والاستطلاعات' : 'الاستبيانات'}
          </h1>
          <p className="text-sm text-[var(--neutral-500)]">
            {activeTab === 'voting' ? 'إدارة عناصر التصويت والاستطلاعات' : 'إدارة الاستبيانات العامة وأعضاء'}
          </p>
        </div>

        {/* Create New button */}
        <button
          onClick={activeTab === 'voting' ? handleCreateVoting : handleCreateSurvey}
          className="rounded-lg bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
        >
          إنشاء {activeTab === 'voting' ? 'تصويت' : 'استبيان'} جديد
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-[var(--neutral-200)]">
        <div className="flex space-x-6 rtl:space-x-reverse">
          <button
            onClick={() => handleTabChange('voting')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'voting'
                ? 'border-b-2 border-[var(--primary-500)] text-[var(--primary-600)]'
                : 'text-[var(--neutral-600)]'
            }`}
          >
            التصويت والاستطلاعات
          </button>
          <button
            onClick={() => handleTabChange('surveys')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'surveys'
                ? 'border-b-2 border-[var(--primary-500)] text-[var(--primary-600)]'
                : 'text-[var(--neutral-600)]'
            }`}
          >
            الاستبيانات
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Success display */}
      {success && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      {/* Voting Items */}
      {activeTab === 'voting' ? (
        votingItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {votingItems.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer overflow-hidden rounded-lg border border-[var(--neutral-200)] bg-white shadow-sm transition-all hover:shadow-md"
                onClick={() => handleViewVotingDetails(item.id)}
              >
                <div className="bg-[var(--primary-50)] p-4">
                  <h3 className="text-lg font-semibold text-[var(--neutral-900)]">{item.title}</h3>
                  <div className="mt-2 flex items-center">
                    <span className="text-sm text-[var(--primary-700)]">
                      {item.voteType === 'electoral' ? 'تصويت انتخابي' : 'تصويت رأي'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  {item.description && <p className="mb-4 text-[var(--neutral-600)]">{item.description}</p>}
                  
                  <div className="mt-4 flex justify-between">
                    <div className="text-xs text-[var(--neutral-500)]">
                      من: {item.startDate || ''}
                      <span className="mx-2">•</span>
                      إلى: {item.endDate || ''}
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                      item.published 
                        ? 'bg-[var(--success-100)] text-[var(--success-700)]' 
                        : 'bg-[var(--warning-100)] text-[var(--warning-700)]'
                    }`}>
                      {item.published ? 'منشور' : 'مسودة'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] py-12">
            <div className="text-4xl">🗳️</div>
            <h3 className="mt-2 text-lg font-medium text-[var(--neutral-900)]">
              لا توجد عناصر تصويت بعد
            </h3>
            <p className="mt-1 text-[var(--neutral-600)]">
              قم بإنشاء عنصر تصويت جديد للبدء
            </p>
            <button
              onClick={handleCreateVoting}
              className="mt-4 rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
            >
              إنشاء تصويت جديد
            </button>
          </div>
        )
      ) : (
        /* Surveys */
        surveys.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="group cursor-pointer overflow-hidden rounded-lg border border-[var(--neutral-200)] bg-white shadow-sm transition-all hover:shadow-md"
                onClick={() => handleViewSurveyDetails(survey.id)}
              >
                <div className="bg-[var(--primary-50)] p-4">
                  <h3 className="text-lg font-semibold text-[var(--neutral-900)]">{survey.title}</h3>
                  <div className="mt-2 flex items-center">
                    <span className="text-sm text-[var(--primary-700)]">
                      {survey.type === 'public' ? 'استبيان عام' : 'استبيان أعضاء'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  {survey.description && <p className="mb-4 text-[var(--neutral-600)]">{survey.description}</p>}
                  
                  <div className="mt-4 flex justify-between">
                    <div className="text-sm text-[var(--neutral-500)]">
                      {new Date(survey.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                      survey.published 
                        ? 'bg-[var(--success-100)] text-[var(--success-700)]' 
                        : 'bg-[var(--warning-100)] text-[var(--warning-700)]'
                    }`}>
                      {survey.published ? 'منشور' : 'مسودة'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] py-12">
            <div className="text-4xl">📋</div>
            <h3 className="mt-2 text-lg font-medium text-[var(--neutral-900)]">
              لا توجد استبيانات بعد
            </h3>
            <p className="mt-1 text-[var(--neutral-600)]">
              قم بإنشاء استبيان جديد للبدء
            </p>
            <button
              onClick={handleCreateSurvey}
              className="mt-4 rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
            >
              إنشاء استبيان جديد
            </button>
          </div>
        )
      )}
    </div>
  );
}
