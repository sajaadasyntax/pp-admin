"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';

export default function CreateVotingPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    voteType: 'opinion',
    startDate: '',
    endDate: '',
    options: ['', ''],
    targetRegionId: '',
    targetLocalityId: '',
    targetAdminUnitId: '',
    targetDistrictId: ''
  });

  const [hierarchyOptions, setHierarchyOptions] = useState({
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

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: newOptions
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.targetRegionId) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.options.filter(opt => opt.trim()).length < 2) {
      setError('يرجى إضافة خيارين على الأقل');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Determine target level based on selected hierarchy ids
      const targetLevel = formData.targetDistrictId
        ? 'district'
        : formData.targetAdminUnitId
        ? 'adminUnit'
        : formData.targetLocalityId
        ? 'locality'
        : 'region';

      const votingData = {
        title: formData.title,
        description: formData.description,
        voteType: formData.voteType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        options: formData.options
          .filter(opt => opt.trim())
          .map((opt, index) => ({ id: `option-${index}`, text: opt.trim() })),
        targetLevel,
        targetRegionId: formData.targetRegionId,
        targetLocalityId: formData.targetLocalityId || null,
        targetAdminUnitId: formData.targetAdminUnitId || null,
        targetDistrictId: formData.targetDistrictId || null
      };

      const response = await fetch(`${apiUrl}/content/voting`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(votingData)
      });

      if (response.ok) {
        setSuccess('تم إنشاء عنصر التصويت بنجاح');
        setTimeout(() => {
          router.push('/dashboard/voting-surveys');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'فشل في إنشاء عنصر التصويت');
      }
    } catch (err) {
      console.error('Error creating voting item:', err);
      setError('حدث خطأ أثناء إنشاء عنصر التصويت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--neutral-900)]">إنشاء عنصر تصويت جديد</h1>
        <p className="text-sm text-[var(--neutral-500)]">قم بإنشاء عنصر تصويت أو استطلاع رأي جديد</p>
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
                نوع التصويت *
              </label>
              <select
                name="voteType"
                value={formData.voteType}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 focus:border-[var(--primary-500)] focus:outline-none"
                required
              >
                <option value="opinion">تصويت رأي</option>
                <option value="electoral">تصويت انتخابي</option>
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
                placeholder="أدخل عنوان عنصر التصويت"
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
                placeholder="أدخل وصف عنصر التصويت"
                required
              />
            </div>
          </div>

          {/* Dates and Hierarchy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--neutral-900)]">التواريخ والاستهداف</h3>
            
            <div>
              <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                تاريخ البداية *
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 focus:border-[var(--primary-500)] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                تاريخ النهاية *
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
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

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--neutral-900)]">خيارات التصويت</h3>
            <button
              type="button"
              onClick={addOption}
              className="rounded-md bg-[var(--primary-600)] px-3 py-1 text-sm text-white hover:bg-[var(--primary-700)]"
            >
              إضافة خيار
            </button>
          </div>

          {formData.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 rtl:space-x-reverse">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 rounded-md border border-[var(--neutral-300)] px-3 py-2 focus:border-[var(--primary-500)] focus:outline-none"
                placeholder={`خيار ${index + 1}`}
              />
              {formData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                >
                  حذف
                </button>
              )}
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
            {loading ? 'جاري الإنشاء...' : 'إنشاء عنصر التصويت'}
          </button>
        </div>
      </form>
    </div>
  );
}
