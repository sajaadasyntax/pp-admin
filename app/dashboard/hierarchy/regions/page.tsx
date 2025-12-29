"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import Link from 'next/link';

interface Region {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  nationalLevelId?: string;
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
    localities: number;
  };
}

interface NationalLevel {
  id: string;
  name: string;
}

interface AdminUser {
  id: string;
  name: string;
  email?: string;
  mobileNumber: string;
  adminLevel: string;
}

// Sector types and interfaces
type SectorType = 'SOCIAL' | 'ECONOMIC' | 'ORGANIZATIONAL' | 'POLITICAL';

interface Sector {
  id: string;
  name: string;
  sectorType: SectorType;
  description?: string;
  active: boolean;
  _count?: {
    users: number;
  };
}

interface SectorMember {
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
}

const FIXED_SECTOR_TYPES: SectorType[] = ['SOCIAL', 'ECONOMIC', 'ORGANIZATIONAL', 'POLITICAL'];

const sectorTypeLabels: Record<SectorType, string> = {
  SOCIAL: 'الاجتماعي',
  ECONOMIC: 'الاقتصادي',
  ORGANIZATIONAL: 'التنظيمي',
  POLITICAL: 'السياسي'
};

const sectorTypeIcons: Record<SectorType, string> = {
  SOCIAL: '👥',
  ECONOMIC: '💰',
  ORGANIZATIONAL: '🏛️',
  POLITICAL: '⚖️'
};

const sectorTypeColors: Record<SectorType, string> = {
  SOCIAL: 'bg-blue-100 text-blue-800 border-blue-300',
  ECONOMIC: 'bg-green-100 text-green-800 border-green-300',
  ORGANIZATIONAL: 'bg-purple-100 text-purple-800 border-purple-300',
  POLITICAL: 'bg-red-100 text-red-800 border-red-300'
};

// Check if user can manage regions (create/edit/delete)
const FULL_ACCESS_LEVELS = ['ADMIN', 'GENERAL_SECRETARIAT'];

