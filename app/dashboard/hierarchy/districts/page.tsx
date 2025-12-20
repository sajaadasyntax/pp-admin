"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Region {
  id: string;
  name: string;
}

interface Locality {
  id: string;
  name: string;
  regionId: string;
  region?: Region;
}

interface Region {
  id: string;
  name: string;
  nationalLevelId?: string;
}

interface AdminUnit {
  id: string;
  name: string;
  localityId: string;
  locality?: Locality;
}

interface DistrictUser {
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

interface District {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  adminUnitId: string;
  adminId?: string;
  adminUnit?: AdminUnit;
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
  users?: DistrictUser[];
  _count?: {
    users: number;
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
  districtId?: string;
  district?: {
    id: string;
    name: string;
  };
}

// Check if user can manage districts
const FULL_ACCESS_LEVELS = ['ADMIN', 'GENERAL_SECRETARIAT'];

export default function DistrictsPage() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const [districts, setDistricts] = useState<District[]>([]);
  const [adminUnits, setAdminUnits] = useState<AdminUnit[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedAdminUnit, setSelectedAdminUnit] = useState<string | null>(
    searchParams.get('adminUnit') || null
  );
  const [selectedLocality, setSelectedLocality] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<District | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    adminUnitId: ''
  });
  
  // Admin management state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [availableAdmins, setAvailableAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // User management state
  const [showUserModal, setShowUserModal] = useState(false);

  // Permission checks based on user's admin level
  const canCreateDistrict = () => {
    if (!user) return false;
    if (FULL_ACCESS_LEVELS.includes(user.adminLevel)) return true;
    if (['NATIONAL_LEVEL', 'REGION', 'LOCALITY', 'ADMIN_UNIT'].includes(user.adminLevel)) return true;
    return false;
  };
  
  const canModifyDistrict = (district: District) => {
    if (!user) return false;
    if (FULL_ACCESS_LEVELS.includes(user.adminLevel)) return true;
    // NATIONAL_LEVEL admins: Verify the district's region belongs to their national level
    const adminLevel = user.adminLevel as string;
    if (adminLevel === 'NATIONAL_LEVEL' && user.nationalLevelId) {
      return district.adminUnit?.locality?.region?.nationalLevelId === user.nationalLevelId;
    }
    if (user.adminLevel === 'REGION' && district.adminUnit?.locality?.regionId === user.regionId) return true;
    if (user.adminLevel === 'LOCALITY' && district.adminUnit?.localityId === user.localityId) return true;
    if (user.adminLevel === 'ADMIN_UNIT' && district.adminUnitId === user.adminUnitId) return true;
    if (user.adminLevel === 'DISTRICT' && district.id === user.districtId) return true;
    return false;
  };
  
  const canManageAdmin = (district: District) => canModifyDistrict(district);
  const [selectedDistrictForUsers, setSelectedDistrictForUsers] = useState<District | null>(null);
  const [districtHierarchy, setDistrictHierarchy] = useState<{regionId: string, localityId: string, adminUnitId: string} | null>(null);
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
    try {
      const data = await apiCall('/hierarchy/regions');
      setRegions(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [apiCall]);

  const fetchLocalities = useCallback(async (regionId: string) => {
    try {
      const data = await apiCall(`/hierarchy/regions/${regionId}/localities`);
      setLocalities(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [apiCall]);

  const fetchAdminUnits = useCallback(async (localityId: string) => {
    try {
      const data = await apiCall(`/hierarchy/localities/${localityId}/admin-units`);
      setAdminUnits(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [apiCall]);

  const fetchDistricts = useCallback(async (adminUnitId: string) => {
    try {
      setLoading(true);
      const data = await apiCall(`/hierarchy/admin-units/${adminUnitId}/districts`);
      setDistricts(data);
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
    } else {
      setLocalities([]);
      setAdminUnits([]);
    }
  }, [selectedRegion, fetchLocalities]);

  useEffect(() => {
    if (selectedLocality) {
      fetchAdminUnits(selectedLocality);
    } else {
      setAdminUnits([]);
    }
  }, [selectedLocality, fetchAdminUnits]);

  useEffect(() => {
    if (selectedAdminUnit) {
      fetchDistricts(selectedAdminUnit);
      setFormData(prev => ({ ...prev, adminUnitId: selectedAdminUnit }));
    } else {
      setDistricts([]);
    }
  }, [selectedAdminUnit, fetchDistricts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.adminUnitId) {
      alert('الرجاء إدخال الاسم واختيار الوحدة الإدارية');
      return;
    }

    try {
      if (editing) {
        await apiCall(`/hierarchy/districts/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name.trim(),
            code: formData.code.trim(),
            description: formData.description.trim()
          }),
        });
      } else {
        await apiCall(`/hierarchy/admin-units/${formData.adminUnitId}/districts`, {
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
      setFormData({ name: '', code: '', description: '', adminUnitId: selectedAdminUnit || '' });
      if (selectedAdminUnit) fetchDistricts(selectedAdminUnit);
    } catch (error) {
      alert('فشل في حفظ البيانات');
    }
  };

  const handleEdit = (district: District) => {
    setEditing(district);
    setFormData({
      name: district.name,
      code: district.code || '',
      description: district.description || '',
      adminUnitId: district.adminUnitId
    });
    setShowForm(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiCall(`/hierarchy/districts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentStatus }),
      });
      if (selectedAdminUnit) fetchDistricts(selectedAdminUnit);
    } catch (error) {
      alert('فشل في تحديث الحالة');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الحي "${name}"؟ سيتم إرسال طلب الحذف للأمين العام للموافقة.`)) {
      return;
    }

    try {
      await apiCall('/deletion-requests', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'DISTRICT',
          entityId: id,
          entityName: name,
          reason: 'طلب حذف من المسؤول'
        }),
      });
      alert('تم إرسال طلب الحذف بنجاح. سيتم مراجعته من قبل الأمين العام.');
    } catch (error) {
      alert('فشل في إرسال طلب الحذف');
    }
  };

  const getDistrictAdminName = (district: District): string => {
    if (!district.admin) return 'غير معين';
    const { profile, memberDetails, email, mobileNumber } = district.admin;
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (memberDetails?.fullName) {
      return memberDetails.fullName;
    }
    return email || mobileNumber;
  };

  const getDistrictUserName = (user: DistrictUser): string => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    if (user.memberDetails?.fullName) {
      return user.memberDetails.fullName;
    }
    return user.email || user.mobileNumber;
  };

  // Fetch available admins
  const fetchAvailableAdmins = async (districtId: string) => {
    if (!token) return;
    
    setLoadingAdmins(true);
    try {
      const response = await fetch(`${apiUrl}/users/available-admins?level=district&hierarchyId=${districtId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter to show only non-admins OR admins of this level (DISTRICT)
        const filtered = data.filter((admin: AdminUser) => {
          const isNotAdmin = !admin.adminLevel || admin.adminLevel === 'USER';
          const isAdminOfThisLevel = admin.adminLevel === 'DISTRICT';
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
  const handleManageAdmin = (district: District) => {
    setSelectedDistrict(district);
    setShowAdminModal(true);
    fetchAvailableAdmins(district.id);
  };

  // Assign admin to district
  const handleAssignAdmin = async (adminId: string | null, isCurrentAdmin: boolean = false) => {
    if (!selectedDistrict || !token) return;
    
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
      const response = await fetch(`${apiUrl}/hierarchy/districts/${selectedDistrict.id}`, {
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
        if (selectedAdminUnit) fetchDistricts(selectedAdminUnit);
      } else {
        alert('فشل في تعيين المسؤول');
      }
    } catch (error) {
      alert('حدث خطأ أثناء تعيين المسؤول');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch users for district management using hierarchical endpoint
  const fetchUsersForDistrict = async (district: District) => {
    if (!token || !district.adminUnitId) return;
    
    setLoadingUsers(true);
    try {
      // Use hierarchical users endpoint to get users in this specific district
      const districtUsersResponse = await fetch(`${apiUrl}/hierarchical-users/users/districts/${district.id}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (districtUsersResponse.ok) {
        const districtUsersData = await districtUsersResponse.json();
        const districtUsers = (Array.isArray(districtUsersData) ? districtUsersData : districtUsersData?.users || [])
          .map((u: any) => ({
            id: u.id,
            name: u.profile?.firstName && u.profile?.lastName
              ? `${u.profile.firstName} ${u.profile.lastName}`
              : u.memberDetails?.fullName || u.email || u.mobileNumber,
            email: u.email,
            mobileNumber: u.mobileNumber,
            adminLevel: u.adminLevel,
            districtId: u.districtId,
            district: u.district
          }));
        
        setCurrentUsers(districtUsers);
      } else if (districtUsersResponse.status === 403) {
        console.warn('No permission to view district users');
        setCurrentUsers([]);
      } else if (districtUsersResponse.status === 404) {
        console.warn('District users endpoint not found or district does not exist');
        setCurrentUsers([]);
      } else {
        console.error('Failed to fetch district users:', districtUsersResponse.status, districtUsersResponse.statusText);
        setCurrentUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setCurrentUsers([]);
      alert('فشل في تحميل المستخدمين');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Open user management modal
  const handleManageUsers = async (district: District) => {
    setSelectedDistrictForUsers(district);
    setShowUserModal(true);
    setSearchQuery('');
    setShowAddUserForm(false);
    setNewUserData({ mobileNumber: '', password: '', email: '', firstName: '', lastName: '', fullName: '' });
    
    // Fetch hierarchy info for the district
    try {
      const adminUnit = adminUnits.find(au => au.id === district.adminUnitId);
      if (adminUnit && adminUnit.localityId) {
        const locality = localities.find(l => l.id === adminUnit.localityId);
        if (locality && locality.regionId) {
          setDistrictHierarchy({
            regionId: locality.regionId,
            localityId: adminUnit.localityId,
            adminUnitId: district.adminUnitId
          });
        } else {
          // Fetch locality if not in state
          const localityData = await apiCall(`/hierarchy/localities/${adminUnit.localityId}`);
          setDistrictHierarchy({
            regionId: localityData.regionId,
            localityId: adminUnit.localityId,
            adminUnitId: district.adminUnitId
          });
        }
      } else {
        // Fetch admin unit if not in state
        const adminUnitData = await apiCall(`/hierarchy/admin-units/${district.adminUnitId}`);
        const localityData = await apiCall(`/hierarchy/localities/${adminUnitData.localityId}`);
        setDistrictHierarchy({
          regionId: localityData.regionId,
          localityId: adminUnitData.localityId,
          adminUnitId: district.adminUnitId
        });
      }
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
    }
    
    fetchUsersForDistrict(district);
  };

  // Create new user and add to district
  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistrictForUsers || !token || !districtHierarchy) {
      alert('خطأ في بيانات الحي');
      return;
    }
    
    if (!newUserData.mobileNumber || !newUserData.password) {
      alert('الرجاء إدخال رقم الهاتف وكلمة المرور');
      return;
    }
    
    setSubmittingUsers(true);
    try {
      // Create the new user with hierarchy data
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
          regionId: districtHierarchy.regionId,
          localityId: districtHierarchy.localityId,
          adminUnitId: districtHierarchy.adminUnitId,
          districtId: selectedDistrictForUsers.id
        }),
      });

      if (response.ok) {
        alert('تم إنشاء المستخدم وإضافته إلى الحي بنجاح');
        setNewUserData({ mobileNumber: '', password: '', email: '', firstName: '', lastName: '', fullName: '' });
        setShowAddUserForm(false);
        await fetchUsersForDistrict(selectedDistrictForUsers);
        if (selectedAdminUnit) fetchDistricts(selectedAdminUnit);
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

  // Remove user from district
  const handleRemoveUserFromDistrict = async (userId: string) => {
    if (!selectedDistrictForUsers || !token) return;
    
    const user = currentUsers.find(u => u.id === userId);
    const userName = user?.name || 'هذا المستخدم';
    
    if (!window.confirm(`هل أنت متأكد من إزالة "${userName}" من هذا الحي؟`)) {
      return;
    }
    
    setSubmittingUsers(true);
    try {
      // Set districtId to null to remove from district
      const response = await fetch(`${apiUrl}/users/${userId}/hierarchy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          hierarchyLevel: 'none',
          districtId: null
        }),
      });

      if (response.ok) {
        alert('تم إزالة المستخدم من الحي بنجاح');
        await fetchUsersForDistrict(selectedDistrictForUsers);
        if (selectedAdminUnit) fetchDistricts(selectedAdminUnit);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'فشل في إزالة المستخدم');
      }
    } catch (error) {
      console.error('Error removing user from district:', error);
      alert('حدث خطأ أثناء إزالة المستخدم');
    } finally {
      setSubmittingUsers(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الأحياء</h1>
          <p className="text-gray-600 mt-1">إدارة الأحياء والمناطق السكنية</p>
        </div>
        <button
          onClick={() => {
            if (!selectedAdminUnit) {
              alert('الرجاء اختيار وحدة إدارية أولاً');
              return;
            }
            setShowForm(true);
            setEditing(null);
            setFormData({ name: '', code: '', description: '', adminUnitId: selectedAdminUnit });
          }}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
          disabled={!selectedAdminUnit}
        >
          + إضافة حي
        </button>
      </div>

      {/* Navigation Selectors */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-3">اختر الولاية</h2>
          <div className="flex flex-wrap gap-2">
            {regions.map(region => (
              <button
                key={region.id}
                onClick={() => {
                  setSelectedRegion(region.id);
                  setSelectedLocality(null);
                  setSelectedAdminUnit(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedRegion === region.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>
        </div>
        {selectedRegion && (
          <div>
            <h2 className="text-lg font-semibold mb-3">اختر المحلية</h2>
            <div className="flex flex-wrap gap-2">
              {localities.map(locality => (
                <button
                  key={locality.id}
                  onClick={() => {
                    setSelectedLocality(locality.id);
                    setSelectedAdminUnit(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedLocality === locality.id
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {locality.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {selectedLocality && (
          <div>
            <h2 className="text-lg font-semibold mb-3">اختر الوحدة الإدارية</h2>
            <div className="flex flex-wrap gap-2">
              {adminUnits.map(adminUnit => (
                <button
                  key={adminUnit.id}
                  onClick={() => setSelectedAdminUnit(adminUnit.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedAdminUnit === adminUnit.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {adminUnit.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form Panel */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editing ? 'تعديل الحي' : 'إضافة حي جديد'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة الإدارية *</label>
              <select
                value={formData.adminUnitId}
                onChange={(e) => setFormData({ ...formData, adminUnitId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">اختر الوحدة الإدارية</option>
                {adminUnits.map(adminUnit => (
                  <option key={adminUnit.id} value={adminUnit.id}>{adminUnit.name}</option>
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكود</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
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

      {/* Districts List */}
      {!selectedAdminUnit ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-gray-600">الرجاء اختيار وحدة إدارية لعرض الأحياء</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : districts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-gray-600">لا توجد أحياء في هذه الوحدة الإدارية</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {districts.map((district) => (
            <div
              key={district.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{district.name}</h3>
                  {district.code && (
                    <span className="text-sm text-gray-500">الكود: {district.code}</span>
                  )}
                  {district.description && (
                    <p className="text-sm text-gray-600 mt-2">{district.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleStatus(district.id, district.active)}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    district.active
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {district.active ? 'فعال' : 'غير فعال'}
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <span>المستخدمين: <strong>{district._count?.users || 0}</strong></span>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">المسؤول</div>
                <div className="text-sm font-medium text-gray-900">{getDistrictAdminName(district)}</div>
              </div>

              {district.users && district.users.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-800">المستخدمون في هذا الحي</h4>
                    <span className="text-xs text-gray-500">{district.users.length}</span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {district.users.map((user) => (
                      <div key={user.id} className="border border-gray-100 rounded-lg p-2 text-sm flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{getDistrictUserName(user)}</div>
                          <div className="text-xs text-gray-500">{user.mobileNumber}</div>
                        </div>
                        {user.adminLevel && user.adminLevel !== 'USER' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                            {user.adminLevel}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleManageAdmin(district)}
                  className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-xs font-medium"
                >
                  إدارة المسؤول
                </button>
                <button
                  onClick={() => handleManageUsers(district)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-xs font-medium"
                >
                  إدارة المستخدمين
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(district)}
                  className="flex-1 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-sm font-medium"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(district.id, district.name)}
                  className="flex-1 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
                >
                  حذف
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

      {/* Admin Management Modal */}
      {showAdminModal && selectedDistrict && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">إدارة مسؤول - {selectedDistrict.name}</h2>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedDistrict.admin && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">المسؤول الحالي</div>
                  <div className="font-medium">{getDistrictAdminName(selectedDistrict)}</div>
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
                      const isCurrentAdmin = selectedDistrict.adminId === admin.id;
                      const isAdminOfThisLevel = admin.adminLevel === 'DISTRICT';
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
      {showUserModal && selectedDistrictForUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">إدارة المستخدمين - {selectedDistrictForUsers.name}</h2>
                <button
                  onClick={() => setShowUserModal(false)}
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
                      ? 'bg-blue-600 text-white'
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : showAddUserForm ? (
                /* Add New User Form */
                <form onSubmit={handleCreateNewUser} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      سيتم إنشاء مستخدم جديد وإضافته مباشرة إلى هذا الحي
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                      <input
                        type="text"
                        value={newUserData.mobileNumber}
                        onChange={(e) => setNewUserData({ ...newUserData, mobileNumber: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="الاسم الأول"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">اسم العائلة</label>
                      <input
                        type="text"
                        value={newUserData.lastName}
                        onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            onClick={() => handleRemoveUserFromDistrict(user.id)}
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
                      <p className="text-sm text-gray-500 py-4 text-center">لا يوجد مستخدمون في هذا الحي</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedDistrictForUsers(null);
                    setDistrictHierarchy(null);
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
