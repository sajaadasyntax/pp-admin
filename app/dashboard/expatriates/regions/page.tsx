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
  _count?: {
    users: number;
    sectorNationalLevels: number;
  };
}

export default function ExpatriateRegionsPage() {
  const { user, token } = useAuth();
  const [regions, setRegions] = useState<ExpatriateRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExpatriateRegion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    active: true
  });

  const fetchRegions = async () => {
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-regions`, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRegions(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = editing 
        ? `${apiUrl}/expatriate-hierarchy/expatriate-regions/${editing.id}`
        : `${apiUrl}/expatriate-hierarchy/expatriate-regions`;
      
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditing(null);
        setFormData({ name: '', code: '', description: '', active: true });
        fetchRegions();
      }
    } catch (error) {
      alert('فشل في حفظ البيانات');
    }
  };

  const handleEdit = (region: ExpatriateRegion) => {
    setEditing(region);
    setFormData({
      name: region.name,
      code: region.code || '',
      description: region.description || '',
      active: region.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-regions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });
      fetchRegions();
    } catch (error) {
      alert('فشل في الحذف');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">قطاعات المغتربين</h1>
          <p className="text-gray-600 mt-1">إدارة 13 قطاع للمغتربين حول العالم</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({ name: '', code: '', description: '', active: true });
          }}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium"
        >
          + إضافة قطاع
        </button>
      </div>

      {/* Form Panel */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editing ? 'تعديل القطاع' : 'إضافة قطاع جديد'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">الكود</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  placeholder="مثال: GCC"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
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
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-cyan-600 rounded"
              />
              <label className="mr-2 text-sm text-gray-700">فعال</label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
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

      {/* Regions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">✈️</div>
            <p className="text-gray-600">لا توجد قطاعات مغتربين</p>
          </div>
        ) : (
          regions.map((region) => (
            <div
              key={region.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{region.name}</h3>
                  {region.code && (
                    <span className="text-sm text-gray-500">الكود: {region.code}</span>
                  )}
                  {region.description && (
                    <p className="text-sm text-gray-600 mt-2">{region.description}</p>
                  )}
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  region.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {region.active ? 'فعال' : 'غير فعال'}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <span>المستخدمين: <strong>{region._count?.users || 0}</strong></span>
                <span>القطاعات: <strong>{region._count?.sectorNationalLevels || 0}</strong></span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/sectors?hierarchy=expatriates&region=${region.id}`}
                  className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-medium text-center"
                >
                  القطاعات
                </Link>
                <button
                  onClick={() => handleEdit(region)}
                  className="flex-1 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 text-sm font-medium"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(region.id)}
                  className="flex-1 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
                >
                  حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Back Link */}
      <div className="mt-6">
        <Link href="/dashboard/expatriates" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          العودة للمغتربين
        </Link>
      </div>
    </div>
  );
}

