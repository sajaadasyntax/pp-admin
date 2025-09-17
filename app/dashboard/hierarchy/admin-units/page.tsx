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
  code?: string;
}

interface Locality {
  id: string;
  name: string;
  code?: string;
  regionId: string;
  region?: Region;
}

interface AdminUnit {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  localityId: string;
  locality?: Locality;
  adminId?: string;
  admin?: User;
  _count?: {
    users: number;
    districts: number;
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

export default function AdminUnitsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [adminUnits, setAdminUnits] = useState<AdminUnit[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
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

  const [newAdminUnit, setNewAdminUnit] = useState({
    name: '',
    code: '',
    description: '',
    localityId: ''
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
      
      // If there's a locality query param, we need to find its region first
      const localityParam = searchParams.get('locality');
      if (localityParam) {
        // Find the locality to get its region
        try {
          const locality = await apiCall(`/hierarchy/localities/${localityParam}`);
          if (locality && locality.regionId) {
            setSelectedRegion(locality.regionId);
            setSelectedLocality(localityParam);
          }
        } catch (error) {
          console.error('Error fetching locality:', error);
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
      
      // If we don't have a selected locality yet, check if there's one in the URL
      if (!selectedLocality) {
        const localityParam = searchParams.get('locality');
        if (localityParam) {
          // Check if this locality belongs to the selected region
          const localityExists = data.some((locality: Locality) => locality.id === localityParam);
          if (localityExists) {
            setSelectedLocality(localityParam);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching localities:', error);
      setError('فشل في تحميل المحليات');
    }
  }, [apiCall, searchParams, selectedLocality]);

  // Fetch admin units for a locality
  const fetchAdminUnits = useCallback(async (localityId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiCall(`/hierarchy/localities/${localityId}/admin-units`);
      setAdminUnits(data);
    } catch (error) {
      console.error('Error fetching admin units:', error);
      setError('فشل في تحميل الوحدات الإدارية');
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
      
      // Update the new admin unit form with the selected locality
      setNewAdminUnit(prev => ({ ...prev, localityId: selectedLocality }));
    } else {
      setAdminUnits([]);
    }
  }, [selectedLocality, fetchAdminUnits]);

  // Check if we should show create form
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  // Create admin unit
  const createAdminUnit = async () => {
    if (!newAdminUnit.name.trim()) {
      setError('اسم الوحدة الإدارية مطلوب');
      return;
    }

    if (!newAdminUnit.localityId) {
      setError('الرجاء اختيار المحلية');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await apiCall(`/hierarchy/localities/${newAdminUnit.localityId}/admin-units`, {
        method: 'POST',
        body: JSON.stringify({
          name: newAdminUnit.name.trim(),
          code: newAdminUnit.code.trim(),
          description: newAdminUnit.description.trim()
        }),
      });

      console.log('✅ Admin unit created successfully');
      
      // Reset form and refresh data
      setNewAdminUnit({ name: '', code: '', description: '', localityId: selectedLocality || '' });
      setShowAddForm(false);
      
      if (selectedLocality) {
        await fetchAdminUnits(selectedLocality);
      }
      
      // Remove create action from URL
      router.replace(`/dashboard/hierarchy/admin-units${selectedLocality ? `?locality=${selectedLocality}` : ''}`);
      
    } catch (error) {
      console.error('Error creating admin unit:', error);
      setError(`فشل في إنشاء الوحدة الإدارية. ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle admin unit status
  const toggleAdminUnitStatus = async (adminUnitId: string, currentStatus: boolean) => {
    try {
      setActionLoading(true);
      setError(null);

      await apiCall(`/hierarchy/admin-units/${adminUnitId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentStatus }),
      });

      console.log('✅ Admin unit status updated successfully');
      
      if (selectedLocality) {
        await fetchAdminUnits(selectedLocality);
      }
      
    } catch (error) {
      console.error('Error toggling admin unit status:', error);
      setError('فشل في تغيير حالة الوحدة الإدارية');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle region selection
  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
    setSelectedLocality(null);
    router.replace(`/dashboard/hierarchy/admin-units?region=${regionId}`);
  };

  // Handle locality selection
  const handleLocalityChange = (localityId: string) => {
    setSelectedLocality(localityId);
    router.replace(`/dashboard/hierarchy/admin-units?locality=${localityId}`);
  };

  if (loading && selectedLocality) {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الوحدات الإدارية</h1>
            <p className="text-gray-600">إدارة الوحدات الإدارية في النظام</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            disabled={!selectedLocality}
          >
            إضافة وحدة إدارية جديدة
          </button>
        </div>
      </div>

      {/* Hierarchy Selectors */}
      <div className="mb-6 bg-white rounded-lg shadow-md border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">اختر الولاية والمحلية</h2>
        
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
                    {region.code && (
                      <p className="text-xs text-gray-500">{region.code}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Locality Selector */}
        {selectedRegion && (
          <div>
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
                        {locality.code && (
                          <p className="text-xs text-gray-500">{locality.code}</p>
                        )}
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

      {/* Admin Units List */}
      {selectedLocality ? (
        <div className="bg-white rounded-lg shadow-md border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              قائمة الوحدات الإدارية في {localities.find(l => l.id === selectedLocality)?.name}
            </h2>
          </div>
          
          {adminUnits.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد وحدات إدارية</h3>
              <p className="text-gray-600 mb-4">ابدأ بإضافة وحدة إدارية جديدة</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                إضافة وحدة إدارية
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {adminUnits.map((adminUnit) => (
                <div key={adminUnit.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900">{adminUnit.name}</h3>
                        {adminUnit.code && (
                          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {adminUnit.code}
                          </span>
                        )}
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          adminUnit.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {adminUnit.active ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                      
                      {adminUnit.description && (
                        <p className="mt-1 text-gray-600">{adminUnit.description}</p>
                      )}
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>الأحياء: {adminUnit._count?.districts || 0}</span>
                        <span>المستخدمين: {adminUnit._count?.users || 0}</span>
                        {adminUnit.admin && (
                          <span>المدير: {adminUnit.admin.profile?.firstName} {adminUnit.admin.profile?.lastName}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowUserManagement({
                          show: true,
                          hierarchyId: adminUnit.id,
                          hierarchyType: 'adminUnit',
                          hierarchyName: adminUnit.name
                        })}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        👥 المستخدمين
                      </button>
                      
                      <button
                        onClick={() => router.push(`/dashboard/hierarchy/districts?adminUnit=${adminUnit.id}`)}
                        className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                      >
                        🏠 الأحياء
                      </button>
                      
                      <button
                        onClick={() => toggleAdminUnitStatus(adminUnit.id, adminUnit.active)}
                        disabled={actionLoading}
                        className={`px-3 py-1 text-xs rounded ${
                          adminUnit.active
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        } disabled:opacity-50`}
                      >
                        {adminUnit.active ? 'إلغاء التفعيل' : 'تفعيل'}
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
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">الرجاء اختيار محلية</h3>
          <p className="text-gray-600">اختر ولاية ومحلية من القائمة أعلاه لعرض الوحدات الإدارية التابعة لها</p>
        </div>
      )}

      {/* Add Admin Unit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة وحدة إدارية جديدة</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المحلية *
                </label>
                <select
                  value={newAdminUnit.localityId}
                  onChange={(e) => setNewAdminUnit(prev => ({ ...prev, localityId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر المحلية</option>
                  {localities.map(locality => (
                    <option key={locality.id} value={locality.id}>{locality.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الوحدة الإدارية *
                </label>
                <input
                  type="text"
                  value={newAdminUnit.name}
                  onChange={(e) => setNewAdminUnit(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم الوحدة الإدارية"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الكود
                </label>
                <input
                  type="text"
                  value={newAdminUnit.code}
                  onChange={(e) => setNewAdminUnit(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="كود الوحدة الإدارية"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  value={newAdminUnit.description}
                  onChange={(e) => setNewAdminUnit(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="وصف الوحدة الإدارية"
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
                onClick={createAdminUnit}
                disabled={actionLoading || !newAdminUnit.localityId || !newAdminUnit.name.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {actionLoading ? 'جاري الإنشاء...' : 'إنشاء وحدة إدارية'}
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
            if (selectedLocality) {
              fetchAdminUnits(selectedLocality);
            }
            setShowUserManagement({ show: false });
          }}
        />
      )}
    </div>
  );
}
