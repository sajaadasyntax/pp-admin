"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import UserManagement from '../../../components/UserManagement';

interface Region {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  localities?: Locality[];
  adminId?: string;
  admin?: User;
  _count?: {
    users: number;
    localities: number;
  };
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
  adminLevel: 'GENERAL_SECRETARIAT' | 'REGION' | 'LOCALITY' | 'ADMIN_UNIT' | 'DISTRICT' | 'USER' | 'ADMIN';
  role: string;
  regionId?: string;
  localityId?: string;
  adminUnitId?: string;
  districtId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

export default function RegionsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [regions, setRegions] = useState<Region[]>([]);
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

  const [newRegion, setNewRegion] = useState({
    name: '',
    code: '',
    description: ''
  });

  // API base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // API helper function
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
  }, [API_BASE_URL, token]);

  // Fetch regions
  const fetchRegions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiCall('/hierarchy/regions');
      setRegions(data);
    } catch (error) {
      console.error('Error fetching regions:', error);
      setError('فشل في تحميل الولايات');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  // Check if we should show create form
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  // Create region
  const createRegion = async () => {
    if (!newRegion.name.trim()) {
      setError('اسم الولاية مطلوب');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await apiCall('/hierarchy/regions', {
        method: 'POST',
        body: JSON.stringify({
          name: newRegion.name.trim(),
          code: newRegion.code.trim(),
          description: newRegion.description.trim()
        }),
      });

      console.log('✅ Region created successfully');
      
      // Reset form and refresh data
      setNewRegion({ name: '', code: '', description: '' });
      setShowAddForm(false);
      await fetchRegions();
      
      // Remove create action from URL
      router.replace('/dashboard/hierarchy/regions');
      
    } catch (error) {
      console.error('Error creating region:', error);
      setError(`فشل في إنشاء الولاية. ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle region status
  const toggleRegionStatus = async (regionId: string, currentStatus: boolean) => {
    try {
      setActionLoading(true);
      setError(null);

      await apiCall(`/hierarchy/regions/${regionId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentStatus }),
      });

      console.log('✅ Region status updated successfully');
      await fetchRegions();
      
    } catch (error) {
      console.error('Error toggling region status:', error);
      setError('فشل في تغيير حالة الولاية');
    } finally {
      setActionLoading(false);
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الولايات</h1>
            <p className="text-gray-600">إدارة الولايات والمناطق في النظام</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            إضافة ولاية جديدة
          </button>
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

      {/* Regions List */}
      <div className="bg-white rounded-lg shadow-md border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">قائمة الولايات</h2>
        </div>
        
        {regions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🏛️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد ولايات</h3>
            <p className="text-gray-600 mb-4">ابدأ بإضافة ولاية جديدة</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              إضافة ولاية
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {regions.map((region) => (
              <div key={region.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900">{region.name}</h3>
                      {region.code && (
                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {region.code}
                        </span>
                      )}
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        region.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {region.active ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                    
                    {region.description && (
                      <p className="mt-1 text-gray-600">{region.description}</p>
                    )}
                    
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>المحليات: {region._count?.localities || 0}</span>
                      <span>المستخدمين: {region._count?.users || 0}</span>
                      {region.admin && (
                        <span>المدير: {region.admin.profile?.firstName} {region.admin.profile?.lastName}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowUserManagement({
                        show: true,
                        hierarchyId: region.id,
                        hierarchyType: 'region',
                        hierarchyName: region.name
                      })}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      👥 المستخدمين
                    </button>
                    
                    <button
                      onClick={() => router.push(`/dashboard/hierarchy/localities?region=${region.id}`)}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      🏘️ المحليات
                    </button>
                    
                    <button
                      onClick={() => toggleRegionStatus(region.id, region.active)}
                      disabled={actionLoading}
                      className={`px-3 py-1 text-xs rounded ${
                        region.active
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      } disabled:opacity-50`}
                    >
                      {region.active ? 'إلغاء التفعيل' : 'تفعيل'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Region Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة ولاية جديدة</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الولاية *
                </label>
                <input
                  type="text"
                  value={newRegion.name}
                  onChange={(e) => setNewRegion(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم الولاية"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الكود
                </label>
                <input
                  type="text"
                  value={newRegion.code}
                  onChange={(e) => setNewRegion(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="كود الولاية"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  value={newRegion.description}
                  onChange={(e) => setNewRegion(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="وصف الولاية"
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
                onClick={createRegion}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {actionLoading ? 'جاري الإنشاء...' : 'إنشاء ولاية'}
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
            fetchRegions();
            setShowUserManagement({ show: false });
          }}
        />
      )}
    </div>
  );
}
