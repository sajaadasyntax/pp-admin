"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Notification } from "../../types";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Get mock notifications data
  useEffect(() => {
    // In a real app, this would be an API call filtered by user level
    const mockNotifications: Notification[] = [
      {
        id: "1",
        title: "تم إنشاء تقرير جديد",
        message: "تم إنشاء تقرير جديد بواسطة أحمد محمد",
        date: "2023-10-15T10:30:00",
        read: false,
        level: "الحي",
      },
      {
        id: "2",
        title: "تم قبول عضوية جديدة",
        message: "تم قبول عضوية سارة علي في مستوى الوحدة الإدارية",
        date: "2023-10-14T15:45:00",
        read: true,
        level: "الوحدة الإدارية",
      },
      {
        id: "3",
        title: "تم إنشاء تصويت جديد",
        message: "تم إنشاء تصويت جديد حول ميزانية التعليم",
        date: "2023-10-13T09:20:00",
        read: false,
        level: "المحلية",
      },
      {
        id: "4",
        title: "تم تعطيل اشتراك",
        message: "تم تعطيل اشتراك محمد خالد بواسطة عبدالله عمر",
        date: "2023-10-12T14:10:00",
        read: false,
        level: "الولاية",
      },
      {
        id: "5",
        title: "تحديث النظام",
        message: "تم تحديث النظام إلى الإصدار الجديد",
        date: "2023-10-11T11:05:00",
        read: true,
        level: "الإتحادية",
      },
    ];

    // Filter notifications based on user level
    const filteredNotifications = mockNotifications.filter((notification) => {
      // Each admin can only see notifications from their level or below
      const levels: Record<string, number> = {
        "الحي": 1,
        "الوحدة الإدارية": 2,
        "المحلية": 3,
        "الولاية": 4,
        "الإتحادية": 5,
        "مدير النظام": 6,
      };

      const userLevelValue = user?.level ? levels[user.level] : 0;
      const notificationLevelValue = levels[notification.level];

      return notificationLevelValue <= userLevelValue;
    });

    setNotifications(filteredNotifications);
    setLoading(false);
  }, [user]);

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => {
        if (notification.id === id) {
          return { ...notification, read: true };
        }
        return notification;
      })
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  // Delete notification
  const deleteNotification = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `منذ ${diffMins} دقيقة`;
    } else if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    } else {
      return `منذ ${diffDays} يوم`;
    }
  };

  // Filter notifications
  const filteredNotifications =
    filter === "all"
      ? notifications
      : filter === "unread"
      ? notifications.filter((notification) => !notification.read)
      : notifications.filter((notification) => notification.read);

  if (loading) {
    return <div className="text-center p-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">الإشعارات</h1>
        <div className="flex gap-2">
          <select
            className="rounded-md border border-gray-300 p-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            dir="rtl"
          >
            <option value="all">جميع الإشعارات</option>
            <option value="unread">غير مقروءة</option>
            <option value="read">مقروءة</option>
          </select>
          <button
            onClick={markAllAsRead}
            className="rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            disabled={!notifications.some((n) => !n.read)}
          >
            تعليم الكل كمقروءة
          </button>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">لا توجد إشعارات.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg bg-white p-4 shadow-sm transition-all ${
                !notification.read ? "border-r-4 border-blue-500" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-medium">
                    {notification.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.date)}
                    </span>
                    <span className="text-xs text-gray-500">
                      المستوى: {notification.level}
                    </span>
                  </div>
                </div>
                <div className="mr-4 flex items-center space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="تعليم كمقروءة"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600 hover:text-red-800"
                    title="حذف"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 