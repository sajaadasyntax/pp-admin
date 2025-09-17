"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// Types
interface User {
  id: string;
  email: string;
  mobileNumber: string;
  adminLevel: 'GENERAL_SECRETARIAT' | 'REGION' | 'LOCALITY' | 'ADMIN_UNIT' | 'DISTRICT' | 'USER' | 'ADMIN';
  role: string;
  regionId?: string;
  localityId?: string;
  adminUnitId?: string;
  districtId?: string;
  active?: boolean; // For backward compatibility
  createdAt: string;
  updatedAt: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    status?: string; // 'active' or 'disabled'
  };
}

interface UserManagementProps {
  hierarchyId: string;
  hierarchyType: 'region' | 'locality' | 'adminUnit' | 'district';
  hierarchyName: string;
  onClose: () => void;
  onUserCreated?: () => void;
}

interface NewUser {
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
  adminLevel: 'REGION' | 'LOCALITY' | 'ADMIN_UNIT' | 'DISTRICT' | 'USER';
  role: string;
}

export default function UserManagement({ 
  hierarchyId, 
  hierarchyType, 
  hierarchyName, 
  onClose, 
  onUserCreated 
}: UserManagementProps) {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    adminLevel: 'USER',
    role: 'USER'
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

  // Fetch users for this hierarchy level
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the specific endpoint for the hierarchy level
      let endpoint = '';
      switch (hierarchyType) {
        case 'region':
          endpoint = `/hierarchical-users/users/regions/${hierarchyId}/users`;
          break;
        case 'locality':
          endpoint = `/hierarchical-users/users/localities/${hierarchyId}/users`;
          break;
        case 'adminUnit':
          endpoint = `/hierarchical-users/users/admin-units/${hierarchyId}/users`;
          break;
        case 'district':
          endpoint = `/hierarchical-users/users/districts/${hierarchyId}/users`;
          break;
        default:
          endpoint = '/hierarchical-users/users';
      }
      
      const response = await apiCall(endpoint);
      const usersData = response.data || response;
      setUsers(usersData);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      // If the endpoint doesn't exist or fails, show empty state with message
      setUsers([]);
      setError('إدارة المستخدمين غير متاحة حالياً. سيتم تنفيذ هذه الميزة قريباً.');
    } finally {
      setLoading(false);
    }
  }, [apiCall, hierarchyId, hierarchyType]);

  // Create new user
  const createUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.mobileNumber.trim() || !newUser.password.trim()) {
      setError('جميع الحقول مطلوبة');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      // Split name into first and last name
      const nameParts = newUser.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Ensure we have at least a first name
      if (!firstName) {
        setError('الاسم الأول مطلوب');
        return;
      }

      // Clean up mobile number - remove any existing prefixes, spaces, etc.
      let cleanMobileNumber = newUser.mobileNumber.trim();
      // Remove any existing +249 prefix if user entered it
      if (cleanMobileNumber.startsWith('+249')) {
        cleanMobileNumber = cleanMobileNumber.substring(4);
      } else if (cleanMobileNumber.startsWith('249')) {
        cleanMobileNumber = cleanMobileNumber.substring(3);
      } else if (cleanMobileNumber.startsWith('0')) {
        cleanMobileNumber = cleanMobileNumber.substring(1);
      }
      
      // Create a standardized mobile number format
      const formattedMobileNumber = `+249${cleanMobileNumber}`;
      console.log('Formatted mobile number:', formattedMobileNumber);
      
      const payload = {
        name: `${firstName} ${lastName}`.trim(), // Send as combined name for backend
        email: newUser.email.trim(),
        mobileNumber: formattedMobileNumber,
        password: newUser.password,
        adminLevel: newUser.adminLevel,
        role: newUser.role
      };

      console.log('User creation payload:', JSON.stringify(payload, null, 2));
      
      // Validate payload before sending
      if (!payload.name || payload.name.trim() === '') {
        setError('الاسم مطلوب');
        setActionLoading(false);
        return;
      }

      // Use the specific endpoint for the hierarchy level
      let endpoint = '';
      switch (hierarchyType) {
        case 'region':
          endpoint = `/hierarchical-users/users/regions/${hierarchyId}/users`;
          break;
        case 'locality':
          endpoint = `/hierarchical-users/users/localities/${hierarchyId}/users`;
          break;
        case 'adminUnit':
          endpoint = `/hierarchical-users/users/admin-units/${hierarchyId}/users`;
          break;
        case 'district':
          endpoint = `/hierarchical-users/users/districts/${hierarchyId}/users`;
          break;
        default:
          setError('نوع التسلسل الهرمي غير صحيح');
          return;
      }

      await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('✅ User created successfully');
      
      // Reset form and refresh data
      setNewUser({
        name: '',
        email: '',
        mobileNumber: '',
        password: '',
        adminLevel: 'USER',
        role: 'USER'
      });
      setShowAddForm(false);
      await fetchUsers();
      
      if (onUserCreated) {
        onUserCreated();
      }
      
    } catch (error) {
      console.error('Error creating user:', error);
      setError(`فشل في إنشاء المستخدم. ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(true);
      setError(null);

      // Get current active status from profile if available
      const isCurrentlyActive = users.find(u => u.id === userId)?.profile?.status === 'active';
      
      await apiCall(`/hierarchical-users/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !isCurrentlyActive }),
      });

      console.log('✅ User status updated successfully');
      await fetchUsers();
      
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('فشل في تغيير حالة المستخدم');
    } finally {
      setActionLoading(false);
    }
  };

  // Get user's full name
  const getUserName = (user: User) => {
    if (user.profile?.firstName || user.profile?.lastName) {
      return `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim();
    }
    return user.email; // Fallback to email if no name
  };

  // Get user's initials
  const getUserInitials = (user: User) => {
    if (user.profile?.firstName) {
      return user.profile.firstName.charAt(0).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };

  // Get admin level name in Arabic
  const getAdminLevelName = (level: string) => {
    const names = {
      GENERAL_SECRETARIAT: 'الأمانة العامة',
      REGION: 'الولاية',
      LOCALITY: 'المحلية',
      ADMIN_UNIT: 'الوحدة الإدارية',
      DISTRICT: 'الحي',
      USER: 'مستخدم عادي',
      ADMIN: 'مدير النظام'
    };
    return names[level as keyof typeof names] || level;
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل المستخدمين...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              إدارة المستخدمين - {hierarchyName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Add User Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2 rtl:space-x-reverse"
            >
              <span>+</span>
              <span>إضافة مستخدم جديد</span>
            </button>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>لا يوجد مستخدمين في هذا المستوى</p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {getUserInitials(user)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{getUserName(user)}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.mobileNumber}</p>
                      <p className="text-sm text-blue-600">
                        {getAdminLevelName(user.adminLevel)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.profile?.status === 'active'
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.profile?.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                    
                    <button
                      onClick={() => toggleUserStatus(user.id, user.profile?.status === 'active')}
                      disabled={actionLoading}
                      className={`px-3 py-1 text-xs rounded ${
                        user.profile?.status === 'active'
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      } disabled:opacity-50`}
                    >
                      {user.profile?.status === 'active' ? 'إلغاء التفعيل' : 'تفعيل'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add User Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة مستخدم جديد</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم المستخدم"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف *
                </label>
                <div className="flex items-center">
                  <span className="bg-gray-100 text-gray-500 px-3 py-2 border border-r-0 border-gray-300 rounded-l-md">
                    +249
                  </span>
                  <input
                    type="tel"
                    value={newUser.mobileNumber}
                    onChange={(e) => setNewUser(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="900000001"
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1 block">أدخل الرقم بدون +249</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="كلمة المرور"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المستوى الإداري
                </label>
                <select
                  value={newUser.adminLevel}
                  onChange={(e) => setNewUser(prev => ({ 
                    ...prev, 
                    adminLevel: e.target.value as any,
                    role: e.target.value === 'USER' ? 'USER' : 'ADMIN'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">مستخدم عادي</option>
                  <option value="DISTRICT">مدير الحي</option>
                  <option value="ADMIN_UNIT">مدير الوحدة الإدارية</option>
                  <option value="LOCALITY">مدير المحلية</option>
                  <option value="REGION">مدير الولاية</option>
                </select>
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
                onClick={createUser}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {actionLoading ? 'جاري الإنشاء...' : 'إنشاء مستخدم'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
