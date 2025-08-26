"use client";

import { useState, useEffect } from "react";

// Define types for hierarchy data
interface District {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

interface AdminUnit {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  districts: District[];
  _count?: {
    districts: number;
    users: number;
  };
}

interface Locality {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  adminUnits: AdminUnit[];
  _count?: {
    adminUnits: number;
    users: number;
  };
}

interface Region {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  localities: Locality[];
  _count?: {
    localities: number;
    users: number;
  };
}

interface HierarchyStats {
  totalRegions: number;
  totalLocalities: number;
  totalAdminUnits: number;
  totalDistricts: number;
  totalUsers: number;
}

interface NewRegion {
  name: string;
  code?: string;
  description?: string;
}

interface NewLocality {
  name: string;
  code?: string;
  description?: string;
  regionId: string;
}

interface NewAdminUnit {
  name: string;
  code?: string;
  description?: string;
  localityId: string;
}

interface NewDistrict {
  name: string;
  code?: string;
  description?: string;
  adminUnitId: string;
}

export default function HierarchyPage() {
  const [hierarchyData, setHierarchyData] = useState<Region[]>([]);
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});
  const [showAddForm, setShowAddForm] = useState<{
    type: 'region' | 'locality' | 'adminUnit' | 'district' | null;
    parentId?: string;
  }>({ type: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form data states
  const [newItem, setNewItem] = useState({
    name: '',
    code: '',
    description: '',
    parentId: ''
  });

  // Backend base URL - adjust this to match your backend server
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // API helper function with authentication
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    // Try multiple common token storage locations used by admin panels
    const token = localStorage.getItem('token') || 
                  sessionStorage.getItem('token') ||
                  localStorage.getItem('authToken') ||
                  sessionStorage.getItem('authToken') ||
                  localStorage.getItem('accessToken') ||
                  sessionStorage.getItem('accessToken');
    
    // For development, if no token found, don't send Authorization header
    // This will trigger the backend's fallback user
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    console.log('Making API call to:', `${API_BASE_URL}${endpoint}`);
    console.log('Auth status:', token ? `✅ Token found (${token.substring(0, 10)}...)` : '❌ No token - using backend fallback');
    
    // Debug: Show all possible token locations
    console.log('🔍 Token search results:');
    console.log('  localStorage.token:', localStorage.getItem('token') ? 'EXISTS' : 'NOT_FOUND');
    console.log('  sessionStorage.token:', sessionStorage.getItem('token') ? 'EXISTS' : 'NOT_FOUND');
    console.log('  localStorage.authToken:', localStorage.getItem('authToken') ? 'EXISTS' : 'NOT_FOUND');
    console.log('  sessionStorage.authToken:', sessionStorage.getItem('authToken') ? 'EXISTS' : 'NOT_FOUND');
    console.log('  localStorage.accessToken:', localStorage.getItem('accessToken') ? 'EXISTS' : 'NOT_FOUND');
    console.log('  sessionStorage.accessToken:', sessionStorage.getItem('accessToken') ? 'EXISTS' : 'NOT_FOUND');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('API Error:', response.status, response.statusText, errorText);
      
      if (response.status === 401) {
        throw new Error('غير مسموح: تحقق من تسجيل الدخول في لوحة الإدارة');
      } else if (response.status === 403) {
        throw new Error('غير مخول: تحتاج إلى صلاحيات إدارية');
      } else {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
    }

    return response.json();
  };

  // Toggle expansion of hierarchy items
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Reset form
  const resetForm = () => {
    setNewItem({ name: '', code: '', description: '', parentId: '' });
    setShowAddForm({ type: null });
  };

  // Create new hierarchy item
  const createHierarchyItem = async () => {
    if (!newItem.name.trim()) {
      alert('يرجى إدخال الاسم');
      return;
    }

    try {
      setActionLoading(true);
      
      let endpoint = '';
      let data: any = {
        name: newItem.name,
        code: newItem.code || undefined,
        description: newItem.description || undefined
      };

      switch (showAddForm.type) {
        case 'region':
          endpoint = '/hierarchy-management/regions';
          break;
        case 'locality':
          endpoint = '/hierarchy-management/localities';
          data.regionId = newItem.parentId;
          break;
        case 'adminUnit':
          endpoint = '/hierarchy-management/admin-units';
          data.localityId = newItem.parentId;
          break;
        case 'district':
          endpoint = '/hierarchy-management/districts';
          data.adminUnitId = newItem.parentId;
          break;
        default:
          throw new Error('Invalid item type');
      }

      await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      console.log(`✅ ${showAddForm.type} created successfully`);
      
      // Refresh hierarchy data
      await fetchHierarchyData();
      resetForm();
      
      alert('تم الإنشاء بنجاح!');
    } catch (error) {
      console.error('Error creating item:', error);
      alert('فشل في الإنشاء. تحقق من البيانات والمحاولة مرة أخرى.');
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch hierarchy data
  const fetchHierarchyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching hierarchy data...');

      try {
        // Try to get hierarchy tree first
        const treeData = await apiCall('/hierarchy-management/tree');
        setHierarchyData(treeData);
        console.log('✅ Hierarchy tree loaded successfully');
      } catch (treeError) {
        console.log('❌ Failed to get hierarchy tree, trying regions only:', treeError);
        // Fallback: get regions only
        const regionsData = await apiCall('/hierarchy-management/regions');
        setHierarchyData(regionsData);
        console.log('✅ Regions loaded as fallback');
      }

    } catch (error) {
      console.error('Error fetching hierarchy data:', error);
      setError('فشل في تحميل بيانات التسلسل الإداري. تحقق من اتصال الخادم وتشغيل عملية البذر.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  // Render simple add form
  const renderAddForm = () => {
    if (!showAddForm.type) return null;

    const formTitles = {
      region: 'إضافة ولاية جديدة',
      locality: 'إضافة محلية جديدة',
      adminUnit: 'إضافة وحدة إدارية جديدة',
      district: 'إضافة حي جديد'
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {formTitles[showAddForm.type]}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم *
              </label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="مثال: الخرطوم"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الكود (اختياري)
              </label>
              <input
                type="text"
                value={newItem.code}
                onChange={(e) => setNewItem({...newItem, code: e.target.value})}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="مثال: KH"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الوصف (اختياري)
              </label>
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                placeholder="وصف مختصر..."
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={createHierarchyItem}
              disabled={actionLoading || !newItem.name.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={resetForm}
              className="flex-1 rounded-lg bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render hierarchical list item
  const renderHierarchyItem = (item: any, type: 'region' | 'locality' | 'adminUnit' | 'district', level: number = 0) => {
    const isExpanded = expandedItems[item.id];
    const hasChildren = (type === 'region' && item.localities?.length > 0) ||
                       (type === 'locality' && item.adminUnits?.length > 0) ||
                       (type === 'adminUnit' && item.districts?.length > 0);

    const icons = {
      region: '🏛️',
      locality: '🏘️',
      adminUnit: '🏢',
      district: '🏠'
    };

    const colors = {
      region: 'border-blue-200 bg-blue-50',
      locality: 'border-green-200 bg-green-50',
      adminUnit: 'border-purple-200 bg-purple-50',
      district: 'border-orange-200 bg-orange-50'
    };

    return (
      <div key={item.id} className="mb-2">
        <div 
          className={`rounded-lg border p-3 ${colors[type]} cursor-pointer hover:shadow-md transition-shadow`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          {/* Item Header */}
          <div className="flex items-center justify-between" onClick={() => hasChildren && toggleExpanded(item.id)}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <span className="text-gray-500">
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
              <span className="text-lg">{icons[type]}</span>
              <div>
                <div className="font-medium text-gray-800">
                  {item.name}
                  {item.code && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      {item.code}
                    </span>
                  )}
                </div>
                {item.description && (
                  <div className="text-sm text-gray-600">{item.description}</div>
                )}
              </div>
            </div>
            
            {/* Add buttons */}
            <div className="flex gap-1">
              {type === 'region' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewItem({...newItem, parentId: item.id});
                    setShowAddForm({ type: 'locality', parentId: item.id });
                  }}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  + محلية
                </button>
              )}
              {type === 'locality' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewItem({...newItem, parentId: item.id});
                    setShowAddForm({ type: 'adminUnit', parentId: item.id });
                  }}
                  className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  + وحدة إدارية
                </button>
              )}
              {type === 'adminUnit' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewItem({...newItem, parentId: item.id});
                    setShowAddForm({ type: 'district', parentId: item.id });
                  }}
                  className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  + حي
                </button>
              )}
            </div>
          </div>

          {/* Children */}
          {isExpanded && (
            <div className="mt-3">
              {type === 'region' && item.localities?.map((locality: Locality) => 
                renderHierarchyItem(locality, 'locality', level + 1)
              )}
              {type === 'locality' && item.adminUnits?.map((adminUnit: AdminUnit) => 
                renderHierarchyItem(adminUnit, 'adminUnit', level + 1)
              )}
              {type === 'adminUnit' && item.districts?.map((district: District) => 
                renderHierarchyItem(district, 'district', level + 1)
              )}
            </div>
          )}
        </div>
      </div>
    );
  };



  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <div className="text-xl text-gray-600">جاري تحميل التسلسل الإداري...</div>
        </div>
      </div>
    );
  }

  if (error) {
    const currentToken = localStorage.getItem('token');
    
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-red-50 p-6 text-center">
          <div className="text-2xl">❌</div>
          <h3 className="mt-2 text-lg font-semibold text-red-800">خطأ في التحميل</h3>
          <p className="text-red-600">{error}</p>
          <div className="mt-4 flex gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
        
        {/* Authentication Status & Debug Info */}
        <div className="rounded-xl bg-blue-50 p-4 text-sm">
          <h4 className="font-semibold text-blue-800 mb-2">معلومات التصحيح</h4>
          <div className="space-y-1 text-blue-700">
            <div>الرمز المميز: {currentToken ? '✅ موجود' : '❌ غير موجود'}</div>
            <div>عنوان الخادم: {API_BASE_URL}</div>
            <div>المشكلة: قد يكون الخادم غير متصل أو المستخدم ليس لديه صلاحيات كافية</div>
          </div>

          {/* Debug Token */}
          {currentToken && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="text-blue-800 font-medium mb-2">تصحيح الرمز المميز:</div>
              <div className="space-y-1 text-xs text-blue-600">
                <div className="bg-blue-100 p-2 rounded font-mono break-all">
                  {currentToken.substring(0, 50)}...
                </div>
                <button
                  onClick={() => {
                    console.log('🔍 Full token:', currentToken);
                    console.log('🔍 Token length:', currentToken.length);
                    try {
                      const parts = currentToken.split('.');
                      console.log('🔍 Token parts:', parts.length);
                      if (parts.length === 3) {
                        const payload = JSON.parse(atob(parts[1]));
                        console.log('🔍 Token payload:', payload);
                      }
                    } catch (e) {
                      console.error('🔍 Token decode error:', e);
                    }
                  }}
                  className="rounded bg-blue-600 px-2 py-1 text-white text-xs hover:bg-blue-700"
                >
                  فحص الرمز المميز
                </button>
              </div>
            </div>
          )}

          {/* Troubleshooting Steps */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="text-blue-800 font-medium mb-2">خطوات الحل:</div>
            <div className="space-y-1 text-xs text-blue-600">
              <div>1. تأكد من تشغيل الخادم على localhost:5000</div>
              <div>2. قم بتشغيل: cd ppBackend && npm start</div>
              <div>3. تأكد من تسجيل الدخول بحساب مدير في لوحة الإدارة</div>
              <div>4. قم بتشغيل: node prisma/seedUsers.js (لإنشاء حساب مدير)</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">إدارة التسلسل الإداري</h1>
            <p className="mt-2 opacity-90">
              إدارة الولايات والمحليات والوحدات الإدارية والأحياء في النظام
            </p>
          </div>
          <button
            onClick={() => setShowAddForm({ type: 'region' })}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            + إضافة ولاية جديدة
          </button>
        </div>
      </div>

      {/* Hierarchical List */}
      <div className="rounded-xl bg-white shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          التسلسل الإداري ({hierarchyData.length} ولاية)
        </h2>
        
        {hierarchyData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🏛️</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">لا توجد ولايات</h3>
            <p className="text-gray-600 mb-4">ابدأ بإضافة ولاية جديدة لبناء التسلسل الإداري</p>
            <button
              onClick={() => setShowAddForm({ type: 'region' })}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              إضافة الولاية الأولى
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {hierarchyData.map((region) => 
              renderHierarchyItem(region, 'region', 0)
            )}
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      {renderAddForm()}
    </div>
  );
}
