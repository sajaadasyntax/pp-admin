"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import Link from 'next/link';

interface ExpatriateRegion {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    sectorNationalLevels: number;
  };
}

export default function ExpatriateRegionsPage() {
  const { user, token } = useAuth();
  const [regions, setRegions] = useState<ExpatriateRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState<ExpatriateRegion | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    active: true
  });

  // Fetch expatriate regions
  const fetchExpatriateRegions = async () => {
    try {
      setLoading(true);
      setError(null);

      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-regions`, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      setRegions(data.data || []);
    } catch (error) {
      console.error('Error fetching expatriate regions:', error);
      setError('فشل في تحميل قطاعات المغتربين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpatriateRegions();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = editingRegion 
        ? `${apiUrl}/expatriate-hierarchy/expatriate-regions/${editingRegion.id}`
        : `${apiUrl}/expatriate-hierarchy/expatriate-regions`;
      
      const response = await fetch(url, {
        method: editingRegion ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      // Reset form
      setFormData({ name: '', code: '', description: '', active: true });
      setShowCreateForm(false);
      setEditingRegion(null);
      
      // Refresh list
      fetchExpatriateRegions();
    } catch (error) {
      console.error('Error saving expatriate region:', error);
      alert('فشل في حفظ البيانات');
    }
  };

  const handleEdit = (region: ExpatriateRegion) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      code: region.code || '',
      description: region.description || '',
      active: region.active
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القطاع؟')) return;

    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-regions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      fetchExpatriateRegions();
    } catch (error) {
      console.error('Error deleting expatriate region:', error);
      alert('فشل في حذف القطاع');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">قطاعات المغتربين</h1>
          <p className="text-gray-600">إدارة قطاعات المغتربين (13 قطاع حول العالم)</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingRegion(null);
            setFormData({ name: '', code: '', description: '', active: true });
          }}
          className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
        >
          {showCreateForm ? 'إلغاء' : '➕ إضافة قطاع جديد'}
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <span className="text-2xl ml-3">ℹ️</span>
          <div>
            <h3 className="text-cyan-900 font-semibold mb-1">عن قطاعات المغتربين</h3>
            <p className="text-cyan-800 text-sm">
              قطاعات المغتربين هي تسلسل هرمي منفصل يتضمن 13 قطاع للسودانيين في الخارج، بما في ذلك: 
              قطاع الخليج، قطاع السعودية، قطاع العراق والشام، قطاع تركيا، قطاع شرق آسيا، قطاع مصر، 
              شرق ووسط أفريقيا، قطاع شمال أفريقيا، قطاع أفريقيا، قطاع أوروبا، قطاع أمريكا وكندا، 
              قطاع أستراليا، قطاع أمريكا الجنوبية.
            </p>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingRegion ? 'تعديل قطاع المغتربين' : 'إضافة قطاع مغتربين جديد'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الاسم *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                placeholder="مثال: قطاع الخليج"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الكود</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                placeholder="مثال: GCC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                rows={3}
                placeholder="وصف القطاع والدول التي يشملها"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
              />
              <label htmlFor="active" className="mr-2 text-sm font-medium text-gray-700">
                فعال
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
              >
                {editingRegion ? 'تحديث' : 'إضافة'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingRegion(null);
                  setFormData({ name: '', code: '', description: '', active: true });
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expatriate Regions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regions.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-lg shadow-md border text-center text-gray-500">
            <p className="text-lg">لا توجد قطاعات مغتربين مضافة بعد</p>
            <p className="text-sm mt-2">انقر على "إضافة قطاع جديد" لإنشاء قطاع</p>
          </div>
        ) : (
          regions.map((region) => (
            <div
              key={region.id}
              className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{region.name}</h3>
                  {region.code && (
                    <span className="text-sm text-gray-500">الكود: {region.code}</span>
                  )}
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    region.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {region.active ? 'فعال' : 'غير فعال'}
                </span>
              </div>

              {region.description && (
                <p className="text-sm text-gray-600 mb-4">{region.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">المستخدمين</p>
                  <p className="text-xl font-bold text-gray-900">{region._count?.users || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">مستويات القطاعات</p>
                  <p className="text-xl font-bold text-gray-900">
                    {region._count?.sectorNationalLevels || 0}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(region)}
                  className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(region.id)}
                  className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                >
                  حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistics Summary */}
      {regions.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-bold text-gray-900 mb-4">ملخص الإحصائيات</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cyan-50 p-4 rounded-lg">
              <p className="text-sm text-cyan-700 mb-1">إجمالي القطاعات</p>
              <p className="text-2xl font-bold text-cyan-900">{regions.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700 mb-1">القطاعات الفعالة</p>
              <p className="text-2xl font-bold text-green-900">
                {regions.filter(r => r.active).length}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700 mb-1">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold text-blue-900">
                {regions.reduce((sum, r) => sum + (r._count?.users || 0), 0)}
              </p>
            </div>
          </div>
        </div>
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

