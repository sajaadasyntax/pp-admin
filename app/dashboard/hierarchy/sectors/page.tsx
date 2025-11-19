"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import Link from 'next/link';

type SectorType = 'SOCIAL' | 'ECONOMIC' | 'ORGANIZATIONAL' | 'POLITICAL';
type SectorLevel = 'national' | 'region' | 'locality' | 'adminUnit' | 'district';

interface SectorHierarchy {
  id: string;
  name: string;
  code?: string;
  sectorType: SectorType;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: any;
}

const sectorTypeLabels: Record<SectorType, string> = {
  SOCIAL: 'الاجتماعي',
  ECONOMIC: 'الاقتصادي',
  ORGANIZATIONAL: 'التنظيمي',
  POLITICAL: 'السياسي'
};

const sectorTypeColors: Record<SectorType, string> = {
  SOCIAL: 'bg-blue-100 text-blue-800',
  ECONOMIC: 'bg-green-100 text-green-800',
  ORGANIZATIONAL: 'bg-purple-100 text-purple-800',
  POLITICAL: 'bg-red-100 text-red-800'
};

const levelLabels: Record<SectorLevel, string> = {
  national: 'المستوى القومي',
  region: 'الولاية',
  locality: 'المحلية',
  adminUnit: 'الوحدة الإدارية',
  district: 'الحي'
};

