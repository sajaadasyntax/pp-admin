"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  mobileNumber: string;
  memberDetails?: {
    fullName: string;
  };
  adminLevel: string;
  region?: {
    name: string;
  };
  locality?: {
    name: string;
  };
  adminUnit?: {
    name: string;
  };
  district?: {
    name: string;
  };
}

export default function NewChatRoomPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/hierarchical-users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      // Filter to only USER role (not admins)
      const regularUsers = data.filter((u: User) => u.adminLevel === 'USER');
      setUsers(regularUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateChatRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('الرجاء إدخال اسم الغرفة');
      return;
    }

    if (selectedUsers.size === 0) {
      alert('الرجاء اختيار مشارك واحد على الأقل');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${apiUrl}/chat/admin/chatrooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          participantUserIds: Array.from(selectedUsers)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create chat room');
      }

      // Success - redirect to chat rooms list
      router.push('/dashboard/chatrooms');
    } catch (err: any) {
      console.error('Error creating chat room:', err);
      setError(err.message || 'Failed to create chat room');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      u.memberDetails?.fullName?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.mobileNumber?.includes(search)
    );
  });

  if (usersLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary-500)] border-t-transparent"></div>
          <div className="text-xl text-[var(--neutral-600)]">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">
            إنشاء غرفة محادثة جديدة
          </h1>
          <p className="text-sm text-[var(--neutral-500)]">
            اختر المشاركين وأنشئ غرفة محادثة
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="app-button-secondary"
        >
          رجوع
        </button>
      </div>

      {error && (
        <div className="app-card bg-[var(--error-100)] text-[var(--error-700)]">
          {error}
        </div>
      )}

      <form onSubmit={handleCreateChatRoom} className="space-y-6">
        {/* Room Title */}
        <div className="app-card">
          <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
            اسم الغرفة
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="app-input w-full"
            placeholder="مثال: غرفة محادثة الولاية"
            required
          />
        </div>

        {/* User Selection */}
        <div className="app-card">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-[var(--neutral-700)]">
              اختيار المشاركين ({selectedUsers.size} محدد)
            </label>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-sm text-[var(--primary-600)] hover:underline"
            >
              {selectedUsers.size === filteredUsers.length ? 'إلغاء الكل' : 'تحديد الكل'}
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="app-input w-full mb-4"
            placeholder="بحث بالاسم أو البريد أو رقم الجوال..."
          />

          {/* Users List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-[var(--neutral-500)] py-8">
                لا توجد مستخدمين
              </p>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => toggleUserSelection(u.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUsers.has(u.id)
                      ? 'border-[var(--primary-500)] bg-[var(--primary-50)]'
                      : 'border-[var(--neutral-200)] hover:bg-[var(--neutral-50)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(u.id)}
                      onChange={() => {}}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[var(--neutral-900)]">
                        {u.memberDetails?.fullName || u.email || 'بدون اسم'}
                      </p>
                      <div className="flex gap-2 mt-1 text-sm text-[var(--neutral-600)]">
                        <span>{u.mobileNumber}</span>
                        {(u.region || u.locality || u.adminUnit || u.district) && (
                          <>
                            <span>•</span>
                            <span>
                              {u.district?.name || u.adminUnit?.name || u.locality?.name || u.region?.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="app-button-secondary"
            disabled={loading}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="app-button-primary"
            disabled={loading || selectedUsers.size === 0}
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء غرفة المحادثة'}
          </button>
        </div>
      </form>
    </div>
  );
}

