"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import { useSearchParams } from 'next/navigation';

type SectorType = 'SOCIAL' | 'ECONOMIC' | 'ORGANIZATIONAL' | 'POLITICAL';
type SectorLevel = 'national' | 'region' | 'locality' | 'adminUnit' | 'district';
type HierarchyType = 'original' | 'expatriates';

// Fixed 4 sectors
const FIXED_SECTOR_TYPES: SectorType[] = ['SOCIAL', 'ECONOMIC', 'ORGANIZATIONAL', 'POLITICAL'];

interface Sector {
  id: string;
  name: string;
  code?: string;
  sectorType: SectorType;
  description?: string;
  active: boolean;
  expatriateRegionId?: string;
  expatriateRegion?: {
    id: string;
    name: string;
  };
  _count?: {
    users: number;
  };
}

interface ExpatriateRegion {
  id: string;
  name: string;
}

interface SectorMember {
  id: string;
  email?: string;
  mobileNumber: string;
  adminLevel: string;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
  memberDetails?: {
    fullName?: string;
  };
}

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

const sectorTypeBgColors: Record<SectorType, string> = {
  SOCIAL: 'bg-blue-50 border-blue-200',
  ECONOMIC: 'bg-green-50 border-green-200',
  ORGANIZATIONAL: 'bg-purple-50 border-purple-200',
  POLITICAL: 'bg-red-50 border-red-200'
};

const levelLabels: Record<SectorLevel, string> = {
  national: 'المستوى القومي',
  region: 'الولاية',
  locality: 'المحلية',
  adminUnit: 'الوحدة الإدارية',
  district: 'الحي'
};

const levelEndpoints: Record<SectorLevel, string> = {
  national: 'sector-national-levels',
  region: 'sector-regions',
  locality: 'sector-localities',
  adminUnit: 'sector-admin-units',
  district: 'sector-districts'
};

// Levels available for each hierarchy type
// Original/Geographic hierarchy: Region → Locality → AdminUnit → District (NO national level)
// Expatriate hierarchy: National → Region → Locality → AdminUnit → District
const levelsForOriginal: SectorLevel[] = ['region', 'locality', 'adminUnit', 'district'];
const levelsForExpatriate: SectorLevel[] = ['national', 'region', 'locality', 'adminUnit', 'district'];

