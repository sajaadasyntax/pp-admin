"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Subscription } from "../../types";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Get mock subscriptions data
  useEffect(() => {
    // In a real app, this would be an API call filtered by user level
    const mockSubscriptions: Subscription[] = [
      {
        id: "1",
        userId: "u1",
        userName: "أحمد محمد",
        level: "الحي",
        type: "شهري",
        startDate: "2023-10-15",
        endDate: "2023-11-15",
        status: "active",
      },
      {
        id: "2",
        userId: "u2",
        userName: "سارة علي",
        level: "الوحدة الإدارية",
        type: "سنوي",
        startDate: "2023-10-10",
        endDate: "2024-10-10",
        status: "active",
      },
      {
        id: "3",
        userId: "u3",
        userName: "محمد خالد",
        level: "المحلية",
        type: "سنوي",
        startDate: "2023-09-30",
        endDate: "2024-09-30",
        status: "disabled",
        disabledBy: "عبدالله عمر",
      },
      {
        id: "4",
        userId: "u4",
        userName: "فاطمة أحمد",
        level: "الولاية",
        type: "شهري",
        startDate: "2023-09-25",
        endDate: "2023-10-25",
        status: "active",
      },
      {
        id: "5",
        userId: "u5",
        userName: "عمر خالد",
        level: "الإتحادية",
        type: "سنوي",
        startDate: "2023-09-20",
        endDate: "2024-09-20",
        status: "disabled",
        disabledBy: "محمد سعيد",
      },
    ];

    // Filter subscriptions based on user level
    const filteredSubscriptions = mockSubscriptions.filter((subscription) => {
      // Each admin can only see subscriptions from their level or below
      const levels: Record<string, number> = {
        "الحي": 1,
        "الوحدة الإدارية": 2,
        "المحلية": 3,
        "الولاية": 4,
        "الإتحادية": 5,
        "مدير النظام": 6,
      };

      const userLevelValue = user?.level ? levels[user.level] : 0;
      const subscriptionLevelValue = levels[subscription.level];

      return subscriptionLevelValue <= userLevelValue;
    });

    setSubscriptions(filteredSubscriptions);
    setLoading(false);
  }, [user]);

  // Disable subscription handler
  const handleDisableSubscription = (id: string) => {
    if (!user) return;
    
    setSubscriptions((prevSubscriptions) =>
      prevSubscriptions.map((subscription) => {
        if (subscription.id === id && subscription.status === "active") {
          return {
            ...subscription,
            status: "disabled",
            disabledBy: user.name,
          };
        }
        return subscription;
      })
    );
  };

  // Filter subscriptions
  const filteredSubscriptions =
    filter === "all"
      ? subscriptions
      : subscriptions.filter((subscription) => subscription.status === filter);

  if (loading) {
    return <div className="text-center p-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">إدارة الاشتراكات</h1>
        <div className="flex space-x-2">
          <select
            className="rounded-md border border-gray-300 p-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            dir="rtl"
          >
            <option value="all">جميع الاشتراكات</option>
            <option value="active">الاشتراكات النشطة</option>
            <option value="disabled">الاشتراكات المعطلة</option>
          </select>
        </div>
      </div>

      {filteredSubscriptions.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">لا توجد اشتراكات متاحة.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  المستخدم
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  المستوى
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  نوع الاشتراك
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  تاريخ البدء
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  تاريخ الانتهاء
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  الحالة
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredSubscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {subscription.userName}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {subscription.level}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {subscription.type}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {subscription.startDate}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {subscription.endDate}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          subscription.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {subscription.status === "active" ? "نشط" : "معطل"}
                      </span>
                    </div>
                    {subscription.status === "disabled" && subscription.disabledBy && (
                      <div className="mt-1 text-xs text-gray-500">
                        بواسطة: {subscription.disabledBy}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleDisableSubscription(subscription.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={
                        subscription.status === "disabled" ||
                        subscription.level !== user?.level
                      }
                      title={
                        subscription.level !== user?.level
                          ? "يمكنك فقط إدارة اشتراكات مستواك"
                          : ""
                      }
                    >
                      تعطيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 