export default function SectorsPage() {
  const { user, token } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<SectorLevel>('national');
  const [sectors, setSectors] = useState<SectorHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSector, setEditingSector] = useState<SectorHierarchy | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sectorType: 'SOCIAL' as SectorType,
    description: '',
    active: true,
    expatriateRegionId: '' // Required for sector national levels
  });

  // Expatriate regions for sector national levels
  const [expatriateRegions, setExpatriateRegions] = useState<Array<{id: string, name: string}>>([]);

  // API endpoints mapping
  const levelEndpoints: Record<SectorLevel, string> = {
    national: 'sector-national-levels',
    region: 'sector-regions',
    locality: 'sector-localities',
    adminUnit: 'sector-admin-units',
    district: 'sector-districts'
  };

  // Fetch sectors for selected level
  const fetchSectors = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endpoint = levelEndpoints[selectedLevel];
      
      const response = await fetch(`${apiUrl}/sector-hierarchy/${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      setSectors(data.data || []);
    } catch (error) {
      console.error('Error fetching sectors:', error);
      setError('فشل في تحميل القطاعات');
    } finally {
      setLoading(false);
    }
  };

  // Fetch expatriate regions for sector national levels
  const fetchExpatriateRegions = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-regions`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExpatriateRegions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching expatriate regions:', error);
    }
  };

  useEffect(() => {
    fetchSectors();
    if (selectedLevel === 'national') {
      fetchExpatriateRegions();
    }
  }, [selectedLevel, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }
    
    try {
      const endpoint = levelEndpoints[selectedLevel];
      const url = editingSector 
        ? `${apiUrl}/sector-hierarchy/${endpoint}/${editingSector.id}`
        : `${apiUrl}/sector-hierarchy/${endpoint}`;
      
      const response = await fetch(url, {
        method: editingSector ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      // Reset form
      setFormData({ 
        name: '', 
        code: '', 
        sectorType: 'SOCIAL', 
        description: '', 
        active: true,
        expatriateRegionId: ''
      });
      setShowCreateForm(false);
      setEditingSector(null);
      
      // Refresh list
      fetchSectors();
    } catch (error) {
      console.error('Error saving sector:', error);
      alert('فشل في حفظ البيانات');
    }
  };

  const handleEdit = (sector: SectorHierarchy) => {
    setEditingSector(sector);
    setFormData({
      name: sector.name,
      code: sector.code || '',
      sectorType: sector.sectorType,
      description: sector.description || '',
      active: sector.active,
      expatriateRegionId: (sector as any).expatriateRegionId || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('هل أنت متأكد من حذف هذا القطاع؟')) return;

    try {
      const endpoint = levelEndpoints[selectedLevel];
      const response = await fetch(`${apiUrl}/sector-hierarchy/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      fetchSectors();
    } catch (error) {
      console.error('Error deleting sector:', error);
      alert('فشل في حذف القطاع');
    }
  };

  // Group sectors by type
  const sectorsByType = sectors.reduce((acc, sector) => {
    if (!acc[sector.sectorType]) {
      acc[sector.sectorType] = [];
    }
    acc[sector.sectorType].push(sector);
    return acc;
  }, {} as Record<SectorType, SectorHierarchy[]>);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">التسلسل الهرمي للقطاعات</h1>
        <p className="text-gray-600">
          إدارة القطاعات الأربعة (الاجتماعي، الاقتصادي، التنظيمي، السياسي) عبر جميع المستويات
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <span className="text-2xl ml-3">💡</span>
          <div>
            <h3 className="text-indigo-900 font-semibold mb-1">عن القطاعات</h3>
            <p className="text-indigo-800 text-sm">
              التسلسل الهرمي للقطاعات يطابق التسلسل الجغرافي الأساسي، ولكن مع 4 أنواع مختلفة من القطاعات لكل مستوى:
              <strong> الاجتماعي</strong> (الخدمات الاجتماعية)،
              <strong> الاقتصادي</strong> (التنمية الاقتصادية)،
              <strong> التنظيمي</strong> (الهيكل التنظيمي)، و
              <strong> السياسي</strong> (الشؤون السياسية).
            </p>
          </div>
        </div>
      </div>

      {/* Level Selector */}
      <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">اختر المستوى</h3>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(levelLabels) as SectorLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => {
                setSelectedLevel(level);
                setShowCreateForm(false);
                setEditingSector(null);
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedLevel === level
                  ? 'bg-indigo-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {levelLabels[level]}
            </button>
          ))}
        </div>
      </div>

      {/* Add Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingSector(null);
                  setFormData({ 
                    name: '', 
                    code: '', 
                    sectorType: 'SOCIAL', 
                    description: '', 
                    active: true,
                    expatriateRegionId: ''
                  });
          }}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          {showCreateForm ? 'إلغاء' : '➕ إضافة قطاع جديد'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingSector ? 'تعديل القطاع' : `إضافة قطاع جديد - ${levelLabels[selectedLevel]}`}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Expatriate Region selector - only for national level */}
            {selectedLevel === 'national' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">إقليم المغتربين *</label>
                <select
                  value={formData.expatriateRegionId}
                  onChange={(e) => setFormData({ ...formData, expatriateRegionId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">اختر إقليم المغتربين</option>
                  {expatriateRegions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  القطاعات القومية يجب أن تكون مرتبطة بإقليم مغتربين
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الاسم *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع القطاع *</label>
              <select
                value={formData.sectorType}
                onChange={(e) => setFormData({ ...formData, sectorType: e.target.value as SectorType })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="SOCIAL">الاجتماعي</option>
                <option value="ECONOMIC">الاقتصادي</option>
                <option value="ORGANIZATIONAL">التنظيمي</option>
                <option value="POLITICAL">السياسي</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الكود</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="active" className="mr-2 text-sm font-medium text-gray-700">
                فعال
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
              >
                {editingSector ? 'تحديث' : 'إضافة'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingSector(null);
                  setFormData({ 
                    name: '', 
                    code: '', 
                    sectorType: 'SOCIAL', 
                    description: '', 
                    active: true,
                    expatriateRegionId: ''
                  });
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Sectors Grid - Grouped by Type */}
          {sectors.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow-md border text-center text-gray-500">
              <p className="text-lg">لا توجد قطاعات في {levelLabels[selectedLevel]} بعد</p>
              <p className="text-sm mt-2">انقر على &quot;إضافة قطاع جديد&quot; لإنشاء قطاع</p>
            </div>
          ) : (
            <div className="space-y-8">
              {(['SOCIAL', 'ECONOMIC', 'ORGANIZATIONAL', 'POLITICAL'] as SectorType[]).map((sectorType) => {
                const typeSectors = sectorsByType[sectorType] || [];
                if (typeSectors.length === 0) return null;

                return (
                  <div key={sectorType} className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        قطاع {sectorTypeLabels[sectorType]}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${sectorTypeColors[sectorType]}`}>
                        {typeSectors.length} قطاع
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {typeSectors.map((sector) => (
                        <div
                          key={sector.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{sector.name}</h4>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                sector.active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {sector.active ? 'فعال' : 'غير فعال'}
                            </span>
                          </div>

                          {sector.code && (
                            <p className="text-sm text-gray-500 mb-2">الكود: {sector.code}</p>
                          )}

                          {sector.description && (
                            <p className="text-sm text-gray-600 mb-3">{sector.description}</p>
                          )}

                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <button
                              onClick={() => handleEdit(sector)}
                              className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDelete(sector.id)}
                              className="flex-1 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Statistics Summary */}
          {sectors.length > 0 && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                ملخص إحصائيات {levelLabels[selectedLevel]}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['SOCIAL', 'ECONOMIC', 'ORGANIZATIONAL', 'POLITICAL'] as SectorType[]).map((type) => (
                  <div key={type} className={`p-4 rounded-lg ${sectorTypeColors[type].replace('text', 'bg').replace('800', '50')}`}>
                    <p className="text-sm font-medium mb-1">{sectorTypeLabels[type]}</p>
                    <p className="text-2xl font-bold">{sectorsByType[type]?.length || 0}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Back to Hierarchy */}
      <div className="mt-6">
        <Link
          href="/dashboard/hierarchy"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          العودة إلى التسلسل الهرمي
        </Link>
      </div>
    </div>
  );
}

