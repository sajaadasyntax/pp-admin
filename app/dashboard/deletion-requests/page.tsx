"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { DeletionRequest } from "../../types";

export default function DeletionRequestsPage() {
  const { user } = useAuth();
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  // Get mock deletion requests data
  useEffect(() => {
    // In a real app, this would be an API call
    const mockDeletionRequests: DeletionRequest[] = [
      {
        id: "1",
        requestType: "user",
        itemId: "u101",
        itemName: "محمد عبدالله",
        requestReason: "المستخدم غير نشط لمدة 6 أشهر",
        requestDate: "2023-12-15",
        requestedBy: {
          id: "admin1",
          name: "أحمد سليمان",
          level: "الإتحادية",
        },
        status: "pending",
      },
      {
        id: "2",
        requestType: "report",
        itemId: "r203",
        itemName: "تقرير مخالفات الحي الشرقي",
        requestReason: "تم معالجة المخالفات وإغلاق الموضوع",
        requestDate: "2023-12-10",
        requestedBy: {
          id: "admin2",
          name: "سارة محمد",
          level: "الولاية",
        },
        status: "pending",
      },
      {
        id: "3",
        requestType: "voting",
        itemId: "v305",
        itemName: "التصويت على مشروع تطوير الحديقة العامة",
        requestReason: "انتهت فترة التصويت والمشروع تم إلغاؤه",
        requestDate: "2023-12-05",
        requestedBy: {
          id: "admin3",
          name: "خالد أحمد",
          level: "المحلية",
        },
        status: "approved",
        actionDate: "2023-12-07",
      },
      {
        id: "4",
        requestType: "user",
        itemId: "u156",
        itemName: "فاطمة علي",
        requestReason: "حساب مكرر للمستخدم",
        requestDate: "2023-12-01",
        requestedBy: {
          id: "admin4",
          name: "عمر حسن",
          level: "الوحدة الإدارية",
        },
        status: "rejected",
        actionDate: "2023-12-03",
      },
      {
        id: "5",
        requestType: "report",
        itemId: "r410",
        itemName: "تقرير صيانة المباني الحكومية",
        requestReason: "التقرير قديم ولم يعد ذو صلة",
        requestDate: "2023-11-25",
        requestedBy: {
          id: "admin5",
          name: "ليلى يوسف",
          level: "الإتحادية",
        },
        status: "pending",
      },
    ];

    setDeletionRequests(mockDeletionRequests);
    setLoading(false);
  }, []);

  // Handle request approval
  const handleApproveRequest = (id: string) => {
    setDeletionRequests((prevRequests) =>
      prevRequests.map((request) => {
        if (request.id === id) {
          return {
            ...request,
            status: "approved",
            actionDate: new Date().toISOString().split("T")[0],
            actionBy: user?.name
          };
        }
        return request;
      })
    );
  };

  // Handle request rejection
  const handleRejectRequest = (id: string) => {
    setDeletionRequests((prevRequests) =>
      prevRequests.map((request) => {
        if (request.id === id) {
          return {
            ...request,
            status: "rejected",
            actionDate: new Date().toISOString().split("T")[0],
          };
        }
        return request;
      })
    );
  };

  // Filter deletion requests
  const filteredRequests =
    filter === "all"
      ? deletionRequests
      : deletionRequests.filter((request) => request.status === filter);

  // Get request type badge color
  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case "user":
        return "bg-blue-100 text-blue-800";
      case "report":
        return "bg-amber-100 text-amber-800";
      case "voting":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get request type Arabic name
  const getRequestTypeName = (type: string) => {
    switch (type) {
      case "user":
        return "مستخدم";
      case "report":
        return "تقرير";
      case "voting":
        return "تصويت";
      default:
        return type;
    }
  };

  if (loading) {
    return <div className="text-center p-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">طلبات الحذف</h1>
        <div className="flex space-x-2">
          <select
            className="rounded-md border border-gray-300 p-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            dir="rtl"
          >
            <option value="all">جميع الطلبات</option>
            <option value="pending">الطلبات المعلقة</option>
            <option value="approved">الطلبات الموافق عليها</option>
            <option value="rejected">الطلبات المرفوضة</option>
          </select>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="app-card text-center">
          <p className="text-[var(--neutral-500)]">لا توجد طلبات حذف متاحة.</p>
        </div>
      ) : (
        <div className="app-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--neutral-200)]">
              <thead className="bg-[var(--neutral-50)]">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--neutral-500)]"
                  >
                    نوع الطلب
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--neutral-500)]"
                  >
                    اسم العنصر
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--neutral-500)]"
                  >
                    سبب الطلب
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--neutral-500)]"
                  >
                    مقدم الطلب
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--neutral-500)]"
                  >
                    تاريخ الطلب
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--neutral-500)]"
                  >
                    الحالة
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--neutral-500)]"
                  >
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neutral-200)] bg-white">
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getRequestTypeColor(
                          request.requestType
                        )}`}
                      >
                        {getRequestTypeName(request.requestType)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-[var(--neutral-900)]">
                        {request.itemName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--neutral-500)]">
                        {request.requestReason}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-[var(--neutral-900)]">
                        {request.requestedBy.name}
                      </div>
                      <div className="text-xs text-[var(--neutral-500)]">
                        {request.requestedBy.level}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--neutral-500)]">
                      {request.requestDate}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {request.status === "pending"
                            ? "معلّق"
                            : request.status === "approved"
                            ? "تمت الموافقة"
                            : "مرفوض"}
                        </span>
                      </div>
                      {request.actionDate && (
                        <div className="mt-1 text-xs text-[var(--neutral-500)]">
                          {request.actionDate}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      {request.status === "pending" && (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            className="rounded bg-[var(--success-100)] px-2 py-1 text-[var(--success-600)] hover:bg-[var(--success-200)]"
                          >
                            موافقة
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="rounded bg-[var(--error-100)] px-2 py-1 text-[var(--error-600)] hover:bg-[var(--error-200)]"
                          >
                            رفض
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 