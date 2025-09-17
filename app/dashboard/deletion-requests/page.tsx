"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { DeletionRequest } from "../../types";
import { apiClient } from "../../context/apiContext";
import RootAdminOnly from "../../components/RootAdminOnly";

export default function DeletionRequestsPage() {
  return (
    <RootAdminOnly>
      <DeletionRequestsContent />
    </RootAdminOnly>
  );
}

function DeletionRequestsContent() {
  const { user, token } = useAuth();
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  // Fetch deletion requests data from API
  useEffect(() => {
    const fetchDeletionRequests = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // TODO: Replace with actual API call when backend endpoint is implemented
        // const requestsData = await apiClient.deletionRequests.getAllRequests(user.token);
        // setDeletionRequests(requestsData);
        
        // For now, set empty array until API is implemented
        setDeletionRequests([]);
        
      } catch (error) {
        console.error('Error fetching deletion requests:', error);
        setDeletionRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeletionRequests();
  }, [token]);

  // Handle request approval
  const handleApproveRequest = async (id: string) => {
    try {
      // TODO: Replace with actual API call when backend endpoint is implemented
      // await apiClient.deletionRequests.approveRequest(token, id);
      
      // For now, show message that feature is not yet implemented
      alert("الموافقة على طلبات الحذف غير متاحة حالياً. سيتم تنفيذ هذه الميزة قريباً.");
    } catch (error) {
      console.error('Error approving deletion request:', error);
      alert("حدث خطأ أثناء الموافقة على الطلب. يرجى المحاولة مرة أخرى.");
    }
  };

  // Handle request rejection
  const handleRejectRequest = async (id: string) => {
    try {
      // TODO: Replace with actual API call when backend endpoint is implemented
      // await apiClient.deletionRequests.rejectRequest(token, id);
      
      // For now, show message that feature is not yet implemented
      alert("رفض طلبات الحذف غير متاح حالياً. سيتم تنفيذ هذه الميزة قريباً.");
    } catch (error) {
      console.error('Error rejecting deletion request:', error);
      alert("حدث خطأ أثناء رفض الطلب. يرجى المحاولة مرة أخرى.");
    }
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