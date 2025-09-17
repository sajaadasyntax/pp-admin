"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';

type SurveyQuestion = {
  id: number;
  text: string;
  type: 'text' | 'multiple_choice' | 'single_choice';
  options: string[];
};

type SurveyFormData = {
  title: string;
  description: string;
  type: string;
  dueDate: string;
  questions: SurveyQuestion[];
  targetRegionId: string;
  targetLocalityId: string;
  targetAdminUnitId: string;
  targetDistrictId: string;
};

type HierarchyOptions = {
  regions: any[];
  localities: any[];
  adminUnits: any[];
  districts: any[];
};

export default function CreateSurveyPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<SurveyFormData>({
    title: '',
    description: '',
    type: 'public',
    dueDate: '',
    questions: [
      { id: 1, text: '', type: 'text', options: [] as string[] }
    ],
    targetRegionId: '',
    targetLocalityId: '',
    targetAdminUnitId: '',
    targetDistrictId: ''
  });

  const [hierarchyOptions, setHierarchyOptions] = useState<HierarchyOptions>({
    regions: [],
    localities: [],
    adminUnits: [],
    districts: []
  });

  // Fetch hierarchy options
  useEffect(() => {
    const fetchHierarchyOptions = async () => {
      try {
        const response = await fetch(`${apiUrl}/hierarchy/full-hierarchy`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setHierarchyOptions({ regions: data, localities: [], adminUnits: [], districts: [] });
        }
      } catch (err) {
        console.error('Error fetching hierarchy options:', err);
      }
    };

    if (token) {
      fetchHierarchyOptions();
    }
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  const addQuestion = () => {
    const newId = Math.max(...formData.questions.map(q => q.id)) + 1;
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { id: newId, text: '', type: 'text', options: [] }]
    }));
  };

  const removeQuestion = (index: number) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        questions: newQuestions
      }));
    }
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options.push('');
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.targetRegionId) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.questions.some(q => !q.text.trim())) {
      setError('يرجى ملء جميع الأسئلة');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const surveyData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        audience: formData.type === 'member' ? 'member' : 'public',
        dueDate: new Date(formData.dueDate).toISOString(),
        questions: formData.questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.type === 'multiple_choice' ? q.options.filter(opt => opt.trim()) : []
        })),
        targetRegionId: formData.targetRegionId,
        targetLocalityId: formData.targetLocalityId || null,
        targetAdminUnitId: formData.targetAdminUnitId || null,
        targetDistrictId: formData.targetDistrictId || null
      };

      const response = await fetch(`${apiUrl}/content/surveys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData)
      });

      if (response.ok) {
        setSuccess('تم إنشاء الاستبيان بنجاح');
        setTimeout(() => {
          router.push('/dashboard/voting-surveys');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'فشل في إنشاء الاستبيان');
      }
    } catch (err) {
      console.error('Error creating survey:', err);
      setError('حدث خطأ أثناء إنشاء الاستبيان');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--neutral-900)]">إنشاء استبيان جديد</h1>
        <p className="text-sm text-[var(--neutral-500)]">قم بإنشاء استبيان عام أو خاص بالأعضاء</p>
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--neutral-900)]">المعلومات الأساسية</h3>
            
            <div>
              <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                نوع الاستبيان *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 focus:border-[var(--primary-500)] focus:outline-none"
                required
              >
                <option value="public">استبيان عام</option>
                <option value="member">استبيان أعضاء</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                العنوان *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 focus:border-[var(--primary-500)] focus:outline-none"
                placeholder="أدخل عنوان الاستبيان"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                الوصف *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 focus:border-[var(--primary-500)] focus:outline-none"
                placeholder="أدخل وصف الاستبيان"
                required
              />
            </div>
          </div>

          {/* Dates and Hierarchy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--neutral-900)]">التواريخ والاستهداف</h3>
            
            <div>
              <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                تاريخ الانتهاء *
              </label>
              <input
                type="datetime-local"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 focus:border-[var(--primary-500)] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                الولاية *
              </label>
              <select
                name="targetRegionId"
                value={formData.targetRegionId}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 focus:border-[var(--primary-500)] focus:outline-none"
                required
              >
                <option value="">اختر الولاية</option>
                {hierarchyOptions.regions.map((region: any) => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                المحلية
              </label>
              <select
                name="targetLocalityId"
                value={formData.targetLocalityId}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 focus:border-[var(--primary-500)] focus:outline-none"
              >
                <option value="">اختر المحلية (اختياري)</option>
                {hierarchyOptions.localities.map((locality: any) => (
                  <option key={locality.id} value={locality.id}>{locality.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--neutral-900)]">أسئلة الاستبيان</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="rounded-md bg-[var(--primary-600)] px-3 py-1 text-sm text-white hover:bg-[var(--primary-700)]"
            >
              إضافة سؤال
            </button>
          </div>

          {formData.questions.map((question, index) => (
            <div key={question.id} className="border border-[var(--neutral-200)] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-[var(--neutral-900)]">سؤال {index + 1}</h4>
                {formData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="rounded-md bg-red-600 px-2 py-1 text-sm text-white hover:bg-red-700"
                  >
                    حذف السؤال
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                    نص السؤال *
                  </label>
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                    className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 focus:border-[var(--primary-500)] focus:outline-none"
                    placeholder="أدخل نص السؤال"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                    نوع السؤال *
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                    className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 focus:border-[var(--primary-500)] focus:outline-none"
                  >
                    <option value="text">نص حر</option>
                    <option value="multiple_choice">اختيار متعدد</option>
                    <option value="single_choice">اختيار واحد</option>
                  </select>
                </div>

                {(question.type === 'multiple_choice' || question.type === 'single_choice') && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-[var(--neutral-700)]">
                        خيارات الإجابة
                      </label>
                      <button
                        type="button"
                        onClick={() => addOption(index)}
                        className="rounded-md bg-[var(--primary-600)] px-2 py-1 text-sm text-white hover:bg-[var(--primary-700)]"
                      >
                        إضافة خيار
                      </button>
                    </div>
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                          className="flex-1 rounded-md border border-[var(--neutral-300)] px-3 py-2 focus:border-[var(--primary-500)] focus:outline-none"
                          placeholder={`خيار ${optionIndex + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index, optionIndex)}
                          className="rounded-md bg-red-600 px-2 py-2 text-white hover:bg-red-700"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 rtl:space-x-reverse">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-[var(--neutral-300)] px-4 py-2 text-[var(--neutral-700)] hover:bg-[var(--neutral-50)]"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)] disabled:opacity-50"
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء الاستبيان'}
          </button>
        </div>
      </form>
    </div>
  );
}
