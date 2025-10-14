"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import { useRouter } from 'next/navigation';

interface ChatRoom {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    email: string;
  };
  memberships: {
    id: string;
    joinedAt: string;
    user: {
      id: string;
      email: string;
      mobileNumber: string;
      memberDetails?: {
        fullName: string;
      };
    };
  }[];
  _count: {
    messages: number;
    memberships: number;
  };
}

export default function ChatRoomsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChatRooms();
  }, [token]);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${apiUrl}/chat/admin/chatrooms`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat rooms');
      }

      const data = await response.json();
      setChatRooms(data);
    } catch (err: any) {
      console.error('Error fetching chat rooms:', err);
      setError(err.message || 'Failed to load chat rooms');
    } finally {
      setLoading(false);
    }
  };

  const deleteChatRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this chat room?')) {
      return;
    }

    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${apiUrl}/chat/admin/chatrooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat room');
      }

      // Refresh the list
      fetchChatRooms();
    } catch (err: any) {
      console.error('Error deleting chat room:', err);
      alert(err.message || 'Failed to delete chat room');
    }
  };

  if (loading) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">
            غرف المحادثة
          </h1>
          <p className="text-sm text-[var(--neutral-500)]">
            إدارة غرف المحادثة والمشاركين
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/chatrooms/new')}
          className="app-button-primary"
        >
          إنشاء غرفة جديدة
        </button>
      </div>

      {/* Chat Rooms List */}
      <div className="space-y-4">
        {chatRooms.length === 0 ? (
          <div className="app-card text-center py-12">
            <p className="text-[var(--neutral-500)]">لا توجد غرف محادثة</p>
            <button
              onClick={() => router.push('/dashboard/chatrooms/new')}
              className="app-button-primary mt-4"
            >
              إنشاء أول غرفة محادثة
            </button>
          </div>
        ) : (
          chatRooms.map((room) => (
            <div key={room.id} className="app-card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--neutral-900)]">
                    {room.title}
                  </h3>
                  <p className="text-sm text-[var(--neutral-500)] mt-1">
                    أنشأ بواسطة: {room.createdBy.email}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-[var(--neutral-600)]">
                    <span>{room._count.memberships} مشترك</span>
                    <span>•</span>
                    <span>{room._count.messages} رسالة</span>
                    <span>•</span>
                    <span>
                      {new Date(room.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/chatrooms/${room.id}`)}
                    className="app-button-secondary"
                  >
                    إدارة
                  </button>
                  <button
                    onClick={() => deleteChatRoom(room.id)}
                    className="app-button-danger"
                  >
                    حذف
                  </button>
                </div>
              </div>

              {/* Members Preview */}
              {room.memberships.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--neutral-200)]">
                  <p className="text-sm font-medium text-[var(--neutral-700)] mb-2">
                    المشاركين:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {room.memberships.slice(0, 5).map((membership) => (
                      <span
                        key={membership.id}
                        className="px-3 py-1 bg-[var(--primary-50)] text-[var(--primary-700)] rounded-full text-sm"
                      >
                        {membership.user.memberDetails?.fullName || membership.user.email}
                      </span>
                    ))}
                    {room.memberships.length > 5 && (
                      <span className="px-3 py-1 bg-[var(--neutral-100)] text-[var(--neutral-600)] rounded-full text-sm">
                        +{room.memberships.length - 5} المزيد
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

