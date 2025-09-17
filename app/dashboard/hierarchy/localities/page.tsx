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
  description?: string;
  active: boolean;
}

interface Locality {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  regionId: string;
  region?: Region;
  adminId?: string;
  admin?: User;
  _count?: {
    users: number;
    adminUnits: number;
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

export default function LocalitiesPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
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

  const [newLocality, setNewLocality] = useState({
    name: '',
    code: '',
    description: '',
    regionId: ''
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
      
      // If there's a region query param, set it as selected
      const regionParam = searchParams.get('region');
      if (regionParam) {
        setSelectedRegion(regionParam);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
      setError('فشل في تحميل الولايات');
    }
  }, [apiCall, searchParams]);

  // Fetch localities for a region
  const fetchLocalities = useCallback(async (regionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiCall(`/hierarchy/regions/${regionId}/localities`);
      setLocalities(data);
    } catch (error) {
      console.error('Error fetching localities:', error);
      setError('فشل في تحميل المحليات');
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
      
      // Update the new locality form with the selected region
      setNewLocality(prev => ({ ...prev, regionId: selectedRegion }));
    } else {
      setLocalities([]);
    }
  }, [selectedRegion, fetchLocalities]);

  // Check if we should show create form
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  // Create locality
  const createLocality = async () => {
    if (!newLocality.name.trim()) {
      setError('اسم المحلية مطلوب');
      return;
    }

    if (!newLocality.regionId) {
      setError('الرجاء اختيار الولاية');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await apiCall(`/hierarchy/regions/${newLocality.regionId}/localities`, {
        method: 'POST',
        body: JSON.stringify({
          name: newLocality.name.trim(),
          code: newLocality.code.trim(),
          description: newLocality.description.trim()
        }),
      });

      console.log('✅ Locality created successfully');
      
      // Reset form and refresh data
      setNewLocality({ name: '', code: '', description: '', regionId: selectedRegion || '' });
      setShowAddForm(false);
      
      if (selectedRegion) {
        await fetchLocalities(selectedRegion);
      }
      
      // Remove create action from URL
      router.replace(`/dashboard/hierarchy/localities${selectedRegion ? `?region=${selectedRegion}` : ''}`);
      
    } catch (error) {
      console.error('Error creating locality:', error);
      setError(`فشل في إنشاء المحلية. ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle locality status
  const toggleLocalityStatus = async (localityId: string, currentStatus: boolean) => {
    try {
      setActionLoading(true);
      setError(null);

      await apiCall(`/hierarchy/localities/${localityId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentStatus }),
      });

      console.log('✅ Locality status updated successfully');
      
      if (selectedRegion) {
        await fetchLocalities(selectedRegion);
      }
      
    } catch (error) {
      console.error('Error toggling locality status:', error);
      setError('فشل في تغيير حالة المحلية');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle region selection
  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
    router.replace(`/dashboard/hierarchy/localities?region=${regionId}`);
  };

  if (loading && selectedRegion) {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المحليات</h1>
            <p className="text-gray-600">إدارة المحليات والمدن في النظام</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            disabled={!selectedRegion}
          >
            إضافة محلية جديدة
          </button>
        </div>
      </div>

      {/* Region Selector */}
      <div className="mb-6 bg-white rounded-lg shadow-md border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">اختر الولاية</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {regions.map(region => (
            <div 
              key={region.id}
              onClick={() => handleRegionChange(region.id)}
              className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 ${
                selectedRegion === region.id 
                  ? 'bg-blue-100 border-2 border-blue-500' 
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <span className="text-xl">🏛️</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">{region.name}</h3>
                  {region.code && (
                    <p className="text-sm text-gray-500">{region.code}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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

      {/* Localities List */}
      {selectedRegion ? (
        <div className="bg-white rounded-lg shadow-md border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              قائمة المحليات في {regions.find(r => r.id === selectedRegion)?.name}
            </h2>
          </div>
          
          {localities.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🏘️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد محليات</h3>
              <p className="text-gray-600 mb-4">ابدأ بإضافة محلية جديدة</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                إضافة محلية
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {localities.map((locality) => (
                <div key={locality.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900">{locality.name}</h3>
                        {locality.code && (
                          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {locality.code}
                          </span>
                        )}
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          locality.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {locality.active ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                      
                      {locality.description && (
                        <p className="mt-1 text-gray-600">{locality.description}</p>
                      )}
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>الوحدات الإدارية: {locality._count?.adminUnits || 0}</span>
                        <span>المستخدمين: {locality._count?.users || 0}</span>
                        {locality.admin && (
                          <span>المدير: {locality.admin.profile?.firstName} {locality.admin.profile?.lastName}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowUserManagement({
                          show: true,
                          hierarchyId: locality.id,
                          hierarchyType: 'locality',
                          hierarchyName: locality.name
                        })}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        👥 المستخدمين
                      </button>
                      
                      <button
                        onClick={() => router.push(`/dashboard/hierarchy/admin-units?locality=${locality.id}`)}
                        className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                      >
                        🏢 الوحدات الإدارية
                      </button>
                      
                      <button
                        onClick={() => toggleLocalityStatus(locality.id, locality.active)}
                        disabled={actionLoading}
                        className={`px-3 py-1 text-xs rounded ${
                          locality.active
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        } disabled:opacity-50`}
                      >
                        {locality.active ? 'إلغاء التفعيل' : 'تفعيل'}
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
          <div className="text-gray-400 text-6xl mb-4">🏘️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">الرجاء اختيار ولاية</h3>
          <p className="text-gray-600">اختر ولاية من القائمة أعلاه لعرض المحليات التابعة لها</p>
        </div>
      )}

      {/* Add Locality Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة محلية جديدة</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الولاية *
                </label>
                <select
                  value={newLocality.regionId}
                  onChange={(e) => setNewLocality(prev => ({ ...prev, regionId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر الولاية</option>
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المحلية *
                </label>
                <input
                  type="text"
                  value={newLocality.name}
                  onChange={(e) => setNewLocality(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم المحلية"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الكود
                </label>
                <input
                  type="text"
                  value={newLocality.code}
                  onChange={(e) => setNewLocality(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="كود المحلية"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  value={newLocality.description}
                  onChange={(e) => setNewLocality(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="وصف المحلية"
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
                onClick={createLocality}
                disabled={actionLoading || !newLocality.regionId || !newLocality.name.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {actionLoading ? 'جاري الإنشاء...' : 'إنشاء محلية'}
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
            if (selectedRegion) {
              fetchLocalities(selectedRegion);
            }
            setShowUserManagement({ show: false });
          }}
        />
      )}
    </div>
  );
}
