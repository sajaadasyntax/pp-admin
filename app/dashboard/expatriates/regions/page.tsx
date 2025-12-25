"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import Link from 'next/link';

interface ExpatriateRegion {
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
    users: number;
    sectorNationalLevels: number;
    localities: number;
  };
}

interface AdminUser {
  id: string;
  name: string;
  email?: string;
  mobileNumber: string;
  adminLevel: string;
}

interface UserForManagement {
  id: string;
  name: string;
  email?: string;
  mobileNumber: string;
  adminLevel?: string;
  expatriateRegionId?: string;
}

export default function ExpatriateRegionsPage() {
  const { token } = useAuth();
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

  // Admin management state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<ExpatriateRegion | null>(null);
  const [availableAdmins, setAvailableAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // User management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedRegionForUsers, setSelectedRegionForUsers] = useState<ExpatriateRegion | null>(null);
  const [currentUsers, setCurrentUsers] = useState<UserForManagement[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserForManagement[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submittingUsers, setSubmittingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create user state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedRegionForCreate, setSelectedRegionForCreate] = useState<ExpatriateRegion | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    mobileNumber: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    fullName: ''
  });

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!token) throw new Error('No authentication token');
    
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  }, [token]);

  const fetchRegions = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiCall('/expatriate-hierarchy/expatriate-regions');
      // Backend returns array directly, not wrapped in data object
      setRegions(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [apiCall, token]);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  // Fetch available admins for assignment
  const fetchAvailableAdmins = useCallback(async (regionId: string) => {
    try {
      setLoadingAdmins(true);
      // Use the general admins endpoint
      const data = await apiCall(`/users/available-admins?level=expatriate_region&entityId=${regionId}`);
      
      const admins = (data.admins || data || []).map((admin: any) => ({
        id: admin.id,
        name: admin.memberDetails?.fullName || 
              (admin.profile ? `${admin.profile.firstName || ''} ${admin.profile.lastName || ''}`.trim() : '') ||
              admin.mobileNumber,
        email: admin.email,
        mobileNumber: admin.mobileNumber,
        adminLevel: admin.adminLevel
      }));
      
      setAvailableAdmins(admins);
    } catch (error) {
      console.error('Error fetching available admins:', error);
      setAvailableAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  }, [apiCall]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }

    try {
      if (editing) {
        await apiCall(`/expatriate-hierarchy/expatriate-regions/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await apiCall('/expatriate-hierarchy/expatriate-regions', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', code: '', description: '', active: true });
      await fetchRegions();
      alert(editing ? 'تم تحديث القطاع بنجاح' : 'تم إضافة القطاع بنجاح');
    } catch (error) {
      console.error('Error saving region:', error);
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
    if (!token || !window.confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      await apiCall(`/expatriate-hierarchy/expatriate-regions/${id}`, {
        method: 'DELETE',
      });
      await fetchRegions();
    } catch (error) {
      alert('فشل في الحذف');
    }
  };

  // Open admin management modal
  const openAdminModal = (region: ExpatriateRegion) => {
    setSelectedRegion(region);
    setShowAdminModal(true);
    fetchAvailableAdmins(region.id);
  };

  // Assign admin to region
  const assignAdmin = async (adminId: string) => {
    if (!selectedRegion) return;
    
    try {
      setSubmitting(true);
      await apiCall(`/expatriate-hierarchy/expatriate-regions/${selectedRegion.id}`, {
        method: 'PUT',
        body: JSON.stringify({ adminId }),
      });
      
      await fetchRegions();
      setShowAdminModal(false);
      alert('تم تعيين المشرف بنجاح');
    } catch (error) {
      console.error('Error assigning admin:', error);
      alert('فشل في تعيين المشرف');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove admin from region
  const removeAdmin = async () => {
    if (!selectedRegion) return;
    if (!window.confirm('هل أنت متأكد من إزالة المشرف؟')) return;
    
    try {
      setSubmitting(true);
      await apiCall(`/expatriate-hierarchy/expatriate-regions/${selectedRegion.id}`, {
        method: 'PUT',
        body: JSON.stringify({ adminId: null }),
      });
      
      await fetchRegions();
      setShowAdminModal(false);
      alert('تم إزالة المشرف بنجاح');
    } catch (error) {
      console.error('Error removing admin:', error);
      alert('فشل في إزالة المشرف');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch users for expatriate region management
  const fetchUsersForRegion = async (region: ExpatriateRegion) => {
    if (!token) return;
    
    setLoadingUsers(true);
    try {
      // Get current users in the region
      const usersData = await apiCall(`/expatriate-hierarchy/expatriate-regions/${region.id}/users`);
      const allUsers = Array.isArray(usersData) ? usersData : usersData.data || [];
      
      const regionUsers = allUsers.map((u: any) => ({
        id: u.id,
        name: u.profile?.firstName && u.profile?.lastName
          ? `${u.profile.firstName} ${u.profile.lastName}`
          : u.memberDetails?.fullName || u.email || u.mobileNumber,
        email: u.email,
        mobileNumber: u.mobileNumber,
        adminLevel: u.adminLevel,
        expatriateRegionId: u.expatriateRegionId
      }));
      
      setCurrentUsers(regionUsers);
      
      // Get available users (all users not in this region)
      const allUsersData = await apiCall('/users?page=1&limit=1000');
      const allUsersList = Array.isArray(allUsersData) ? allUsersData : allUsersData.users || allUsersData.data || [];
      
      const availableUsersList = allUsersList
        .filter((u: any) => u.expatriateRegionId !== region.id)
        .map((u: any) => ({
          id: u.id,
          name: u.profile?.firstName && u.profile?.lastName
            ? `${u.profile.firstName} ${u.profile.lastName}`
            : u.memberDetails?.fullName || u.email || u.mobileNumber,
          email: u.email,
          mobileNumber: u.mobileNumber,
          adminLevel: u.adminLevel,
          expatriateRegionId: u.expatriateRegionId
        }));
      
      setAvailableUsers(availableUsersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('فشل في تحميل المستخدمين');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Open user management modal
  const handleManageUsers = (region: ExpatriateRegion) => {
    setSelectedRegionForUsers(region);
    setShowUserModal(true);
    setSearchQuery('');
    fetchUsersForRegion(region);
  };

  // Add user to expatriate region
  const handleAddUserToRegion = async (userId: string) => {
    if (!selectedRegionForUsers || !token) return;
    
    setSubmittingUsers(true);
    try {
      await apiCall(`/expatriate-hierarchy/users/${userId}/expatriate-region`, {
        method: 'PUT',
        body: JSON.stringify({ expatriateRegionId: selectedRegionForUsers.id }),
      });

      alert('تم إضافة المستخدم إلى القطاع بنجاح');
      await fetchUsersForRegion(selectedRegionForUsers);
      fetchRegions();
    } catch (error) {
      console.error('Error adding user to region:', error);
      alert('فشل في إضافة المستخدم');
    } finally {
      setSubmittingUsers(false);
    }
  };

  // Remove user from expatriate region
  const handleRemoveUserFromRegion = async (userId: string) => {
    if (!selectedRegionForUsers || !token) return;
    
    const user = currentUsers.find(u => u.id === userId);
    const userName = user?.name || 'هذا المستخدم';
    
    if (!window.confirm(`هل أنت متأكد من إزالة "${userName}" من هذا القطاع؟`)) {
      return;
    }
    
    setSubmittingUsers(true);
    try {
      await apiCall(`/expatriate-hierarchy/users/${userId}/expatriate-region`, {
        method: 'PUT',
        body: JSON.stringify({ expatriateRegionId: null }),
      });

      alert('تم إزالة المستخدم من القطاع بنجاح');
      await fetchUsersForRegion(selectedRegionForUsers);
      fetchRegions();
    } catch (error) {
      console.error('Error removing user from region:', error);
      alert('فشل في إزالة المستخدم');
    } finally {
      setSubmittingUsers(false);
    }
  };

  // Open create user modal
  const openCreateUserModal = (region: ExpatriateRegion) => {
    setSelectedRegionForCreate(region);
    setShowCreateUserModal(true);
    setCreateUserForm({
      mobileNumber: '',
      password: '',
      email: '',
      firstName: '',
      lastName: '',
      fullName: ''
    });
  };

  // Create new user for expatriate region
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegionForCreate || !token) return;
    
    // Validate required fields
    if (!createUserForm.mobileNumber) {
      alert('رقم الهاتف مطلوب');
      return;
    }
    if (!createUserForm.password) {
      alert('كلمة المرور مطلوبة');
      return;
    }
    if (!createUserForm.firstName && !createUserForm.lastName && !createUserForm.fullName) {
      alert('الاسم مطلوب');
      return;
    }
    
    setCreatingUser(true);
    try {
      await apiCall(`/expatriate-hierarchy/expatriate-regions/${selectedRegionForCreate.id}/users`, {
        method: 'POST',
        body: JSON.stringify(createUserForm),
      });
      
      alert('تم إنشاء المستخدم بنجاح');
      setShowCreateUserModal(false);
      setSelectedRegionForCreate(null);
      fetchRegions();
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(error.message || 'فشل في إنشاء المستخدم');
    } finally {
      setCreatingUser(false);
    }
  };

  const getAdminDisplayName = (admin: ExpatriateRegion['admin']): string => {
    if (!admin) return '';
    if (admin.memberDetails?.fullName) return admin.memberDetails.fullName;
    if (admin.profile?.firstName || admin.profile?.lastName) {
      return `${admin.profile.firstName || ''} ${admin.profile.lastName || ''}`.trim();
    }
    return admin.mobileNumber;
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

              {/* Admin Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">المشرف:</span>
                  {region.admin ? (
                    <span className="text-sm font-medium text-gray-900">
                      {getAdminDisplayName(region.admin)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 italic">لم يتم التعيين</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <span>المستخدمين: <strong>{region._count?.users || 0}</strong></span>
                <span>القطاعات: <strong>{region._count?.sectorNationalLevels || 0}</strong></span>
              </div>

              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                <span>المحليات: <strong>{region._count?.localities || 0}</strong></span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openAdminModal(region)}
                  className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium"
                >
                  👤 المشرف
                </button>
                <Link
                  href={`/dashboard/expatriates/localities?regionId=${region.id}`}
                  className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium text-center"
                >
                  🏘️ المحليات
                </Link>
                <button
                  onClick={() => handleManageUsers(region)}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                >
                  👥 المستخدمين
                </button>
                <button
                  onClick={() => openCreateUserModal(region)}
                  className="px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 text-sm font-medium"
                >
                  ➕ إنشاء مستخدم
                </button>
                <button
                  onClick={() => handleEdit(region)}
                  className="px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 text-sm font-medium"
                >
                  ✏️ تعديل
                </button>
                <button
                  onClick={() => handleDelete(region.id)}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
                >
                  🗑️ حذف
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

      {/* Admin Management Modal */}
      {showAdminModal && selectedRegion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b bg-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">إدارة المشرف</h2>
                  <p className="text-gray-600 text-sm mt-1">{selectedRegion.name}</p>
                </div>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
              {/* Current Admin */}
              {selectedRegion.admin && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">المشرف الحالي</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{getAdminDisplayName(selectedRegion.admin)}</p>
                      <p className="text-sm text-gray-500">{selectedRegion.admin.mobileNumber}</p>
                      {selectedRegion.admin.email && (
                        <p className="text-sm text-gray-500">{selectedRegion.admin.email}</p>
                      )}
                    </div>
                    <button
                      onClick={removeAdmin}
                      disabled={submitting}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium disabled:opacity-50"
                    >
                      إزالة
                    </button>
                  </div>
                </div>
              )}

              {/* Available Admins */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {selectedRegion.admin ? 'تغيير المشرف' : 'تعيين مشرف جديد'}
                </h3>
                
                {loadingAdmins ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : availableAdmins.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>لا يوجد مستخدمين متاحين للتعيين</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableAdmins.map((admin) => (
                      <div
                        key={admin.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{admin.name}</p>
                          <p className="text-sm text-gray-500">{admin.mobileNumber}</p>
                        </div>
                        <button
                          onClick={() => assignAdmin(admin.id)}
                          disabled={submitting}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
                        >
                          تعيين
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowAdminModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserModal && selectedRegionForUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">إدارة المستخدمين - {selectedRegionForUsers.name}</h2>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedRegionForUsers(null);
                    setSearchQuery('');
                    setCurrentUsers([]);
                    setAvailableUsers([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="بحث عن مستخدم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Users */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                      المستخدمون الحاليون ({currentUsers.filter(u => 
                        !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.mobileNumber.includes(searchQuery) || 
                        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {currentUsers
                        .filter(u => 
                          !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.mobileNumber.includes(searchQuery) || 
                          (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        .map((user) => (
                          <div
                            key={user.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.mobileNumber}</div>
                              {user.email && (
                                <div className="text-xs text-gray-400">{user.email}</div>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveUserFromRegion(user.id)}
                              disabled={submittingUsers}
                              className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50"
                            >
                              إزالة
                            </button>
                          </div>
                        ))}
                      {currentUsers.filter(u => 
                        !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.mobileNumber.includes(searchQuery) || 
                        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).length === 0 && (
                        <p className="text-sm text-gray-500 py-4 text-center">لا يوجد مستخدمون في هذا القطاع</p>
                      )}
                    </div>
                  </div>

                  {/* Available Users */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                      المستخدمون المتاحون ({availableUsers.filter(u => 
                        !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.mobileNumber.includes(searchQuery) || 
                        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {availableUsers
                        .filter(u => 
                          !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.mobileNumber.includes(searchQuery) || 
                          (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        .map((user) => (
                          <div
                            key={user.id}
                            className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between hover:border-blue-300"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.mobileNumber}</div>
                              {user.email && (
                                <div className="text-xs text-gray-400">{user.email}</div>
                              )}
                            </div>
                            <button
                              onClick={() => handleAddUserToRegion(user.id)}
                              disabled={submittingUsers}
                              className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                            >
                              إضافة
                            </button>
                          </div>
                        ))}
                      {availableUsers.filter(u => 
                        !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.mobileNumber.includes(searchQuery) || 
                        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).length === 0 && (
                        <p className="text-sm text-gray-500 py-4 text-center">لا يوجد مستخدمون متاحون للإضافة</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedRegionForUsers(null);
                    setSearchQuery('');
                    setCurrentUsers([]);
                    setAvailableUsers([]);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && selectedRegionForCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">إنشاء مستخدم جديد</h2>
                  <p className="text-gray-600 text-sm mt-1">قطاع: {selectedRegionForCreate.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setSelectedRegionForCreate(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={createUserForm.mobileNumber}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, mobileNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="مثال: 0912345678"
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="كلمة المرور"
                  required
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأول</label>
                  <input
                    type="text"
                    value={createUserForm.firstName}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, firstName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="الاسم الأول"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم العائلة</label>
                  <input
                    type="text"
                    value={createUserForm.lastName}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, lastName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="اسم العائلة"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">أو الاسم الكامل</label>
                <input
                  type="text"
                  value={createUserForm.fullName}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, fullName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="الاسم الكامل (اختياري إذا تم إدخال الاسم الأول والعائلة)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {creatingUser ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setSelectedRegionForCreate(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
