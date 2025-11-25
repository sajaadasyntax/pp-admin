"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import Link from 'next/link';

interface LevelUser {
  id: string;
  email?: string;
  mobileNumber: string;
  adminLevel?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
  memberDetails?: {
    fullName?: string;
  };
}

interface LevelRegion {
  id: string;
  name: string;
  code?: string;
  active: boolean;
  admin?: {
    id: string;
    email?: string;
    mobileNumber: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
    memberDetails?: {
      fullName?: string;
    };
  };
  _count?: {
    localities: number;
    users: number;
  };
}

interface NationalLevel {
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
    profile?: {
      firstName?: string;
      lastName?: string;
    };
    memberDetails?: {
      fullName?: string;
    };
  };
  _count?: {
    regions: number;
    users: number;
  };
  regions?: LevelRegion[];
  users?: LevelUser[];
}

interface AdminUser {
  id: string;
  name: string;
  email?: string;
  mobileNumber: string;
  adminLevel: string;
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
  
  // Admin management state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<NationalLevel | null>(null);
  const [availableAdmins, setAvailableAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const canManage = !!user && (user.adminLevel === 'ADMIN' || user.adminLevel === 'GENERAL_SECRETARIAT' || user.role === 'ADMIN' || user.role === 'GENERAL_SECRETARIAT');

  const fetchLevels = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/hierarchy/national-levels?include=regions,users`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLevels(Array.isArray(data) ? data : data?.data || []);
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

    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'يرجى تسجيل الدخول أولاً'
      });
      return;
    }

    setSubmitting(true);
    try {
      const url = editing 
        ? `${apiUrl}/hierarchy/national-levels/${editing.id}`
        : `${apiUrl}/hierarchy/national-levels`;
      
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    
    if (!canManage || !token) {
      setStatusMessage({
        type: 'error',
        text: 'لا تملك صلاحية لحذف المستوى القومي'
      });
      return;
    }

    setSubmitting(true);
    try {
      await fetch(`${apiUrl}/hierarchy/national-levels/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  // Fetch available admins
  const fetchAvailableAdmins = async (levelId: string) => {
    if (!token) return;
    
    setLoadingAdmins(true);
    try {
      const response = await fetch(`${apiUrl}/users/available-admins?level=national&hierarchyId=${levelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter to show only non-admins OR admins of this level (NATIONAL_LEVEL)
        const filtered = data.filter((admin: AdminUser) => {
          const isNotAdmin = !admin.adminLevel || admin.adminLevel === 'USER';
          const isAdminOfThisLevel = admin.adminLevel === 'NATIONAL_LEVEL';
          return isNotAdmin || isAdminOfThisLevel;
        });
        setAvailableAdmins(filtered);
      }
    } catch (error) {
      console.error('Error fetching available admins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Open admin management modal
  const handleManageAdmin = (level: NationalLevel) => {
    setSelectedLevel(level);
    setShowAdminModal(true);
    fetchAvailableAdmins(level.id);
  };

  // Assign admin to level
  const handleAssignAdmin = async (adminId: string | null, isCurrentAdmin: boolean = false) => {
    if (!selectedLevel || !token) return;
    
    // If clicking on current admin, show confirmation dialog
    if (isCurrentAdmin && adminId) {
      const admin = availableAdmins.find(a => a.id === adminId);
      const adminName = admin?.name || 'هذا المسؤول';
      if (!window.confirm(`هل أنت متأكد من إلغاء صلاحية المسؤول "${adminName}"؟`)) {
        return;
      }
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/hierarchy/national-levels/${selectedLevel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ adminId }),
      });

      if (response.ok) {
        setStatusMessage({
          type: 'success',
          text: adminId ? 'تم تعيين المسؤول بنجاح' : 'تم إلغاء تعيين المسؤول بنجاح'
        });
        setShowAdminModal(false);
        await fetchLevels();
      } else {
        setStatusMessage({
          type: 'error',
          text: 'فشل في تعيين المسؤول'
        });
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: 'حدث خطأ أثناء تعيين المسؤول'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get admin name for display
  const getAdminName = (level: NationalLevel): string => {
    if (!level.admin) return 'غير معين';
    
    const { profile, memberDetails, email, mobileNumber } = level.admin;
    
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    
    if (memberDetails?.fullName) {
      return memberDetails.fullName;
    }
    
    return email || mobileNumber;
  };

  const getUserDisplayName = (user: LevelUser): string => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    if (user.memberDetails?.fullName) {
      return user.memberDetails.fullName;
    }
    return user.email || user.mobileNumber;
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

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">المسؤول</div>
                <div className="text-sm font-medium text-gray-900">{getAdminName(level)}</div>
              </div>

            {level.users && level.users.filter((u) => u.adminLevel && u.adminLevel !== 'USER').length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">المسؤولون تحت هذا المستوى</h4>
                  <span className="text-xs text-gray-500">{level.users.filter((u) => u.adminLevel && u.adminLevel !== 'USER').length} مسؤول</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {level.users
                    .filter((u) => u.adminLevel && u.adminLevel !== 'USER')
                    .map((adminUser) => (
                      <div key={adminUser.id} className="border border-gray-100 rounded-lg p-2 text-sm flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{getUserDisplayName(adminUser)}</div>
                          <div className="text-xs text-gray-500">{adminUser.mobileNumber}</div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                          {adminUser.adminLevel}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {level.regions && level.regions.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">الولايات التابعة</h4>
                  <span className="text-xs text-gray-500">{level.regions.length} ولاية</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {level.regions.map((region) => (
                    <div key={region.id} className="border border-gray-100 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{region.name}</div>
                          {region.code && <div className="text-xs text-gray-500">الكود: {region.code}</div>}
                          <div className="text-xs text-gray-500 mt-1">
                            المسؤول: {region.admin ? (
                              region.admin.profile?.firstName && region.admin.profile?.lastName
                                ? `${region.admin.profile.firstName} ${region.admin.profile.lastName}`
                                : region.admin.memberDetails?.fullName || region.admin.email || region.admin.mobileNumber
                              ) : 'غير معين'}
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/hierarchy/regions`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          إدارة
                        </Link>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        المحليات: {region._count?.localities || 0} • المستخدمين: {region._count?.users || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {canManage && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleManageAdmin(level)}
                    className="flex-1 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium"
                  >
                    إدارة المسؤول
                  </button>
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

      {/* Admin Management Modal */}
      {showAdminModal && selectedLevel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">إدارة مسؤول - {selectedLevel.name}</h2>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedLevel.admin && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">المسؤول الحالي</div>
                  <div className="font-medium">{getAdminName(selectedLevel)}</div>
                  <button
                    onClick={() => handleAssignAdmin(null)}
                    disabled={submitting}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    إلغاء التعيين
                  </button>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">تعيين مسؤول جديد</h3>
                {loadingAdmins ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : availableAdmins.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">لا يوجد مستخدمون متاحون</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableAdmins.map((admin) => {
                      const isCurrentAdmin = selectedLevel.adminId === admin.id;
                      const isAdminOfThisLevel = admin.adminLevel === 'NATIONAL_LEVEL';
                      return (
                        <button
                          key={admin.id}
                          onClick={() => handleAssignAdmin(isCurrentAdmin ? null : admin.id, isCurrentAdmin)}
                          disabled={submitting}
                          className={`w-full text-right p-3 rounded-lg border transition-colors ${
                            isCurrentAdmin
                              ? 'bg-purple-50 border-purple-300'
                              : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                          } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{admin.name}</div>
                              <div className="text-sm text-gray-500">{admin.mobileNumber}</div>
                              {!isAdminOfThisLevel && (
                                <div className="text-xs text-gray-400">{admin.adminLevel || 'مستخدم عادي'}</div>
                              )}
                            </div>
                            {isAdminOfThisLevel && (
                              <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                                مسؤول
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
