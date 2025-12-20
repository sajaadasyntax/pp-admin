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
  sectorNationalLevels?: SectorNationalLevel[];
  _count?: {
    users: number;
    sectorNationalLevels: number;
  };
}

interface SectorNationalLevel {
  id: string;
  name: string;
  code?: string;
  sectorType: string;
  description?: string;
  active: boolean;
  _count?: {
    users: number;
    sectorRegions: number;
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
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submittingUsers, setSubmittingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New user form state
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    mobileNumber: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    fullName: ''
  });
  
  // Sub-levels state
  const [showSubLevels, setShowSubLevels] = useState<string | null>(null);
  const [sectorNationalLevels, setSectorNationalLevels] = useState<SectorNationalLevel[]>([]);
  const [loadingSubLevels, setLoadingSubLevels] = useState(false);

  // Fetch expatriate regions
  const fetchExpatriateRegions = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-regions`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      setRegions(Array.isArray(data) ? data : data.data || []);
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
    
    if (!token) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }
    
    try {
      const url = editingRegion 
        ? `${apiUrl}/expatriate-hierarchy/expatriate-regions/${editingRegion.id}`
        : `${apiUrl}/expatriate-hierarchy/expatriate-regions`;
      
      const response = await fetch(url, {
        method: editingRegion ? 'PUT' : 'POST',
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
    if (!token || !window.confirm('هل أنت متأكد من حذف هذا القطاع؟')) return;

    try {
      const response = await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-regions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  // Get admin name for display
  const getAdminName = (region: ExpatriateRegion): string => {
    if (!region.admin) return 'غير معين';
    
    const { profile, memberDetails, email, mobileNumber } = region.admin;
    
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    
    if (memberDetails?.fullName) {
      return memberDetails.fullName;
    }
    
    return email || mobileNumber;
  };

  // Fetch available admins
  const fetchAvailableAdmins = async (regionId: string) => {
    if (!token) return;
    
    setLoadingAdmins(true);
    try {
      const response = await fetch(`${apiUrl}/users/available-admins?level=expatriateRegion&hierarchyId=${regionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter to show only non-admins OR admins of this level (EXPATRIATE_REGION)
        const filtered = data.filter((admin: AdminUser) => {
          const isNotAdmin = !admin.adminLevel || admin.adminLevel === 'USER';
          const isAdminOfThisLevel = admin.adminLevel === 'EXPATRIATE_REGION';
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
  const handleManageAdmin = (region: ExpatriateRegion) => {
    setSelectedRegion(region);
    setShowAdminModal(true);
    fetchAvailableAdmins(region.id);
  };

  // Assign admin to expatriate region
  const handleAssignAdmin = async (adminId: string | null, isCurrentAdmin: boolean = false) => {
    if (!selectedRegion || !token) return;
    
    // If clicking on current admin, show confirmation dialog
    if (isCurrentAdmin && adminId) {
      const admin = availableAdmins.find(a => a.id === adminId);
      const adminName = admin?.name || 'هذا المسؤول';
      if (!window.confirm(`هل أنت متأكد من إلغاء صلاحية المسؤول "${adminName}"؟`)) {
        return;
      }
      // After confirmation, set adminId to null to remove the admin
      adminId = null;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-regions/${selectedRegion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ adminId }),
      });

      if (response.ok) {
        alert(adminId ? 'تم تعيين المسؤول بنجاح' : 'تم إلغاء تعيين المسؤول بنجاح');
        setShowAdminModal(false);
        fetchExpatriateRegions();
      } else {
        alert('فشل في تعيين المسؤول');
      }
    } catch (error) {
      alert('حدث خطأ أثناء تعيين المسؤول');
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
      const currentUsersResponse = await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-regions/${region.id}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (currentUsersResponse.ok) {
        const usersData = await currentUsersResponse.json();
        const allUsers = Array.isArray(usersData) 
          ? usersData 
          : usersData.data || usersData.users || [];
        
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
      }
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
    setShowAddUserForm(false);
    setNewUserData({ mobileNumber: '', password: '', email: '', firstName: '', lastName: '', fullName: '' });
    fetchUsersForRegion(region);
  };

  // Create new user and add to expatriate region
  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegionForUsers || !token) {
      alert('خطأ في بيانات القطاع');
      return;
    }
    
    if (!newUserData.mobileNumber || !newUserData.password) {
      alert('الرجاء إدخال رقم الهاتف وكلمة المرور');
      return;
    }
    
    setSubmittingUsers(true);
    try {
      // Create the new user with expatriate region
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mobileNumber: newUserData.mobileNumber,
          password: newUserData.password,
          email: newUserData.email || undefined,
          firstName: newUserData.firstName || undefined,
          lastName: newUserData.lastName || undefined,
          fullName: newUserData.fullName || undefined,
          expatriateRegionId: selectedRegionForUsers.id,
          activeHierarchy: 'EXPATRIATE'
        }),
      });

      if (response.ok) {
        alert('تم إنشاء المستخدم وإضافته إلى القطاع بنجاح');
        setNewUserData({ mobileNumber: '', password: '', email: '', firstName: '', lastName: '', fullName: '' });
        setShowAddUserForm(false);
        await fetchUsersForRegion(selectedRegionForUsers);
        fetchExpatriateRegions();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || errorData.message || 'فشل في إنشاء المستخدم');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('حدث خطأ أثناء إنشاء المستخدم');
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
      const response = await fetch(`${apiUrl}/expatriate-hierarchy/users/${userId}/expatriate-region`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ expatriateRegionId: null }),
      });

      if (response.ok) {
        alert('تم إزالة المستخدم من القطاع بنجاح');
        await fetchUsersForRegion(selectedRegionForUsers);
        fetchExpatriateRegions();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'فشل في إزالة المستخدم');
      }
    } catch (error) {
      console.error('Error removing user from region:', error);
      alert('حدث خطأ أثناء إزالة المستخدم');
    } finally {
      setSubmittingUsers(false);
    }
  };

  // Fetch sector national levels for a region
  const fetchSectorNationalLevels = async (regionId: string) => {
    if (!token) return;
    
    setLoadingSubLevels(true);
    try {
      const response = await fetch(`${apiUrl}/sector-hierarchy/sector-national-levels?expatriateRegionId=${regionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSectorNationalLevels(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching sector national levels:', error);
    } finally {
      setLoadingSubLevels(false);
    }
  };

  // Toggle sub-levels display
  const handleToggleSubLevels = (regionId: string) => {
    if (showSubLevels === regionId) {
      setShowSubLevels(null);
      setSectorNationalLevels([]);
    } else {
      setShowSubLevels(regionId);
      fetchSectorNationalLevels(regionId);
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
            <p className="text-sm mt-2">انقر على &quot;إضافة قطاع جديد&quot; لإنشاء قطاع</p>
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

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">المسؤول</div>
                <div className="text-sm font-medium text-gray-900">{getAdminName(region)}</div>
              </div>

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

              {/* Sub-levels (Sector National Levels) */}
              {showSubLevels === region.id && (
                <div className="mb-4 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-cyan-900">مستويات القطاعات</h4>
                    <button
                      onClick={() => handleToggleSubLevels(region.id)}
                      className="text-xs text-cyan-700 hover:text-cyan-900"
                    >
                      إخفاء
                    </button>
                  </div>
                  {loadingSubLevels ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
                    </div>
                  ) : sectorNationalLevels.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">لا توجد مستويات قطاعات</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {sectorNationalLevels.map((level) => (
                        <div key={level.id} className="p-2 bg-white rounded border border-cyan-100 text-sm">
                          <div className="font-medium text-gray-900">{level.name}</div>
                          <div className="text-xs text-gray-500">{level.sectorType}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            المناطق: {level._count?.sectorRegions || 0} • المستخدمين: {level._count?.users || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleManageAdmin(region)}
                  className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-xs font-medium"
                >
                  إدارة المسؤول
                </button>
                <button
                  onClick={() => handleManageUsers(region)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-xs font-medium"
                >
                  إدارة المستخدمين
                </button>
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleToggleSubLevels(region.id)}
                  className="flex-1 px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 text-xs font-medium"
                >
                  {showSubLevels === region.id ? 'إخفاء المستويات' : 'عرض المستويات'}
                </button>
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

      {/* Admin Management Modal */}
      {showAdminModal && selectedRegion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">إدارة مسؤول - {selectedRegion.name}</h2>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedRegion.admin && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">المسؤول الحالي</div>
                  <div className="font-medium">{getAdminName(selectedRegion)}</div>
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
                      const isCurrentAdmin = selectedRegion.adminId === admin.id;
                      const isAdminOfThisLevel = admin.adminLevel === 'EXPATRIATE_REGION';
                      return (
                        <button
                          key={admin.id}
                          onClick={() => handleAssignAdmin(admin.id, isCurrentAdmin)}
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
                    setShowAddUserForm(false);
                    setNewUserData({ mobileNumber: '', password: '', email: '', firstName: '', lastName: '', fullName: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Toggle Tabs */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setShowAddUserForm(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !showAddUserForm
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  المستخدمون الحاليون ({currentUsers.length})
                </button>
                <button
                  onClick={() => setShowAddUserForm(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    showAddUserForm
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  + إضافة مستخدم جديد
                </button>
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                </div>
              ) : showAddUserForm ? (
                /* Add New User Form */
                <form onSubmit={handleCreateNewUser} className="space-y-4">
                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-cyan-800">
                      سيتم إنشاء مستخدم جديد وإضافته مباشرة إلى هذا القطاع
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                      <input
                        type="text"
                        value={newUserData.mobileNumber}
                        onChange={(e) => setNewUserData({ ...newUserData, mobileNumber: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                        placeholder="مثال: 0912345678"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور *</label>
                      <input
                        type="password"
                        value={newUserData.password}
                        onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                        placeholder="كلمة المرور"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                      placeholder="example@email.com"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأول</label>
                      <input
                        type="text"
                        value={newUserData.firstName}
                        onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                        placeholder="الاسم الأول"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">اسم العائلة</label>
                      <input
                        type="text"
                        value={newUserData.lastName}
                        onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                        placeholder="اسم العائلة"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                    <input
                      type="text"
                      value={newUserData.fullName}
                      onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                      placeholder="الاسم الكامل (اختياري)"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={submittingUsers}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                    >
                      {submittingUsers ? 'جاري الإنشاء...' : 'إنشاء وإضافة المستخدم'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddUserForm(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              ) : (
                /* Current Users List */
                <div>
                  {/* Search */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="بحث عن مستخدم..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  
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
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedRegionForUsers(null);
                    setSearchQuery('');
                    setCurrentUsers([]);
                    setShowAddUserForm(false);
                    setNewUserData({ mobileNumber: '', password: '', email: '', firstName: '', lastName: '', fullName: '' });
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
    </div>
  );
}

