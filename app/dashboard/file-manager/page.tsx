"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl } from "@/app/config/api";

// ── Shared error messages (must match backend constants/uploadErrors.ts) ──
const UPLOAD_ERRORS: Record<string, string> = {
  FILE_TOO_LARGE: "حجم الملف يتجاوز الحد المسموح",
  INVALID_FILE_TYPE: "نوع الملف غير مدعوم",
  NO_FILE_PROVIDED: "لم يتم تحديد ملف للرفع",
  UPLOAD_TOKEN_EXPIRED: "انتهت صلاحية رابط الرفع. يرجى طلب رابط جديد",
  NETWORK_TIMEOUT: "انتهت مهلة الاتصال. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى",
  UPLOAD_FAILED: "فشل رفع الملف. يرجى المحاولة مرة أخرى",
  FILE_NOT_FOUND: "الملف غير موجود",
  SERVER_ERROR: "حدث خطأ في الخادم. يرجى المحاولة لاحقاً",
};

function translateError(code?: string, fallback?: string): string {
  if (code && code in UPLOAD_ERRORS) return UPLOAD_ERRORS[code];
  return fallback || UPLOAD_ERRORS.SERVER_ERROR;
}

// ── Types ───────────────────────────────────────────────────────────
interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  path: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email?: string;
    mobileNumber?: string;
    memberDetails?: { fullName: string };
  };
}

interface CategoryStat {
  category: string;
  label: string;
  count: number;
  size: number;
  sizeFormatted: string;
}

interface UploadStats {
  totalFiles: number;
  totalSize: number;
  totalSizeFormatted: string;
  byCategory: CategoryStat[];
}

// ── Helpers ─────────────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  bulletin: "نشرة",
  archive: "أرشيف",
  report: "تقرير",
  voice: "صوتي",
  receipt: "إيصال",
};

const CATEGORY_COLORS: Record<string, string> = {
  bulletin: "bg-blue-100 text-blue-700",
  archive: "bg-amber-100 text-amber-700",
  report: "bg-green-100 text-green-700",
  voice: "bg-purple-100 text-purple-700",
  receipt: "bg-rose-100 text-rose-700",
};

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  deleted: "محذوف",
  quarantined: "معزول",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  deleted: "bg-red-100 text-red-700",
  quarantined: "bg-orange-100 text-orange-700",
};