export default function SectorsPage() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  
  // Get filter parameters from URL
  const urlLevel = searchParams.get('level') as SectorLevel | null;
  const urlEntityId = searchParams.get('entityId');
  const urlEntityName = searchParams.get('entityName');
  
  const [hierarchyType, setHierarchyType] = useState<HierarchyType>(
    (searchParams.get('hierarchy') as HierarchyType) || 'original'
  );
  // Default to URL level if provided, otherwise 'region' for original hierarchy
  const [selectedLevel, setSelectedLevel] = useState<SectorLevel>(urlLevel || 'region');
  const [selectedExpatriateRegion, setSelectedExpatriateRegion] = useState<string | null>(
    searchParams.get('region') || null
  );
  // Entity filter state
  const [filterEntityId, setFilterEntityId] = useState<string | null>(urlEntityId || null);
  const [filterEntityName, setFilterEntityName] = useState<string | null>(urlEntityName || null);
  
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [expatriateRegions, setExpatriateRegions] = useState<ExpatriateRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSectorType, setEditingSectorType] = useState<SectorType | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    active: true
  });

  // Member management state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [sectorMembers, setSectorMembers] = useState<SectorMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<SectorMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddMemberPanel, setShowAddMemberPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchExpatriateRegions = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-regions`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExpatriateRegions(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchSectors = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const endpoint = levelEndpoints[selectedLevel];
      
      let url = `${apiUrl}/sector-hierarchy/${endpoint}`;
      if (hierarchyType === 'expatriates' && selectedExpatriateRegion) {
        url += `?expatriateRegionId=${selectedExpatriateRegion}`;
      } else if (hierarchyType === 'expatriates') {
        url += `?expatriateOnly=true`;
      } else {
        url += `?originalOnly=true`;
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        let fetchedSectors = data.data || [];
        
        // Filter sectors by entity ID if provided (from hierarchy card navigation)
        if (filterEntityId && hierarchyType === 'original') {
          // Sectors are linked to hierarchy entities through the description metadata
          // Format: SOURCE:level:entityId (e.g., SOURCE:region:uuid-here)
          fetchedSectors = fetchedSectors.filter((sector: Sector) => {
            if (!sector.description) return false;
            const expectedPattern = `SOURCE:${selectedLevel}:${filterEntityId}`;
            return sector.description.includes(expectedPattern);
          });
        }
        
        setSectors(fetchedSectors);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, hierarchyType, selectedExpatriateRegion, filterEntityId, token]);

  const fetchSectorMembers = async (sectorId: string) => {
    if (!token) return;

    try {
      setLoadingMembers(true);
      const response = await fetch(`${apiUrl}/sector-hierarchy/members/${selectedLevel}/${sectorId}`, {
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
      console.error('Error fetching members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchAvailableUsers = async (sectorId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/sector-hierarchy/available-users/${selectedLevel}/${sectorId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!token || !selectedSector) return;

    try {
      const response = await fetch(`${apiUrl}/sector-hierarchy/members/${selectedLevel}/${selectedSector.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Refresh members and available users
        fetchSectorMembers(selectedSector.id);
        fetchAvailableUsers(selectedSector.id);
        fetchSectors(); // Refresh sector count
      } else {
        alert('فشل في إضافة العضو');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('فشل في إضافة العضو');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!token || !selectedSector) return;
    if (!window.confirm('هل أنت متأكد من إزالة هذا العضو من القطاع؟')) return;

    try {
      const response = await fetch(`${apiUrl}/sector-hierarchy/members/${selectedLevel}/${selectedSector.id}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh members and available users
        fetchSectorMembers(selectedSector.id);
        fetchAvailableUsers(selectedSector.id);
        fetchSectors(); // Refresh sector count
      } else {
        alert('فشل في إزالة العضو');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('فشل في إزالة العضو');
    }
  };

  const openMembersModal = (sector: Sector) => {
    setSelectedSector(sector);
    setShowMembersModal(true);
    setShowAddMemberPanel(false);
    setSearchQuery('');
    fetchSectorMembers(sector.id);
    fetchAvailableUsers(sector.id);
  };

  const closeMembersModal = () => {
    setShowMembersModal(false);
    setSelectedSector(null);
    setSectorMembers([]);
    setAvailableUsers([]);
    setShowAddMemberPanel(false);
    setSearchQuery('');
  };

  const getMemberDisplayName = (member: SectorMember): string => {
    if (member.memberDetails?.fullName) return member.memberDetails.fullName;
    if (member.profile?.firstName || member.profile?.lastName) {
      return `${member.profile.firstName || ''} ${member.profile.lastName || ''}`.trim();
    }
    return member.mobileNumber;
  };

  const filteredAvailableUsers = availableUsers.filter(user => {
    if (!searchQuery) return true;
    const name = getMemberDisplayName(user).toLowerCase();
    const mobile = user.mobileNumber.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || mobile.includes(query) || email.includes(query);
  });

  useEffect(() => {
    if (hierarchyType === 'expatriates') {
      fetchExpatriateRegions();
    }
  }, [hierarchyType, token]);

  useEffect(() => {
    fetchSectors();
  }, [fetchSectors]);

  const handleEditSector = (sectorType: SectorType) => {
    const existingSector = getSectorByType(sectorType);
    setEditingSectorType(sectorType);
    setFormData({
      description: existingSector?.description || '',
      active: existingSector?.active ?? true
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !editingSectorType) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }

    try {
      const existingSector = getSectorByType(editingSectorType);
      const endpoint = levelEndpoints[selectedLevel];
      
      if (existingSector) {
        // Update existing sector
        const response = await fetch(`${apiUrl}/sector-hierarchy/${endpoint}/${existingSector.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: formData.description,
            active: formData.active
          }),
        });

        if (response.ok) {
          setEditingSectorType(null);
          setFormData({ description: '', active: true });
          fetchSectors();
        } else {
          alert('فشل في حفظ البيانات');
        }
      }
    } catch (error) {
      alert('فشل في حفظ البيانات');
    }
  };

  const getSectorByType = (type: SectorType): Sector | undefined => {
    return sectors.find(s => s.sectorType === type);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">القطاعات</h1>
        <p className="text-gray-600 mt-1">إدارة القطاعات الأربعة (الاجتماعي، الاقتصادي، التنظيمي، السياسي) لكل مستوى في كلا النظامين</p>
      </div>

      {/* Entity Filter Banner - shows when navigating from a hierarchy card */}
      {filterEntityId && filterEntityName && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏛️</span>
              <div>
                <h3 className="font-bold text-lg">قطاعات {filterEntityName}</h3>
                <p className="text-indigo-100 text-sm">
                  عرض القطاعات الخاصة بـ {levelLabels[selectedLevel]}: {filterEntityName}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFilterEntityId(null);
                setFilterEntityName(null);
                // Update URL without the filter params
                window.history.replaceState({}, '', '/dashboard/sectors');
              }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all"
            >
              عرض جميع القطاعات
            </button>
          </div>
        </div>
      )}

      {/* Info Banner - only show when not filtering by entity */}
      {!filterEntityId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6">
          <div className="flex items-start">
            <span className="text-3xl ml-4">💡</span>
            <div>
              <h3 className="text-indigo-900 font-semibold text-lg mb-2">عن القطاعات</h3>
              <p className="text-indigo-800">
                يمكن إنشاء القطاعات الأربعة (الاجتماعي، الاقتصادي، التنظيمي، السياسي) لكل مستوى في:
                <strong> التسلسل الهرمي الجغرافي</strong> (المستوى القومي → الولاية → المحلية → الوحدة الإدارية → الحي)
                و <strong>نظام المغتربين</strong> (لكل قطاع من قطاعات المغتربين).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hierarchy Type Selector - disabled when filtering by entity */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 ${filterEntityId ? 'opacity-60' : ''}`}>
        <h2 className="text-lg font-semibold mb-3">اختر النظام</h2>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (filterEntityId) return; // Don't allow switching when filtering
              setHierarchyType('original');
              setSelectedExpatriateRegion(null);
              setEditingSectorType(null);
              // Reset to 'region' since original hierarchy doesn't have national level sectors
              setSelectedLevel('region');
            }}
            disabled={!!filterEntityId}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              hierarchyType === 'original'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${filterEntityId ? 'cursor-not-allowed' : ''}`}
          >
            التسلسل الهرمي الجغرافي
          </button>
          <button
            disabled={!!filterEntityId}
            onClick={() => {
              if (filterEntityId) return; // Don't allow switching when filtering
              setHierarchyType('expatriates');
              setEditingSectorType(null);
              // Set to 'national' for expatriate hierarchy
              setSelectedLevel('national');
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              hierarchyType === 'expatriates'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${filterEntityId ? 'cursor-not-allowed' : ''}`}
          >
            نظام المغتربين
          </button>
        </div>
        {filterEntityId && (
          <p className="text-xs text-gray-500 mt-2">* لتغيير النظام، اضغط على &ldquo;عرض جميع القطاعات&rdquo; أعلاه</p>
        )}
      </div>

      {/* Expatriate Region Selector */}
      {hierarchyType === 'expatriates' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">اختر قطاع المغتربين</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedExpatriateRegion(null);
                setEditingSectorType(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedExpatriateRegion === null
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل
            </button>
            {expatriateRegions.map(region => (
              <button
                key={region.id}
                onClick={() => {
                  setSelectedExpatriateRegion(region.id);
                  setEditingSectorType(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedExpatriateRegion === region.id
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level Selector - disabled when filtering by entity */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 ${filterEntityId ? 'opacity-60' : ''}`}>
        <h2 className="text-lg font-semibold mb-3">اختر المستوى</h2>
        <div className="flex flex-wrap gap-2">
          {(hierarchyType === 'original' ? levelsForOriginal : levelsForExpatriate).map((level) => (
            <button
              key={level}
              disabled={!!filterEntityId}
              onClick={() => {
                if (filterEntityId) return; // Don't allow switching when filtering
                setSelectedLevel(level);
                setEditingSectorType(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedLevel === level
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${filterEntityId ? 'cursor-not-allowed' : ''}`}
            >
              {levelLabels[level]}
            </button>
          ))}
        </div>
        {hierarchyType === 'original' && !filterEntityId && (
          <p className="text-sm text-gray-500 mt-2">
            💡 التسلسل الهرمي الجغرافي لا يحتوي على مستوى قومي للقطاعات - تبدأ القطاعات من مستوى الولاية
          </p>
        )}
        {filterEntityId && (
          <p className="text-xs text-gray-500 mt-2">* لتغيير المستوى، اضغط على &ldquo;عرض جميع القطاعات&rdquo; أعلاه</p>
        )}
      </div>

      {/* Fixed 4 Sectors Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FIXED_SECTOR_TYPES.map((type) => {
            const sector = getSectorByType(type);
            const isEditing = editingSectorType === type;

            return (
              <div
                key={type}
                className={`rounded-xl shadow-sm border-2 p-6 transition-all ${sectorTypeBgColors[type]}`}
              >
                {/* Sector Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{sectorTypeIcons[type]}</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        القطاع {sectorTypeLabels[type]}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${sectorTypeColors[type]}`}>
                        {type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sector && (
                      <>
                        <span className="px-3 py-1 text-sm rounded-full font-medium bg-gray-100 text-gray-700">
                          {sector._count?.users || 0} عضو
                        </span>
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                          sector.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {sector.active ? 'فعال' : 'غير فعال'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                {isEditing ? (
                  <form onSubmit={handleSaveEdit} className="space-y-4 bg-white rounded-lg p-4 border">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                        placeholder="أدخل وصف القطاع..."
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <label className="mr-2 text-sm text-gray-700">فعال</label>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                      >
                        حفظ التعديلات
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSectorType(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Sector Content */}
                    <div className="bg-white rounded-lg p-4 border min-h-[100px]">
                      {sector ? (
                        <>
                          {sector.description ? (
                            <p className="text-gray-700">{sector.description}</p>
                          ) : (
                            <p className="text-gray-400 italic">لا يوجد وصف</p>
                          )}
                          {sector.expatriateRegion && (
                            <p className="text-xs text-cyan-600 mt-2">
                              قطاع المغتربين: {sector.expatriateRegion.name}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-400 italic">قطاع ثابت - لم يتم إعداده بعد</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {sector && (
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => openMembersModal(sector)}
                          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <span>👥</span>
                          إدارة الأعضاء
                        </button>
                        <button
                          onClick={() => handleEditSector(type)}
                          className="flex-1 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-medium transition-all"
                        >
                          تعديل الإعدادات
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Note */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-sm text-gray-600 text-center">
          💡 القطاعات الأربعة ثابتة لكل مستوى في كلا النظامين ولا يمكن إضافة أو حذف قطاعات جديدة
        </p>
      </div>

      {/* Members Modal */}
      {showMembersModal && selectedSector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className={`p-6 border-b ${sectorTypeBgColors[selectedSector.sectorType]}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{sectorTypeIcons[selectedSector.sectorType]}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      أعضاء القطاع {sectorTypeLabels[selectedSector.sectorType]}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {levelLabels[selectedLevel]} - {sectorMembers.length} عضو
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeMembersModal}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {/* Toggle between Members List and Add Members */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setShowAddMemberPanel(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !showAddMemberPanel
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  الأعضاء الحاليين ({sectorMembers.length})
                </button>
                <button
                  onClick={() => setShowAddMemberPanel(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    showAddMemberPanel
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  + إضافة أعضاء
                </button>
              </div>

              {loadingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                </div>
              ) : showAddMemberPanel ? (
                /* Add Members Panel */
                <div>
                  {/* Search */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="بحث بالاسم أو رقم الهاتف أو البريد..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Available Users List */}
                  {filteredAvailableUsers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">لا يوجد مستخدمين متاحين للإضافة</p>
                      <p className="text-sm mt-2">جميع المستخدمين المتاحين أعضاء بالفعل في هذا القطاع</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredAvailableUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                              {getMemberDisplayName(user).charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{getMemberDisplayName(user)}</p>
                              <p className="text-sm text-gray-500">{user.mobileNumber}</p>
                              {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddMember(user.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                          >
                            + إضافة
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Current Members List */
                <div>
                  {sectorMembers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <span className="text-6xl mb-4 block">👥</span>
                      <p className="text-lg">لا يوجد أعضاء في هذا القطاع</p>
                      <p className="text-sm mt-2">انقر على &quot;إضافة أعضاء&quot; لإضافة أعضاء جدد</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sectorMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                              {getMemberDisplayName(member).charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{getMemberDisplayName(member)}</p>
                              <p className="text-sm text-gray-500">{member.mobileNumber}</p>
                              {member.email && <p className="text-xs text-gray-400">{member.email}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                              {member.adminLevel}
                            </span>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm"
                            >
                              إزالة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={closeMembersModal}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
