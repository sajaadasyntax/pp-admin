"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import Link from 'next/link';

interface ExpatriateNationalLevel {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  adminId?: string;
  admin?: {
    id: string;
    email?: string;
    mobileNumber: string;
    profile?: { firstName?: string; lastName?: string; };
    memberDetails?: { fullName?: string; };
  };
  _count?: { regions: number; users: number; };
}

interface AdminUser {
  id: string;
  name: string;
  email?: string;
  mobileNumber: string;
  adminLevel: string;
}

export default function ExpatriateNationalLevelsPage() {
  const { token } = useAuth();
  const [nationalLevels, setNationalLevels] = useState<ExpatriateNationalLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExpatriateNationalLevel | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', active: true });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExpatriateNationalLevel | null>(null);
  const [availableAdmins, setAvailableAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!token) throw new Error('No authentication token');
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...options.headers },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }, [token]);

  const fetchNationalLevels = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiCall('/expatriate-hierarchy/expatriate-national-levels');
      setNationalLevels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching national levels:', error);
    } finally {
      setLoading(false);
    }
  }, [token, apiCall]);

  useEffect(() => { fetchNationalLevels(); }, [fetchNationalLevels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await apiCall(`/expatriate-hierarchy/expatriate-national-levels/${editing.id}`, {
          method: 'PUT', body: JSON.stringify(formData)
        });
      } else {
        await apiCall('/expatriate-hierarchy/expatriate-national-levels', {
          method: 'POST', body: JSON.stringify(formData)
        });
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', code: '', description: '', active: true });
      fetchNationalLevels();
    } catch (error) {
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: ExpatriateNationalLevel) => {
    setEditing(item);
    setFormData({ name: item.name, code: item.code || '', description: item.description || '', active: item.active });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    try {
      await apiCall(`/expatriate-hierarchy/expatriate-national-levels/${id}`, { method: 'DELETE' });
      fetchNationalLevels();
    } catch (error) {
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const fetchAvailableAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const response = await fetch(`${apiUrl}/users/available-admins?level=expatriate_national_level`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableAdmins(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleManageAdmin = (item: ExpatriateNationalLevel) => {
    setSelectedItem(item);
    setShowAdminModal(true);
    fetchAvailableAdmins();
  };

  const handleAssignAdmin = async (adminId: string | null) => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await apiCall(`/expatriate-hierarchy/expatriate-national-levels/${selectedItem.id}`, {
        method: 'PUT', body: JSON.stringify({ adminId })
      });
      alert(adminId ? 'تم تعيين المسؤول بنجاح' : 'تم إلغاء تعيين المسؤول بنجاح');
      setShowAdminModal(false);
      fetchNationalLevels();
    } catch (error) {
      alert('فشل في تعيين المسؤول');
    } finally {
      setSubmitting(false);
    }
  };

  const getAdminName = (item: ExpatriateNationalLevel): string => {
    if (!item.admin) return 'غير معين';
    const { profile, memberDetails, email, mobileNumber } = item.admin;
    if (profile?.firstName && profile?.lastName) return `${profile.firstName} ${profile.lastName}`;
    if (memberDetails?.fullName) return memberDetails.fullName;
    return email || mobileNumber;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard/expatriates" className="text-purple-600 hover:text-purple-800 mb-2 inline-block">
            ← العودة للمغتربين
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">المستوى القومي للمغتربين</h1>
          <p className="text-gray-600">إدارة المستويات القومية في نظام المغتربين</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setFormData({ name: '', code: '', description: '', active: true }); }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          + إضافة مستوى قومي
        </button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nationalLevels.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                {item.code && <p className="text-sm text-gray-500">الكود: {item.code}</p>}
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {item.active ? 'فعال' : 'غير فعال'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span>القطاعات: {item._count?.regions || 0}</span>
              <span>المستخدمين: {item._count?.users || 0}</span>
            </div>
            
            <div className="text-sm mb-3">
              <span className="text-gray-500">المسؤول: </span>
              <span className={item.admin ? 'text-gray-900' : 'text-orange-600'}>{getAdminName(item)}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleManageAdmin(item)} className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100">
                إدارة المسؤول
              </button>
              <Link href={`/dashboard/expatriates/regions?nationalLevelId=${item.id}`} className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded text-xs hover:bg-cyan-100">
                القطاعات
              </Link>
              <button onClick={() => handleEdit(item)} className="px-3 py-1 bg-gray-50 text-gray-700 rounded text-xs hover:bg-gray-100">
                تعديل
              </button>
              <button onClick={() => handleDelete(item.id)} className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100">
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {nationalLevels.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">لا توجد مستويات قومية</p>
          <p className="text-sm">أضف مستوى قومي جديد للبدء</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editing ? 'تعديل المستوى القومي' : 'إضافة مستوى قومي جديد'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكود</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
                    className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    className="w-full border rounded-lg px-3 py-2" rows={3} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  إلغاء
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  {submitting ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">إدارة المسؤول - {selectedItem.name}</h2>
            {loadingAdmins ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedItem.admin && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{getAdminName(selectedItem)}</div>
                        <div className="text-sm text-gray-500">المسؤول الحالي</div>
                      </div>
                      <button onClick={() => handleAssignAdmin(null)} className="text-red-600 hover:text-red-800 text-sm">
                        إلغاء التعيين
                      </button>
                    </div>
                  </div>
                )}
                <div className="text-sm font-medium text-gray-700 mb-2">المستخدمين المتاحين للتعيين:</div>
                {availableAdmins.length === 0 ? (
                  <p className="text-gray-500 text-sm">لا يوجد مستخدمين متاحين</p>
                ) : (
                  availableAdmins.map((admin) => (
                    <div key={admin.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{admin.name}</div>
                          <div className="text-sm text-gray-500">{admin.mobileNumber}</div>
                        </div>
                        <button onClick={() => handleAssignAdmin(admin.id)} disabled={submitting}
                          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50">
                          تعيين
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowAdminModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

