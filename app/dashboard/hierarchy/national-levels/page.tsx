"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import Link from 'next/link';

interface NationalLevel {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    regions: number;
    users: number;
  };
}

export default function NationalLevelsPage() {
  const { user, token } = useAuth();
  const [nationalLevels, setNationalLevels] = useState<NationalLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState<NationalLevel | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    active: true
  });

  // Fetch national levels
  const fetchNationalLevels = async () => {
    try {
      setLoading(true);
      setError(null);

      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/hierarchy/national-levels`, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      setNationalLevels(data.data || []);
    } catch (error) {
      console.error('Error fetching national levels:', error);
      setError('فشل في تحميل المستوى القومي');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNationalLevels();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = editingLevel 
        ? `${apiUrl}/hierarchy/national-levels/${editingLevel.id}`
        : `${apiUrl}/hierarchy/national-levels`;
      
      const response = await fetch(url, {
        method: editingLevel ? 'PUT' : 'POST',
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
      setEditingLevel(null);
      
      // Refresh list
      fetchNationalLevels();
    } catch (error) {
      console.error('Error saving national level:', error);
      alert('فشل في حفظ البيانات');
    }
  };

  const handleEdit = (level: NationalLevel) => {
    setEditingLevel(level);
    setFormData({
      name: level.name,
      code: level.code || '',
      description: level.description || '',
      active: level.active
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف المستوى القومي؟')) return;

    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${apiUrl}/hierarchy/national-levels/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      fetchNationalLevels();
    } catch (error) {
      console.error('Error deleting national level:', error);
      alert('فشل في حذف المستوى القومي');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">المستوى القومي</h1>
          <p className="text-gray-600">إدارة المستوى القومي (أعلى مستوى في التسلسل الهرمي)</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingLevel(null);
            setFormData({ name: '', code: '', description: '', active: true });
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {showCreateForm ? 'إلغاء' : '➕ إضافة جديد'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingLevel ? 'تعديل المستوى القومي' : 'إضافة مستوى قومي جديد'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الاسم *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الكود</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="active" className="mr-2 text-sm font-medium text-gray-700">
                فعال
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {editingLevel ? 'تحديث' : 'إضافة'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingLevel(null);
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

      {/* National Levels List */}
      <div className="bg-white rounded-lg shadow-md border">
        {nationalLevels.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">لا توجد مستويات قومية مضافة بعد</p>
            <p className="text-sm mt-2">انقر على "إضافة جديد" لإنشاء مستوى قومي</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الكود
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الولايات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستخدمين
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {nationalLevels.map((level) => (
                  <tr key={level.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{level.name}</div>
                      {level.description && (
                        <div className="text-sm text-gray-500">{level.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{level.code || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{level._count?.regions || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{level._count?.users || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          level.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {level.active ? 'فعال' : 'غير فعال'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEdit(level)}
                        className="text-blue-600 hover:text-blue-900 ml-4"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(level.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