// ── Component ───────────────────────────────────────────────────────
export default function FileManagerPage() {
  const { token } = useAuth();

  // Data
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch data ──────────────────────────────────────────────────
  const fetchFiles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));

      const res = await fetch(`${apiUrl}/uploads/files?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(translateError(data.code, data.error));
      setFiles(data.files);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error("Fetch files error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, categoryFilter, statusFilter, search, pagination.page]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/uploads/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err: any) {
      console.error("Fetch stats error:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, [fetchFiles, fetchStats]);

  // ── Actions ─────────────────────────────────────────────────────
  const handleDelete = async (id: string, hard = false) => {
    if (!token) return;
    setActionLoading(id);
    try {
      const url = hard
        ? `${apiUrl}/uploads/files/${id}?hard=true`
        : `${apiUrl}/uploads/files/${id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(translateError(data.code, data.error));
      setDeleteConfirm(null);
      fetchFiles();
      fetchStats();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">مدير الملفات</h1>
          <p className="text-sm text-[var(--neutral-500)]">
            عرض وإدارة جميع الملفات المرفوعة في النظام
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total */}
          <div className="rounded-2xl border border-[var(--neutral-200)] bg-[var(--card)] p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-50)]">
                <svg className="h-5 w-5 text-[var(--primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--neutral-500)]">إجمالي الملفات</p>
                <p className="text-xl font-bold text-[var(--neutral-900)]">{stats.totalFiles}</p>
              </div>
            </div>
          </div>

          {/* Total Size */}
          <div className="rounded-2xl border border-[var(--neutral-200)] bg-[var(--card)] p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--neutral-500)]">الحجم الإجمالي</p>
                <p className="text-xl font-bold text-[var(--neutral-900)]">{stats.totalSizeFormatted}</p>
              </div>
            </div>
          </div>

          {/* Per-category stats */}
          {stats.byCategory.slice(0, 2).map((cat) => (
            <div key={cat.category} className="rounded-2xl border border-[var(--neutral-200)] bg-[var(--card)] p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${CATEGORY_COLORS[cat.category]?.split(" ")[0] || "bg-gray-100"}`}>
                  <span className="text-sm font-bold">{cat.count}</span>
                </div>
                <div>
                  <p className="text-sm text-[var(--neutral-500)]">{cat.label}</p>
                  <p className="text-base font-semibold text-[var(--neutral-900)]">{cat.sizeFormatted}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category breakdown bar */}
      {stats && stats.byCategory.length > 0 && (
        <div className="rounded-2xl border border-[var(--neutral-200)] bg-[var(--card)] p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-[var(--neutral-700)]">توزيع الملفات حسب الفئة</h3>
          <div className="flex flex-wrap gap-3">
            {stats.byCategory.map((cat) => (
              <button
                key={cat.category}
                onClick={() => {
                  setCategoryFilter(cat.category === categoryFilter ? "" : cat.category);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all ${
                  categoryFilter === cat.category
                    ? "bg-[var(--primary-600)] text-white"
                    : CATEGORY_COLORS[cat.category] || "bg-gray-100 text-gray-700"
                }`}
              >
                <span>{cat.label}</span>
                <span className="rounded-full bg-white/20 px-1.5 text-xs">{cat.count}</span>
                <span className="text-xs opacity-70">{cat.sizeFormatted}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="بحث بإسم الملف..."
            className="flex-1 rounded-xl border border-[var(--neutral-200)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary-400)]"
          />
          <button
            type="submit"
            className="rounded-xl bg-[var(--primary-600)] px-4 py-2.5 text-sm text-white transition-colors hover:bg-[var(--primary-700)]"
          >
            بحث
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="rounded-xl border border-[var(--neutral-200)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none"
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="deleted">محذوف</option>
          <option value="quarantined">معزول</option>
        </select>
      </div>

      {/* Files Table */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--neutral-200)] bg-[var(--card)] shadow-sm">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]">
              <th className="px-4 py-3 font-semibold text-[var(--neutral-600)]">الملف</th>
              <th className="px-4 py-3 font-semibold text-[var(--neutral-600)]">الفئة</th>
              <th className="px-4 py-3 font-semibold text-[var(--neutral-600)]">الحجم</th>
              <th className="px-4 py-3 font-semibold text-[var(--neutral-600)]">الحالة</th>
              <th className="px-4 py-3 font-semibold text-[var(--neutral-600)]">الرافع</th>
              <th className="px-4 py-3 font-semibold text-[var(--neutral-600)]">التاريخ</th>
              <th className="px-4 py-3 font-semibold text-[var(--neutral-600)]">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary-500)] border-t-transparent" />
                    <span className="text-[var(--neutral-500)]">جاري التحميل...</span>
                  </div>
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[var(--neutral-500)]">
                  لا توجد ملفات مطابقة
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.id} className="border-b border-[var(--neutral-100)] transition-colors hover:bg-[var(--neutral-50)]">
                  {/* File info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--neutral-100)]">
                        {file.mimeType.startsWith("image/") ? (
                          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : file.mimeType.startsWith("audio/") ? (
                          <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 text-[var(--neutral-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="max-w-[200px] truncate text-sm font-medium text-[var(--neutral-800)]" title={file.originalName}>
                          {file.originalName}
                        </p>
                        <p className="text-xs text-[var(--neutral-400)]">{file.mimeType}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${CATEGORY_COLORS[file.category] || "bg-gray-100 text-gray-700"}`}>
                      {CATEGORY_LABELS[file.category] || file.category}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="px-4 py-3 text-sm text-[var(--neutral-600)]">{formatSize(file.size)}</td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[file.status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[file.status] || file.status}
                    </span>
                  </td>

                  {/* Uploader */}
                  <td className="px-4 py-3 text-sm text-[var(--neutral-600)]">
                    {file.user?.memberDetails?.fullName || file.user?.mobileNumber || "—"}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-[var(--neutral-500)]">{formatDate(file.createdAt)}</td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* View / Download */}
                      <a
                        href={`${apiUrl.replace("/api", "")}${file.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-[var(--neutral-500)] transition-colors hover:bg-[var(--neutral-100)] hover:text-[var(--primary-600)]"
                        title="عرض / تحميل"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>

                      {/* Delete */}
                      {file.status === "active" && (
                        <button
                          onClick={() => setDeleteConfirm(file.id)}
                          className="rounded-lg p-1.5 text-[var(--neutral-500)] transition-colors hover:bg-red-50 hover:text-red-600"
                          title="حذف"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--neutral-500)]">
            عرض {files.length} من {pagination.total} ملف
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="rounded-xl border border-[var(--neutral-200)] bg-[var(--card)] px-3 py-2 text-sm transition-colors hover:bg-[var(--neutral-50)] disabled:opacity-40"
            >
              السابق
            </button>
            <span className="flex items-center rounded-xl bg-[var(--primary-50)] px-3 py-2 text-sm font-medium text-[var(--primary-600)]">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="rounded-xl border border-[var(--neutral-200)] bg-[var(--card)] px-3 py-2 text-sm transition-colors hover:bg-[var(--neutral-50)] disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-md rounded-2xl bg-[var(--card)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-bold text-[var(--neutral-900)]">تأكيد الحذف</h3>
            <p className="mb-6 text-sm text-[var(--neutral-600)]">
              هل أنت متأكد من حذف هذا الملف؟ يمكنك اختيار الحذف المؤقت (يمكن استرجاعه) أو الحذف النهائي.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm, false)}
                disabled={actionLoading === deleteConfirm}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
              >
                {actionLoading === deleteConfirm ? "جاري..." : "حذف مؤقت"}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm, true)}
                disabled={actionLoading === deleteConfirm}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === deleteConfirm ? "جاري..." : "حذف نهائي"}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl border border-[var(--neutral-200)] px-4 py-2.5 text-sm transition-colors hover:bg-[var(--neutral-50)]"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