export default function RegionsPage() {
  const { user, token } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [nationalLevels, setNationalLevels] = useState<NationalLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    nationalLevelId: ''
  });
  
  // Admin management state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [availableAdmins, setAvailableAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sector management state
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [selectedRegionForSectors, setSelectedRegionForSectors] = useState<Region | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [sectorMembers, setSectorMembers] = useState<SectorMember[]>([]);
  const [availableSectorUsers, setAvailableSectorUsers] = useState<SectorMember[]>([]);
  const [loadingSectorMembers, setLoadingSectorMembers] = useState(false);
  const [submittingSector, setSubmittingSector] = useState(false);
  const [sectorSearchQuery, setSectorSearchQuery] = useState('');

  // Permission checks based on user's admin level
  const canCreateRegion = FULL_ACCESS_LEVELS.includes(user?.adminLevel || '');
  const canModifyRegion = (region: Region) => {
    if (!user) return false;
    if (FULL_ACCESS_LEVELS.includes(user.adminLevel)) return true;
    // NATIONAL_LEVEL admin can modify regions in their national level
    if (user.adminLevel === 'NATIONAL_LEVEL' && region.nationalLevelId === user.nationalLevelId) return true;
    // REGION admin can only modify their own region
    if (user.adminLevel === 'REGION' && region.id === user.regionId) return true;
    return false;
  };
  const canManageAdmin = (region: Region) => canModifyRegion(region);

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

  const fetchNationalLevels = useCallback(async () => {
    try {
      const data = await apiCall('/hierarchy/national-levels');
      setNationalLevels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching national levels:', error);
    }
  }, [apiCall]);

  const fetchRegions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall('/hierarchy/regions');
      setRegions(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchNationalLevels();
    fetchRegions();
  }, [fetchNationalLevels, fetchRegions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiCall(`/hierarchy/regions/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await apiCall('/hierarchy/regions', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', code: '', description: '', nationalLevelId: '' });
      fetchRegions();
    } catch (error) {
      alert('فشل في حفظ البيانات');
    }
  };

  const handleEdit = (region: Region) => {
    setEditing(region);
    setFormData({
      name: region.name,
      code: region.code || '',
      description: region.description || '',
      nationalLevelId: region.nationalLevelId || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الولاية "${name}"؟ سيتم إرسال طلب الحذف للأمين العام للموافقة.`)) {
      return;
    }

    try {
      await apiCall('/deletion-requests', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'REGION',
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

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiCall(`/hierarchy/regions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentStatus }),
      });
      fetchRegions();
    } catch (error) {
      alert('فشل في تحديث الحالة');
    }
  };

  // Fetch available admins
  const fetchAvailableAdmins = async (regionId: string) => {
    if (!token) return;
    
    setLoadingAdmins(true);
    try {
      const response = await fetch(`${apiUrl}/users/available-admins?level=region&hierarchyId=${regionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter to show only non-admins OR admins of this level (REGION)
        const filtered = data.filter((admin: AdminUser) => {
          const isNotAdmin = !admin.adminLevel || admin.adminLevel === 'USER';
          const isAdminOfThisLevel = admin.adminLevel === 'REGION';
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
  const handleManageAdmin = (region: Region) => {
    setSelectedRegion(region);
    setShowAdminModal(true);
    fetchAvailableAdmins(region.id);
  };

  // Assign admin to region
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
      const response = await fetch(`${apiUrl}/hierarchy/regions/${selectedRegion.id}`, {
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
        fetchRegions();
      } else {
        alert('فشل في تعيين المسؤول');
      }
    } catch (error) {
      alert('حدث خطأ أثناء تعيين المسؤول');
    } finally {
      setSubmitting(false);
    }
  };

  // Get admin name for display
  const getAdminName = (region: Region): string => {
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

  // ==================== SECTOR MANAGEMENT FUNCTIONS ====================

  const fetchSectorsForRegion = async (region: Region) => {
    if (!token) return;
    
    setLoadingSectors(true);
    try {
      const response = await fetch(`${apiUrl}/sector-hierarchy/sector-regions?originalOnly=true`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allSectors = data.data || [];
        const regionSectors = allSectors.filter((sector: Sector) => {
          if (!sector.description) return false;
          // Support both JSON format and legacy format
          try {
            // Try parsing as JSON first (new format)
            const metadata = JSON.parse(sector.description);
            if (metadata.sourceEntityId === region.id && metadata.sourceEntityType === 'region') {
              return true;
            }
          } catch {
            // Fallback to legacy format check
            if (sector.description.includes(`SOURCE:region:${region.id}`)) {
              return true;
            }
          }
          return false;
        });
        setSectors(regionSectors);
      }
    } catch (error) {
      console.error('Error fetching sectors:', error);
    } finally {
      setLoadingSectors(false);
    }
  };

  const fetchSectorMembers = async (sectorId: string) => {
    if (!token) return;

    setLoadingSectorMembers(true);
    try {
      const response = await fetch(`${apiUrl}/sector-hierarchy/members/region/${sectorId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSectorMembers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching sector members:', error);
    } finally {
      setLoadingSectorMembers(false);
    }
  };

  const fetchAvailableSectorUsers = async (sectorId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/sector-hierarchy/available-users/region/${sectorId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableSectorUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleManageSectors = (region: Region) => {
    setSelectedRegionForSectors(region);
    setShowSectorModal(true);
    setSelectedSector(null);
    setSectorMembers([]);
    setAvailableSectorUsers([]);
    setSectorSearchQuery('');
    fetchSectorsForRegion(region);
  };

  const handleSelectSector = (sector: Sector) => {
    setSelectedSector(sector);
    setSectorSearchQuery('');
    fetchSectorMembers(sector.id);
    fetchAvailableSectorUsers(sector.id);
  };

  const handleAddUserToSector = async (userId: string) => {
    if (!token || !selectedSector) return;

    setSubmittingSector(true);
    try {
      const response = await fetch(`${apiUrl}/sector-hierarchy/members/region/${selectedSector.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        fetchSectorMembers(selectedSector.id);
        fetchAvailableSectorUsers(selectedSector.id);
      } else {
        alert('فشل في إضافة العضو');
      }
    } catch (error) {
      alert('حدث خطأ أثناء إضافة العضو');
    } finally {
      setSubmittingSector(false);
    }
  };

  const handleRemoveUserFromSector = async (userId: string) => {
    if (!token || !selectedSector) return;

    const member = sectorMembers.find(m => m.id === userId);
    const memberName = getMemberName(member);
    
    if (!window.confirm(`هل أنت متأكد من إزالة "${memberName}" من هذا القطاع؟`)) {
      return;
    }

    setSubmittingSector(true);
    try {
      const response = await fetch(`${apiUrl}/sector-hierarchy/members/region/${selectedSector.id}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchSectorMembers(selectedSector.id);
        fetchAvailableSectorUsers(selectedSector.id);
      } else {
        alert('فشل في إزالة العضو');
      }
    } catch (error) {
      alert('حدث خطأ أثناء إزالة العضو');
    } finally {
      setSubmittingSector(false);
    }
  };

  const getMemberName = (member?: SectorMember): string => {
    if (!member) return 'غير معروف';
    
    if (member.profile?.firstName && member.profile?.lastName) {
      return `${member.profile.firstName} ${member.profile.lastName}`;
    }
    
    if (member.memberDetails?.fullName) {
      return member.memberDetails.fullName;
    }
    
    return member.email || member.mobileNumber;
  };

  const getSectorByType = (type: SectorType): Sector | undefined => {
    return sectors.find(s => s.sectorType === type);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الولايات</h1>
          <p className="text-gray-600 mt-1">إدارة الولايات والمناطق</p>
        </div>
        {canCreateRegion && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setFormData({ name: '', code: '', description: '', nationalLevelId: '' });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + إضافة ولاية
          </button>
        )}
      </div>

      {/* Form Panel */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editing ? 'تعديل الولاية' : 'إضافة ولاية جديدة'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المستوى القومي *</label>
              <select
                value={formData.nationalLevelId}
                onChange={(e) => setFormData({ ...formData, nationalLevelId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">اختر المستوى القومي</option>
                {nationalLevels.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
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
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            <div className="text-6xl mb-4">🏛️</div>
            <p className="text-gray-600">لا توجد ولايات</p>
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
                {canModifyRegion(region) ? (
                  <button
                    onClick={() => handleToggleStatus(region.id, region.active)}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      region.active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {region.active ? 'فعال' : 'غير فعال'}
                  </button>
                ) : (
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    region.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {region.active ? 'فعال' : 'غير فعال'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <span>المحليات: <strong>{region._count?.localities || 0}</strong></span>
                <span>المستخدمين: <strong>{region._count?.users || 0}</strong></span>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">المسؤول</div>
                <div className="text-sm font-medium text-gray-900">{getAdminName(region)}</div>
              </div>

              <div className="flex gap-2 mb-2">
                {canManageAdmin(region) && (
                  <button
                    onClick={() => handleManageAdmin(region)}
                    className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-xs font-medium"
                  >
                    إدارة المسؤول
                  </button>
                )}
                <Link
                  href={`/dashboard/hierarchy/localities?region=${region.id}`}
                  className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-xs font-medium text-center"
                >
                  المحليات
                </Link>
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleManageSectors(region)}
                  className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-xs font-medium"
                >
                  🏛️ إدارة القطاعات
                </button>
              </div>
              {canModifyRegion(region) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(region)}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(region.id, region.name)}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
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
                      const isAdminOfThisLevel = admin.adminLevel === 'REGION';
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

      {/* Sector Management Modal */}
      {showSectorModal && selectedRegionForSectors && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">إدارة القطاعات - {selectedRegionForSectors.name}</h2>
                <button
                  onClick={() => {
                    setShowSectorModal(false);
                    setSelectedRegionForSectors(null);
                    setSelectedSector(null);
                    setSectors([]);
                    setSectorMembers([]);
                    setAvailableSectorUsers([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingSectors ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700 mb-2">القطاعات الأربعة</h3>
                    {FIXED_SECTOR_TYPES.map((type) => {
                      const sector = getSectorByType(type);
                      const isSelected = selectedSector?.sectorType === type;
                      
                      return (
                        <button
                          key={type}
                          onClick={() => sector && handleSelectSector(sector)}
                          disabled={!sector}
                          className={`w-full text-right p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50'
                              : sector
                                ? `${sectorTypeColors[type]} hover:shadow-md cursor-pointer`
                                : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{sectorTypeIcons[type]}</span>
                            <div className="flex-1">
                              <div className="font-semibold">{sectorTypeLabels[type]}</div>
                              <div className="text-xs text-gray-500">
                                {sector ? `${sector._count?.users || 0} أعضاء` : 'غير مفعل'}
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-indigo-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    
                    {sectors.length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        <p>لم يتم إنشاء قطاعات لهذه الولاية بعد</p>
                        <p className="text-xs mt-1">يرجى تشغيل سكربت البذر لإنشاء القطاعات</p>
                      </div>
                    )}
                  </div>

                  <div className="border-r pr-4">
                    {selectedSector ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-700">
                            أعضاء {sectorTypeLabels[selectedSector.sectorType]}
                          </h3>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                            {sectorMembers.length} عضو
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-600 mb-2">الأعضاء الحاليون</div>
                          {loadingSectorMembers ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                            </div>
                          ) : sectorMembers.length === 0 ? (
                            <p className="text-sm text-gray-500 py-2">لا يوجد أعضاء في هذا القطاع</p>
                          ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {sectorMembers.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                >
                                  <div>
                                    <div className="font-medium text-sm">{getMemberName(member)}</div>
                                    <div className="text-xs text-gray-500">{member.mobileNumber}</div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveUserFromSector(member.id)}
                                    disabled={submittingSector}
                                    className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"
                                  >
                                    إزالة
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-2">إضافة أعضاء</div>
                          <input
                            type="text"
                            placeholder="بحث عن مستخدم..."
                            value={sectorSearchQuery}
                            onChange={(e) => setSectorSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                          />
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {availableSectorUsers
                              .filter(u => 
                                !sectorSearchQuery || 
                                getMemberName(u).toLowerCase().includes(sectorSearchQuery.toLowerCase()) ||
                                u.mobileNumber.includes(sectorSearchQuery)
                              )
                              .slice(0, 10)
                              .map((user) => (
                                <button
                                  key={user.id}
                                  onClick={() => handleAddUserToSector(user.id)}
                                  disabled={submittingSector}
                                  className="w-full flex items-center justify-between p-2 bg-white border rounded-lg hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50"
                                >
                                  <div className="text-right">
                                    <div className="font-medium text-sm">{getMemberName(user)}</div>
                                    <div className="text-xs text-gray-500">{user.mobileNumber}</div>
                                  </div>
                                  <span className="text-indigo-600 text-xs">+ إضافة</span>
                                </button>
                              ))}
                            {availableSectorUsers.length === 0 && (
                              <p className="text-sm text-gray-500 py-2">لا يوجد مستخدمون متاحون</p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <span className="text-4xl block mb-2">👈</span>
                          <p>اختر قطاعاً لإدارة أعضائه</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowSectorModal(false);
                    setSelectedRegionForSectors(null);
                    setSelectedSector(null);
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
