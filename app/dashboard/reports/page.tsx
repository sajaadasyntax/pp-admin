"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Report } from "../../types";

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteRequestSuccess, setDeleteRequestSuccess] = useState(false);

  // Get mock reports data
  useEffect(() => {
    // In a real app, this would be an API call filtered by user level
    const mockReports: Report[] = [
      {
        id: "1",
        title: "تقرير عن الأنشطة المجتمعية",
        content: "محتوى التقرير عن الأنشطة المجتمعية في الحي",
        date: "2023-10-15",
        level: "الحي",
        createdBy: "أحمد محمد",
        status: "pending",
      },
      {
        id: "2",
        title: "تقرير الصيانة الشهري",
        content: "محتوى تقرير الصيانة الشهري للوحدة الإدارية",
        date: "2023-10-10",
        level: "الوحدة الإدارية",
        createdBy: "محمد أحمد",
        status: "resolved",
      },
      {
        id: "3",
        title: "تقرير الميزانية السنوي",
        content: "محتوى تقرير الميزانية السنوي للمحلية",
        date: "2023-09-30",
        level: "المحلية",
        createdBy: "عبدالله خالد",
        status: "pending",
      },
      {
        id: "4",
        title: "تقرير المشاريع التنموية",
        content: "محتوى تقرير المشاريع التنموية في الولاية",
        date: "2023-09-25",
        level: "الولاية",
        createdBy: "سارة علي",
        status: "rejected",
      },
      {
        id: "5",
        title: "تقرير الخطة الاستراتيجية",
        content: "محتوى تقرير الخطة الاستراتيجية للإتحادية",
        date: "2023-09-20",
        level: "الإتحادية",
        createdBy: "خالد عمر",
        status: "pending",
      },
    ];

    // Filter reports based on user level
    const filteredReports = mockReports.filter(
      (report) => {
        // Each admin can only see reports from their level or below
        const levels: Record<string, number> = {
          "الحي": 1,
          "الوحدة الإدارية": 2,
          "المحلية": 3,
          "الولاية": 4,
          "الإتحادية": 5,
          "مدير النظام": 6
        };
        
        const userLevelValue = user?.level ? levels[user.level] : 0;
        const reportLevelValue = levels[report.level];
        
        return reportLevelValue <= userLevelValue;
      }
    );

    setReports(filteredReports);
    setLoading(false);
  }, [user]);

  // Check if user can delete reports directly
  const canDeleteDirectly = user?.level === "مدير النظام";

  // Check if user should have a delete request button
  const canRequestDeletion = user?.level !== "مدير النظام" && user?.level !== "الحي" && user?.level !== "الوحدة الإدارية";

  // Handle report deletion
  const handleDeleteReport = (id: string) => {
    if (canDeleteDirectly) {
      setReports((prevReports) => prevReports.filter((report) => report.id !== id));
    }
  };

  // Open delete request modal
  const openDeleteRequestModal = (report: Report) => {
    setSelectedReport(report);
    setShowDeleteRequestModal(true);
  };

  // Submit delete request
  const handleSubmitDeleteRequest = () => {
    if (!selectedReport || !deleteReason) return;
    
    // In a real app, this would call an API to create a deletion request
    console.log("Delete request submitted:", {
      reportId: selectedReport.id,
      reportTitle: selectedReport.title,
      reason: deleteReason,
      requestedBy: user?.name,
      requestedByLevel: user?.level
    });
    
    setDeleteRequestSuccess(true);
    setTimeout(() => {
      setShowDeleteRequestModal(false);
      setSelectedReport(null);
      setDeleteReason("");
      setDeleteRequestSuccess(false);
    }, 2000);
  };

  // Filter reports
  const filteredReports = filter === "all"
    ? reports
    : reports.filter((report) => report.status === filter);

  if (loading) {
    return <div className="text-center p-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--neutral-900)]">إدارة التقارير</h1>
        <div className="flex gap-2">
          <select
            className="rounded-xl border border-[var(--neutral-300)] p-2 text-sm bg-[var(--card)] focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            dir="rtl"
          >
            <option value="all">جميع التقارير</option>
            <option value="pending">قيد الانتظار</option>
            <option value="resolved">تم الحل</option>
            <option value="rejected">مرفوض</option>
          </select>
          <button className="app-button-primary">
            إضافة تقرير +
          </button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="app-card p-8 text-center">
          <p className="text-[var(--neutral-500)]">لا توجد تقارير متاحة.</p>
        </div>
      ) : (
        <div className="overflow-hidden app-card p-0">
          <table className="min-w-full">
            <thead className="bg-[var(--neutral-100)]">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--neutral-500)]"
                >
                  العنوان
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--neutral-500)]"
                >
                  المستوى
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--neutral-500)]"
                >
                  التاريخ
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
            <tbody className="divide-y divide-[var(--neutral-200)] bg-[var(--card)]">
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-[var(--neutral-900)]">
                      {report.title}
                    </div>
                    <div className="text-sm text-[var(--neutral-500)]">
                      بواسطة: {report.createdBy}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--neutral-500)]">
                    {report.level}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--neutral-500)]">
                    {report.date}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        report.status === "pending"
                          ? "bg-[var(--accent-100)] text-[var(--accent-700)]"
                          : report.status === "resolved"
                          ? "bg-[var(--success-100)] text-[var(--success-600)]"
                          : "bg-[var(--error-100)] text-[var(--error-600)]"
                      }`}
                    >
                      {report.status === "pending"
                        ? "قيد الانتظار"
                        : report.status === "resolved"
                        ? "تم الحل"
                        : "مرفوض"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end">
                      {canDeleteDirectly && (
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="app-button-danger !py-1 !px-3"
                        >
                          حذف
                        </button>
                      )}
                      {canRequestDeletion && !canDeleteDirectly && (
                        <button
                          onClick={() => openDeleteRequestModal(report)}
                          className="app-button-secondary !py-1 !px-3"
                        >
                          طلب حذف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Request Modal */}
      {showDeleteRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="app-card w-full max-w-md">
            <h2 className="mb-4 text-lg font-bold text-[var(--neutral-900)]">
              طلب حذف تقرير
            </h2>
            {deleteRequestSuccess ? (
              <div className="rounded-md bg-green-100 p-4 text-green-700">
                تم إرسال طلب الحذف بنجاح! سيقوم مدير النظام بمراجعة طلبك.
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-[var(--neutral-600)]">
                  سيتم إرسال طلب حذف التقرير &quot;{selectedReport?.title}&quot; إلى مدير النظام للمراجعة والموافقة.
                </p>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-[var(--neutral-700)]">
                    سبب طلب الحذف
                  </label>
                  <textarea
                    className="w-full rounded-md border border-[var(--neutral-300)] p-2 text-sm"
                    rows={3}
                    placeholder="يرجى كتابة سبب الحذف..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    dir="rtl"
                  ></textarea>
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setShowDeleteRequestModal(false);
                      setSelectedReport(null);
                      setDeleteReason("");
                    }}
                    className="rounded bg-[var(--neutral-100)] px-4 py-2 text-sm text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSubmitDeleteRequest}
                    className="rounded bg-[var(--primary-600)] px-4 py-2 text-sm text-white hover:bg-[var(--primary-700)]"
                    disabled={!deleteReason}
                  >
                    إرسال الطلب
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 