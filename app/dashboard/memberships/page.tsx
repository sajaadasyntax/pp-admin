"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Membership } from "../../types";

export default function MembershipsPage() {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Get mock memberships data
  useEffect(() => {
    // In a real app, this would be an API call filtered by user level
    const mockMemberships: Membership[] = [
      {
        id: "1",
        userId: "u1",
        userName: "أحمد محمد",
        level: "الحي",
        status: "active",
        email: "ahmed@example.com",
        phone: "+966123456789",
        joinDate: "2023-10-15",
      },
      {
        id: "2",
        userId: "u2",
        userName: "سارة علي",
        level: "الوحدة الإدارية",
        status: "active",
        email: "sara@example.com",
        phone: "+966123456790",
        joinDate: "2023-10-10",
      },
      {
        id: "3",
        userId: "u3",
        userName: "محمد خالد",
        level: "المحلية",
        status: "disabled",
        email: "mohammed@example.com",
        phone: "+966123456791",
        joinDate: "2023-09-30",
      },
      {
        id: "4",
        userId: "u4",
        userName: "فاطمة أحمد",
        level: "الولاية",
        status: "active",
        email: "fatima@example.com",
        phone: "+966123456792",
        joinDate: "2023-09-25",
      },
      {
        id: "5",
        userId: "u5",
        userName: "عمر خالد",
        level: "الإتحادية",
        status: "disabled",
        email: "omar@example.com",
        phone: "+966123456793",
        joinDate: "2023-09-20",
      },
    ];

    // Filter memberships based on user level
    const filteredMemberships = mockMemberships.filter((membership) => {
      // Each admin can only see memberships from their level or below
      const levels: Record<string, number> = {
        "الحي": 1,
        "الوحدة الإدارية": 2,
        "المحلية": 3,
        "الولاية": 4,
        "الإتحادية": 5,
        "مدير النظام": 6,
      };

      const userLevelValue = user?.level ? levels[user.level] : 0;
      const membershipLevelValue = levels[membership.level];

      return membershipLevelValue <= userLevelValue;
    });

    setMemberships(filteredMemberships);
    setLoading(false);
  }, [user]);

  // Toggle membership status handler
  const handleToggleStatus = (id: string) => {
    setMemberships((prevMemberships) =>
      prevMemberships.map((membership) => {
        if (membership.id === id) {
          return {
            ...membership,
            status: membership.status === "active" ? "disabled" : "active",
          };
        }
        return membership;
      })
    );
  };

  // Filter memberships
  const filteredMemberships =
    filter === "all"
      ? memberships
      : memberships.filter((membership) => membership.status === filter);

  if (loading) {
    return <div className="text-center p-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">إدارة العضويات</h1>
        <div className="flex space-x-2">
          <select
            className="rounded-md border border-gray-300 p-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            dir="rtl"
          >
            <option value="all">جميع العضويات</option>
            <option value="active">العضويات النشطة</option>
            <option value="disabled">العضويات المعطلة</option>
          </select>
        </div>
      </div>

      {filteredMemberships.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">لا توجد عضويات متاحة.</p>
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
                  الاسم
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
                  الحالة
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  البريد الإلكتروني
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  تاريخ الانضمام
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
              {filteredMemberships.map((membership) => (
                <tr key={membership.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {membership.userName}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {membership.level}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        membership.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {membership.status === "active" ? "نشط" : "معطل"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {membership.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {membership.joinDate}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleToggleStatus(membership.id)}
                      className={`${
                        membership.status === "active"
                          ? "text-red-600 hover:text-red-900"
                          : "text-green-600 hover:text-green-900"
                      }`}
                      disabled={membership.level !== user?.level}
                      title={
                        membership.level !== user?.level
                          ? "يمكنك فقط إدارة العضويات في مستواك"
                          : ""
                      }
                    >
                      {membership.status === "active" ? "تعطيل" : "تفعيل"}
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