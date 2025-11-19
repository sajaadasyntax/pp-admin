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
  _count?: {
    regions: number;
    users: number;
  };
}

export default function NationalLevelsPage() {
  const { user, token } = useAuth();
  const [levels, setLevels] = useState<NationalLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NationalLevel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManage = !!user && (user.adminLevel === 'ADMIN' || user.adminLevel === 'GENERAL_SECRETARIAT' || user.role === 'ADMIN' || user.role === 'GENERAL_SECRETARIAT');

  const fetchLevels = async () => {
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${apiUrl}/hierarchy/national-levels`, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLevels(data.data || []);
      } else {
        setStatusMessage({
          type: 'error',
          text: 'فشل في تحميل المستويات القومية'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusMessage({
        type: 'error',
        text: 'حدث خطأ أثناء تحميل المستويات القومية'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setStatusMessage({
        type: 'error',
        text: 'لا تملك صلاحية لإدارة المستوى القومي'
      });
      return;
    }

    setStatusMessage(null);

    const normalizedName = formData.name.trim();
    if (!normalizedName) {
      setStatusMessage({
        type: 'error',
        text: 'الاسم مطلوب'
      });
      return;
    }

    const payload = {
      name: normalizedName,
      code: formData.code.trim() ? formData.code.trim().toUpperCase() : undefined,
      description: formData.description.trim() ? formData.description.trim() : undefined,
      active: !!formData.active
    };

    setSubmitting(true);
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = editing 
        ? `${apiUrl}/hierarchy/national-levels/${editing.id}`
        : `${apiUrl}/hierarchy/national-levels`;
      
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatusMessage({
          type: 'success',
          text: editing ? 'تم تحديث المستوى القومي بنجاح' : 'تم إنشاء المستوى القومي بنجاح'
        });
        setShowForm(false);
        setEditing(null);
        setFormData({ name: '', code: '', description: '', active: true });
        await fetchLevels();
      } else {
        let errorMessage = editing ? 'فشل في تحديث المستوى القومي' : 'فشل في إضافة المستوى القومي';
        try {
          const errorBody = await response.json();
          if (errorBody?.error) {
            errorMessage = errorBody.error;
          }
        } catch {
          // ignore parsing errors
        }
        setStatusMessage({
          type: 'error',
          text: errorMessage
        });
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: 'حدث خطأ غير متوقع أثناء حفظ البيانات'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (level: NationalLevel) => {
    if (!canManage) {
      setStatusMessage({
        type: 'error',
        text: 'لا تملك صلاحية لتعديل المستوى القومي'
      });
      return;
    }
    setEditing(level);
    setFormData({
      name: level.name,
      code: level.code || '',
      description: level.description || '',
      active: level.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    if (!canManage) {
      setStatusMessage({
        type: 'error',
        text: 'لا تملك صلاحية لحذف المستوى القومي'
      });
      return;
    }

    setSubmitting(true);
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      await fetch(`${apiUrl}/hierarchy/national-levels/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });
      setStatusMessage({
        type: 'success',
        text: 'تم حذف المستوى القومي بنجاح'
      });
      await fetchLevels();
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: 'فشل في حذف المستوى القومي'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {statusMessage && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
        >
          {statusMessage.text}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المستوى القومي</h1>
          <p className="text-gray-600 mt-1">أعلى مستوى في التسلسل الهرمي</p>
        </div>
        {canManage ? (
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setFormData({ name: '', code: '', description: '', active: true });
              setStatusMessage(null);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + إضافة جديد
          </button>
        ) : (
          <p className="text-sm text-gray-500">لا تملك صلاحية لإضافة مستوى قومي</p>
        )}
      </div>

      {/* Form Panel */}
      {canManage && showForm && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editing ? 'تعديل' : 'إضافة جديد'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكود</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
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
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label className="mr-2 text-sm text-gray-700">فعال</label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2 text-white rounded-lg ${submitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {submitting ? 'جاري الحفظ...' : editing ? 'تحديث' : 'إضافة'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setStatusMessage(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Levels List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {levels.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🌟</div>
            <p className="text-gray-600">لا توجد مستويات قومية</p>
          </div>
        ) : (
          levels.map((level) => (
            <div
              key={level.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{level.name}</h3>
                  {level.code && (
                    <span className="text-sm text-gray-500">الكود: {level.code}</span>
                  )}
                  {level.description && (
                    <p className="text-sm text-gray-600 mt-2">{level.description}</p>
                  )}
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  level.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {level.active ? 'فعال' : 'غير فعال'}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <span>الولايات: <strong>{level._count?.regions || 0}</strong></span>
                <span>المستخدمين: <strong>{level._count?.users || 0}</strong></span>
              </div>

              {canManage && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(level)}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(level.id)}
                    disabled={submitting}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${submitting ? 'bg-red-100 text-red-300 cursor-not-allowed' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                  >
                    حذف
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

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
