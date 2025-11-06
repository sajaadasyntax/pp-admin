"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Region {
  id: string;
  name: string;
  code?: string;
}

interface Locality {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  regionId: string;
  region?: Region;
  _count?: {
    users: number;
    adminUnits: number;
  };
}

export default function LocalitiesPage() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(
    searchParams.get('region') || null
  );
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Locality | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    regionId: ''
  });

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers,
      },
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  }, [token]);

  const fetchRegions = useCallback(async () => {
    try {
      const data = await apiCall('/hierarchy/regions');
      setRegions(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [apiCall]);

  const fetchLocalities = useCallback(async (regionId: string) => {
    try {
      setLoading(true);
      const data = await apiCall(`/hierarchy/regions/${regionId}/localities`);
      setLocalities(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  useEffect(() => {
    if (selectedRegion) {
      fetchLocalities(selectedRegion);
      setFormData(prev => ({ ...prev, regionId: selectedRegion }));
    } else {
      setLocalities([]);
    }
  }, [selectedRegion, fetchLocalities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.regionId) {
      alert('الرجاء إدخال الاسم واختيار الولاية');
      return;
    }

    try {
      if (editing) {
        await apiCall(`/hierarchy/localities/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name.trim(),
            code: formData.code.trim(),
            description: formData.description.trim()
          }),
        });
      } else {
        await apiCall(`/hierarchy/regions/${formData.regionId}/localities`, {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name.trim(),
            code: formData.code.trim(),
            description: formData.description.trim()
          }),
        });
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', code: '', description: '', regionId: selectedRegion || '' });
      if (selectedRegion) fetchLocalities(selectedRegion);
    } catch (error) {
      alert('فشل في حفظ البيانات');
    }
  };

  const handleEdit = (locality: Locality) => {
    setEditing(locality);
    setFormData({
      name: locality.name,
      code: locality.code || '',
      description: locality.description || '',
      regionId: locality.regionId
    });
    setShowForm(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiCall(`/hierarchy/localities/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentStatus }),
      });
      if (selectedRegion) fetchLocalities(selectedRegion);
    } catch (error) {
      alert('فشل في تحديث الحالة');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المحليات</h1>
          <p className="text-gray-600 mt-1">إدارة المحليات والمدن</p>
        </div>
        <button
          onClick={() => {
            if (!selectedRegion) {
              alert('الرجاء اختيار ولاية أولاً');
              return;
            }
            setShowForm(true);
            setEditing(null);
            setFormData({ name: '', code: '', description: '', regionId: selectedRegion });
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          disabled={!selectedRegion}
        >
          + إضافة محلية
        </button>
      </div>

      {/* Region Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">اختر الولاية</h2>
        <div className="flex flex-wrap gap-2">
          {regions.map(region => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedRegion === region.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {region.name}
            </button>
          ))}
        </div>
      </div>

      {/* Form Panel */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editing ? 'تعديل المحلية' : 'إضافة محلية جديدة'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الولاية *</label>
              <select
                value={formData.regionId}
                onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">اختر الولاية</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكود</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {editing ? 'تحديث' : 'إضافة'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Localities List */}
      {!selectedRegion ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏘️</div>
          <p className="text-gray-600">الرجاء اختيار ولاية لعرض المحليات</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : localities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏘️</div>
          <p className="text-gray-600">لا توجد محليات في هذه الولاية</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localities.map((locality) => (
            <div
              key={locality.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{locality.name}</h3>
                  {locality.code && (
                    <span className="text-sm text-gray-500">الكود: {locality.code}</span>
                  )}
                  {locality.description && (
                    <p className="text-sm text-gray-600 mt-2">{locality.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleStatus(locality.id, locality.active)}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    locality.active
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {locality.active ? 'فعال' : 'غير فعال'}
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <span>الوحدات: <strong>{locality._count?.adminUnits || 0}</strong></span>
                <span>المستخدمين: <strong>{locality._count?.users || 0}</strong></span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/hierarchy/admin-units?locality=${locality.id}`}
                  className="flex-1 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium text-center"
                >
                  الوحدات
                </Link>
                <button
                  onClick={() => handleEdit(locality)}
                  className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium"
                >
                  تعديل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back Link */}
      <div className="mt-6">
        <Link href="/dashboard/hierarchy" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          العودة للتسلسل الهرمي
        </Link>
      </div>
    </div>
  );
}
