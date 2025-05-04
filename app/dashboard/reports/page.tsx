"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Report } from "../../types";

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

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

  // Delete report handler
  const handleDeleteReport = (id: string) => {
    // Check if user has permission to delete reports
    // Only المحلية level and above can delete reports
    const canDelete = ["المحلية", "الولاية", "الإتحادية", "مدير النظام"].includes(
      user?.level || ""
    );

    if (!canDelete) {
      alert("ليس لديك صلاحية لحذف التقارير");
      return;
    }

    // In a real app, this would be an API call
    setReports((prevReports) => prevReports.filter((report) => report.id !== id));
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
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="app-button-danger !py-1 !px-3"
                        disabled={
                          !["المحلية", "الولاية", "الإتحادية", "مدير النظام"].includes(
                            user?.level || ""
                          )
                        }
                      >
                        حذف
                      </button>
                      <button className="app-button-secondary !py-1 !px-3">
                        عرض
                      </button>
                    </div>
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