"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import { useRouter, useSearchParams } from 'next/navigation';
import UserManagement from '../../../components/UserManagement';
import Link from 'next/link';

interface Region {
  id: string;
  name: string;
}

interface Locality {
  id: string;
  name: string;
  regionId: string;
}

interface AdminUnit {
  id: string;
  name: string;
  localityId: string;
  locality?: Locality;
}

interface District {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  adminUnitId: string;
  adminUnit?: AdminUnit;
  adminId?: string;
  admin?: User;
  _count?: {
    users: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  adminLevel: string;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

export default function DistrictsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [districts, setDistricts] = useState<District[]>([]);
  const [adminUnits, setAdminUnits] = useState<AdminUnit[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedAdminUnit, setSelectedAdminUnit] = useState<string | null>(null);
  const [selectedLocality, setSelectedLocality] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState<{
    show: boolean;
    hierarchyId?: string;
    hierarchyType?: 'region' | 'locality' | 'adminUnit' | 'district';
    hierarchyName?: string;
  }>({ show: false });

  const [newDistrict, setNewDistrict] = useState({
    name: '',
    code: '',
    description: '',
    adminUnitId: ''
  });

  // API base URL is imported from config

  // API helper function
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    };

    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }, [token]);

  // Fetch regions
  const fetchRegions = useCallback(async () => {
    try {
      const data = await apiCall('/hierarchy/regions');
      setRegions(data);
      
      // If there's an adminUnit query param, we need to find its region and locality first
      const adminUnitParam = searchParams.get('adminUnit');
      if (adminUnitParam) {
        try {
          const adminUnit = await apiCall(`/hierarchy/admin-units/${adminUnitParam}`);
          if (adminUnit && adminUnit.localityId) {
            const locality = await apiCall(`/hierarchy/localities/${adminUnit.localityId}`);
            if (locality && locality.regionId) {
              setSelectedRegion(locality.regionId);
              setSelectedLocality(adminUnit.localityId);
              setSelectedAdminUnit(adminUnitParam);
            }
          }
        } catch (error) {
          console.error('Error fetching admin unit:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
      setError('فشل في تحميل الولايات');
    }
  }, [apiCall, searchParams]);

  // Fetch localities for a region
  const fetchLocalities = useCallback(async (regionId: string) => {
    try {
      const data = await apiCall(`/hierarchy/regions/${regionId}/localities`);
      setLocalities(data);
    } catch (error) {
      console.error('Error fetching localities:', error);
      setError('فشل في تحميل المحليات');
    }
  }, [apiCall]);

  // Fetch admin units for a locality
  const fetchAdminUnits = useCallback(async (localityId: string) => {
    try {
      const data = await apiCall(`/hierarchy/localities/${localityId}/admin-units`);
      setAdminUnits(data);
    } catch (error) {
      console.error('Error fetching admin units:', error);
      setError('فشل في تحميل الوحدات الإدارية');
    }
  }, [apiCall]);

  // Fetch districts for an admin unit
  const fetchDistricts = useCallback(async (adminUnitId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiCall(`/hierarchy/admin-units/${adminUnitId}/districts`);
      setDistricts(data);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setError('فشل في تحميل الأحياء');
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
      setSelectedLocality(null);
    }
  }, [selectedRegion, fetchLocalities]);

  useEffect(() => {
    if (selectedLocality) {
      fetchAdminUnits(selectedLocality);
    } else {
      setAdminUnits([]);
      setSelectedAdminUnit(null);
    }
  }, [selectedLocality, fetchAdminUnits]);

  useEffect(() => {
    if (selectedAdminUnit) {
      fetchDistricts(selectedAdminUnit);
      
      // Update the new district form with the selected admin unit
      setNewDistrict(prev => ({ ...prev, adminUnitId: selectedAdminUnit }));
    } else {
      setDistricts([]);
    }
  }, [selectedAdminUnit, fetchDistricts]);

  // Check if we should show create form
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  // Create district
  const createDistrict = async () => {
    if (!newDistrict.name.trim()) {
      setError('اسم الحي مطلوب');
      return;
    }

    if (!newDistrict.adminUnitId) {
      setError('الرجاء اختيار الوحدة الإدارية');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await apiCall(`/hierarchy/admin-units/${newDistrict.adminUnitId}/districts`, {
        method: 'POST',
        body: JSON.stringify({
          name: newDistrict.name.trim(),
          code: newDistrict.code.trim(),
          description: newDistrict.description.trim()
        }),
      });

      console.log('✅ District created successfully');
      
      // Reset form and refresh data
      setNewDistrict({ name: '', code: '', description: '', adminUnitId: selectedAdminUnit || '' });
      setShowAddForm(false);
      
      if (selectedAdminUnit) {
        await fetchDistricts(selectedAdminUnit);
      }
      
      // Remove create action from URL
      router.replace(`/dashboard/hierarchy/districts${selectedAdminUnit ? `?adminUnit=${selectedAdminUnit}` : ''}`);
      
    } catch (error) {
      console.error('Error creating district:', error);
      setError(`فشل في إنشاء الحي. ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle district status
  const toggleDistrictStatus = async (districtId: string, currentStatus: boolean) => {
    try {
      setActionLoading(true);
      setError(null);

      await apiCall(`/hierarchy/districts/${districtId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentStatus }),
      });

      console.log('✅ District status updated successfully');
      
      if (selectedAdminUnit) {
        await fetchDistricts(selectedAdminUnit);
      }
      
    } catch (error) {
      console.error('Error toggling district status:', error);
      setError('فشل في تغيير حالة الحي');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle region selection
  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
    setSelectedLocality(null);
    setSelectedAdminUnit(null);
    router.replace(`/dashboard/hierarchy/districts?region=${regionId}`);
  };

  // Handle locality selection
  const handleLocalityChange = (localityId: string) => {
    setSelectedLocality(localityId);
    setSelectedAdminUnit(null);
    router.replace(`/dashboard/hierarchy/districts?locality=${localityId}`);
  };

  // Handle admin unit selection
  const handleAdminUnitChange = (adminUnitId: string) => {
    setSelectedAdminUnit(adminUnitId);
    router.replace(`/dashboard/hierarchy/districts?adminUnit=${adminUnitId}`);
  };

  if (loading && selectedAdminUnit) {
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الأحياء</h1>
            <p className="text-gray-600">إدارة الأحياء والمناطق السكنية في النظام</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            disabled={!selectedAdminUnit}
          >
            إضافة حي جديد
          </button>
        </div>
      </div>

      {/* Hierarchy Selectors */}
      <div className="mb-6 bg-white rounded-lg shadow-md border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">اختر التسلسل الهرمي</h2>
        
        {/* Region Selector */}
        <div className="mb-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">الولاية</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {regions.map(region => (
              <div 
                key={region.id}
                onClick={() => handleRegionChange(region.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                  selectedRegion === region.id 
                    ? 'bg-blue-100 border-2 border-blue-500' 
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-1 bg-blue-50 rounded-full">
                      <span className="text-lg">🏛️</span>
                    </div>
                  </div>
                  <div className="ml-2">
                    <h4 className="font-medium text-gray-900">{region.name}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Locality Selector */}
        {selectedRegion && (
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">المحلية</h3>
            {localities.length === 0 ? (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">لا توجد محليات في هذه الولاية</p>
                <Link 
                  href={`/dashboard/hierarchy/localities?region=${selectedRegion}&action=create`}
                  className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                >
                  إضافة محلية جديدة
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {localities.map(locality => (
                  <div 
                    key={locality.id}
                    onClick={() => handleLocalityChange(locality.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedLocality === locality.id 
                        ? 'bg-green-100 border-2 border-green-500' 
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-1 bg-green-50 rounded-full">
                          <span className="text-lg">🏘️</span>
                        </div>
                      </div>
                      <div className="ml-2">
                        <h4 className="font-medium text-gray-900">{locality.name}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Admin Unit Selector */}
        {selectedLocality && (
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">الوحدة الإدارية</h3>
            {adminUnits.length === 0 ? (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">لا توجد وحدات إدارية في هذه المحلية</p>
                <Link 
                  href={`/dashboard/hierarchy/admin-units?locality=${selectedLocality}&action=create`}
                  className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                >
                  إضافة وحدة إدارية جديدة
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {adminUnits.map(adminUnit => (
                  <div 
                    key={adminUnit.id}
                    onClick={() => handleAdminUnitChange(adminUnit.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedAdminUnit === adminUnit.id 
                        ? 'bg-purple-100 border-2 border-purple-500' 
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-1 bg-purple-50 rounded-full">
                          <span className="text-lg">🏢</span>
                        </div>
                      </div>
                      <div className="ml-2">
                        <h4 className="font-medium text-gray-900">{adminUnit.name}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Districts List */}
      {selectedAdminUnit ? (
        <div className="bg-white rounded-lg shadow-md border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              قائمة الأحياء في {adminUnits.find(a => a.id === selectedAdminUnit)?.name}
            </h2>
          </div>
          
          {districts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🏠</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أحياء</h3>
              <p className="text-gray-600 mb-4">ابدأ بإضافة حي جديد</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                إضافة حي
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {districts.map((district) => (
                <div key={district.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900">{district.name}</h3>
                        {district.code && (
                          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {district.code}
                          </span>
                        )}
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          district.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {district.active ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                      
                      {district.description && (
                        <p className="mt-1 text-gray-600">{district.description}</p>
                      )}
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>المستخدمين: {district._count?.users || 0}</span>
                        {district.admin && (
                          <span>المدير: {district.admin.profile?.firstName} {district.admin.profile?.lastName}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowUserManagement({
                          show: true,
                          hierarchyId: district.id,
                          hierarchyType: 'district',
                          hierarchyName: district.name
                        })}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        👥 المستخدمين
                      </button>
                      
                      <button
                        onClick={() => toggleDistrictStatus(district.id, district.active)}
                        disabled={actionLoading}
                        className={`px-3 py-1 text-xs rounded ${
                          district.active
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        } disabled:opacity-50`}
                      >
                        {district.active ? 'إلغاء التفعيل' : 'تفعيل'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">🏠</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">الرجاء اختيار وحدة إدارية</h3>
          <p className="text-gray-600">اختر التسلسل الهرمي من القائمة أعلاه لعرض الأحياء التابعة له</p>
        </div>
      )}

      {/* Add District Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة حي جديد</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوحدة الإدارية *
                </label>
                <select
                  value={newDistrict.adminUnitId}
                  onChange={(e) => setNewDistrict(prev => ({ ...prev, adminUnitId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر الوحدة الإدارية</option>
                  {adminUnits.map(adminUnit => (
                    <option key={adminUnit.id} value={adminUnit.id}>{adminUnit.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الحي *
                </label>
                <input
                  type="text"
                  value={newDistrict.name}
                  onChange={(e) => setNewDistrict(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم الحي"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الكود
                </label>
                <input
                  type="text"
                  value={newDistrict.code}
                  onChange={(e) => setNewDistrict(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="كود الحي"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  value={newDistrict.description}
                  onChange={(e) => setNewDistrict(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="وصف الحي"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                disabled={actionLoading}
              >
                إلغاء
              </button>
              <button
                onClick={createDistrict}
                disabled={actionLoading || !newDistrict.adminUnitId || !newDistrict.name.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {actionLoading ? 'جاري الإنشاء...' : 'إنشاء حي'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement.show && (
        <UserManagement
          hierarchyId={showUserManagement.hierarchyId!}
          hierarchyType={showUserManagement.hierarchyType!}
          hierarchyName={showUserManagement.hierarchyName!}
          onClose={() => setShowUserManagement({ show: false })}
          onUserCreated={() => {
            if (selectedAdminUnit) {
              fetchDistricts(selectedAdminUnit);
            }
            setShowUserManagement({ show: false });
          }}
        />
      )}
    </div>
  );
}
