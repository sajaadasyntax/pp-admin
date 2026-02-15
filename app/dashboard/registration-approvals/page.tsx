"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl } from "../../config/api";
import { RootAdminOnly } from "../../components/RootAdminOnly";

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

interface PendingRegistration {
  id: string;
  fullName: string;
  nationalId: string | null;
  email: string | null;
  mobileNumber: string;
  hierarchyType: "GEOGRAPHIC" | "EXPATRIATE";
  registeredAt: string;
  status: string;
  geographicPath: string | null;
  expatriatePath: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type HierarchyFilter = "ALL" | "GEOGRAPHIC" | "EXPATRIATE";

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

export default function RegistrationApprovalsPage() {
  return (
    <RootAdminOnly>
      <RegistrationApprovalsContent />
    </RootAdminOnly>
  );
}

function RegistrationApprovalsContent() {
  const { token } = useAuth();

  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filters
  const [hierarchyFilter, setHierarchyFilter] = useState<HierarchyFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // -----------------------------------------------------------------------
  //  Fetch
  // -----------------------------------------------------------------------

  const fetchRegistrations = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("hierarchyType", hierarchyFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`${apiUrl}/users/pending-registrations?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setRegistrations(data.registrations || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Error fetching pending registrations:", err);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, [token, hierarchyFilter, debouncedSearch]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // -----------------------------------------------------------------------
  //  Actions
  // -----------------------------------------------------------------------

  const handleApprove = async (id: string) => {
    if (!token || !window.confirm("هل أنت متأكد من تفعيل هذا العضو؟")) return;

    try {
      setActionLoadingId(id);
      const res = await fetch(`${apiUrl}/users/pending-registrations/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "فشلت العملية");
      }

      alert("تم تفعيل العضو بنجاح");
      // Remove from local list
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    const reason = window.prompt("سبب الرفض (اختياري):");
    if (reason === null) return; // User cancelled prompt

    try {
      setActionLoadingId(id);
      const res = await fetch(`${apiUrl}/users/pending-registrations/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "فشلت العملية");
      }

      alert("تم رفض طلب التسجيل");
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (!token || registrations.length === 0) return;
    if (!window.confirm(`هل تريد تفعيل جميع الأعضاء المعروضين (${registrations.length})؟`)) return;

    setActionLoadingId("bulk");
    let approved = 0;

    for (const reg of registrations) {
      try {
        const res = await fetch(`${apiUrl}/users/pending-registrations/${reg.id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (res.ok) approved++;
      } catch {}
    }

    alert(`تم تفعيل ${approved} من ${registrations.length} عضو`);
    setActionLoadingId(null);
    fetchRegistrations();
  };

  // -----------------------------------------------------------------------
  //  Helpers
  // -----------------------------------------------------------------------

  const getHierarchyBadge = (type: string) => {
    if (type === "EXPATRIATE") {
      return { label: "مغتربين", className: "bg-blue-100 text-blue-700" };
    }
    return { label: "جغرافي", className: "bg-green-100 text-green-700" };
  };

  const geoCount = registrations.filter((r) => r.hierarchyType === "GEOGRAPHIC").length;
  const expCount = registrations.filter((r) => r.hierarchyType === "EXPATRIATE").length;

  // -----------------------------------------------------------------------
  //  Render
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary-500)] border-t-transparent" />
          <div className="text-[var(--neutral-600)]">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">طلبات التسجيل</h1>
          <p className="mt-1 text-sm text-[var(--neutral-500)]">
            مراجعة وتفعيل الأعضاء الجدد المسجلين عبر التطبيق
          </p>
        </div>
        {registrations.length > 0 && (
          <button
            onClick={handleBulkApprove}
            disabled={actionLoadingId === "bulk"}
            className="rounded-lg bg-[var(--success-500)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--success-600)] disabled:opacity-50"
          >
            {actionLoadingId === "bulk" ? "جاري التفعيل..." : `تفعيل الكل (${registrations.length})`}
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="app-card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--neutral-900)]">{pagination?.total || 0}</div>
            <div className="text-sm text-[var(--neutral-500)]">إجمالي الطلبات المعلقة</div>
          </div>
        </div>
        <div className="app-card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-700">{geoCount}</div>
            <div className="text-sm text-[var(--neutral-500)]">جغرافي (داخل السودان)</div>
          </div>
        </div>
        <div className="app-card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-700">{expCount}</div>
            <div className="text-sm text-[var(--neutral-500)]">مغتربين (خارج السودان)</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="app-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Search */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">البحث</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الهاتف أو البريد..."
              className="app-input"
            />
          </div>
          {/* Hierarchy filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">نوع العضوية</label>
            <div className="flex gap-2">
              {(["ALL", "GEOGRAPHIC", "EXPATRIATE"] as HierarchyFilter[]).map((f) => {
                const labels: Record<HierarchyFilter, string> = { ALL: "الكل", GEOGRAPHIC: "جغرافي", EXPATRIATE: "مغتربين" };
                const isActive = hierarchyFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setHierarchyFilter(f)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--primary-500)] text-white"
                        : "bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--neutral-200)]"
                    }`}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="app-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--neutral-900)]">الطلبات المعلقة</h2>
          <span className="text-sm text-[var(--neutral-500)]">
            {registrations.length} نتيجة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--neutral-200)]">
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--neutral-500)]">العضو</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--neutral-500)]">الرقم الوطني</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--neutral-500)]">نوع العضوية</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--neutral-500)]">الموقع</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--neutral-500)]">تاريخ التسجيل</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--neutral-500)]">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[var(--neutral-400)]">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-10 w-10 text-[var(--neutral-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>لا توجد طلبات تسجيل معلقة</span>
                    </div>
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => {
                  const badge = getHierarchyBadge(reg.hierarchyType);
                  const isActioning = actionLoadingId === reg.id;
                  const path = reg.hierarchyType === "EXPATRIATE" ? reg.expatriatePath : reg.geographicPath;

                  return (
                    <tr key={reg.id} className="border-b border-[var(--neutral-100)] hover:bg-[var(--neutral-50)]">
                      {/* Member info */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--neutral-900)]">{reg.fullName}</div>
                        <div className="text-xs text-[var(--neutral-500)]">{reg.mobileNumber}</div>
                        {reg.email && <div className="text-xs text-[var(--neutral-400)]">{reg.email}</div>}
                      </td>
                      {/* National ID */}
                      <td className="px-4 py-3 text-sm text-[var(--neutral-700)]">
                        {reg.nationalId || "—"}
                      </td>
                      {/* Hierarchy type badge */}
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      {/* Location path */}
                      <td className="max-w-[200px] px-4 py-3">
                        <span className="text-sm text-[var(--neutral-600)]" title={path || ""}>
                          {path || "—"}
                        </span>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 text-sm text-[var(--neutral-500)]">
                        {new Date(reg.registeredAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(reg.id)}
                            disabled={!!actionLoadingId}
                            className="rounded-md bg-[var(--success-100)] px-3 py-1.5 text-xs font-medium text-[var(--success-700)] hover:bg-[var(--success-200)] disabled:opacity-50"
                          >
                            {isActioning ? "..." : "تفعيل"}
                          </button>
                          <button
                            onClick={() => handleReject(reg.id)}
                            disabled={!!actionLoadingId}
                            className="rounded-md bg-[var(--error-100)] px-3 py-1.5 text-xs font-medium text-[var(--error-700)] hover:bg-[var(--error-200)] disabled:opacity-50"
                          >
                            {isActioning ? "..." : "رفض"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
