"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import { useRouter, useParams } from 'next/navigation';

interface User {
  id: string;
  email: string;
  mobileNumber: string;
  memberDetails?: {
    fullName: string;
  };
}

interface ChatRoom {
  id: string;
  title: string;
  createdAt: string;
  memberships: {
    id: string;
    userId: string;
    joinedAt: string;
    user: User;
  }[];
}

export default function ChatRoomManagementPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChatRoom();
    fetchUsers();
  }, [roomId, token]);

  const fetchChatRoom = async () => {
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${apiUrl}/chat/admin/chatrooms`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat room');
      }

      const rooms = await response.json();
      const room = rooms.find((r: ChatRoom) => r.id === roomId);
      
      if (!room) {
        throw new Error('Chat room not found');
      }

      setChatRoom(room);
    } catch (err: any) {
      console.error('Error fetching chat room:', err);
      setError(err.message || 'Failed to load chat room');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
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
      const regularUsers = data.filter((u: User) => u);
      setAllUsers(regularUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = async (userId: string) => {
    try {
      setActionLoading(true);
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/chat/admin/chatrooms/${roomId}/participants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to add participant');
      }

      // Refresh the room data
      await fetchChatRoom();
    } catch (err: any) {
      console.error('Error adding participant:', err);
      alert(err.message || 'Failed to add participant');
    } finally {
      setActionLoading(false);
    }
  };

  const removeParticipant = async (userId: string) => {
    if (!confirm('هل أنت متأكد من إزالة هذا المشترك؟')) {
      return;
    }

    try {
      setActionLoading(true);
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/chat/admin/chatrooms/${roomId}/participants/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove participant');
      }

      // Refresh the room data
      await fetchChatRoom();
    } catch (err: any) {
      console.error('Error removing participant:', err);
      alert(err.message || 'Failed to remove participant');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !chatRoom) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary-500)] border-t-transparent"></div>
          <div className="text-xl text-[var(--neutral-600)]">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-card bg-[var(--error-100)] text-[var(--error-700)]">
        {error}
      </div>
    );
  }

  const memberIds = new Set(chatRoom.memberships.map(m => m.userId));
  const availableUsers = allUsers.filter(u => !memberIds.has(u.id));
  
  const filteredAvailableUsers = availableUsers.filter(u => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      u.memberDetails?.fullName?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.mobileNumber?.includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">
            {chatRoom.title}
          </h1>
          <p className="text-sm text-[var(--neutral-500)]">
            إدارة المشاركين في الغرفة
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/chatrooms')}
          className="app-button-secondary"
        >
          رجوع
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Members */}
        <div className="app-card">
          <h2 className="text-lg font-semibold text-[var(--neutral-900)] mb-4">
            المشاركين الحاليين ({chatRoom.memberships.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {chatRoom.memberships.length === 0 ? (
              <p className="text-center text-[var(--neutral-500)] py-8">
                لا يوجد مشاركين
              </p>
            ) : (
              chatRoom.memberships.map((membership) => (
                <div
                  key={membership.id}
                  className="p-3 rounded-lg border border-[var(--neutral-200)] flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-[var(--neutral-900)]">
                      {membership.user.memberDetails?.fullName || membership.user.email || 'بدون اسم'}
                    </p>
                    <p className="text-sm text-[var(--neutral-600)]">
                      {membership.user.mobileNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => removeParticipant(membership.userId)}
                    disabled={actionLoading}
                    className="app-button-danger text-sm"
                  >
                    إزالة
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Members */}
        <div className="app-card">
          <h2 className="text-lg font-semibold text-[var(--neutral-900)] mb-4">
            إضافة مشاركين
          </h2>
          
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="app-input w-full mb-4"
            placeholder="بحث بالاسم أو البريد أو رقم الجوال..."
          />

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAvailableUsers.length === 0 ? (
              <p className="text-center text-[var(--neutral-500)] py-8">
                {searchTerm ? 'لا توجد نتائج' : 'تمت إضافة جميع المستخدمين'}
              </p>
            ) : (
              filteredAvailableUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-lg border border-[var(--neutral-200)] flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-[var(--neutral-900)]">
                      {u.memberDetails?.fullName || u.email || 'بدون اسم'}
                    </p>
                    <p className="text-sm text-[var(--neutral-600)]">
                      {u.mobileNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => addParticipant(u.id)}
                    disabled={actionLoading}
                    className="app-button-primary text-sm"
                  >
                    إضافة
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

