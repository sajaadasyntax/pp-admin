"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../context/apiContext";
import RootAdminOnly from "../../components/RootAdminOnly";

interface User {
  id: string;
  email: string;
  mobileNumber: string;
  role: string;
  adminLevel: string;
  createdAt: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    status?: string;
  };
  region?: {
    id: string;
    name: string;
  };
  locality?: {
    id: string;
    name: string;
  };
  adminUnit?: {
    id: string;
    name: string;
  };
  district?: {
    id: string;
    name: string;
  };
}

interface AdminLevelFilter {
  value: string;
  label: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "admins">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdminLevel, setSelectedAdminLevel] = useState<string>("all");

  // Admin level filters based on hierarchy
  const adminLevelFilters: AdminLevelFilter[] = [
    { value: "all", label: "الكل" },
    { value: "GENERAL_SECRETARIAT", label: "الأمانة العامة" },
    { value: "NATIONAL_LEVEL", label: "المستوى الوطني" },
    { value: "REGION", label: "الولاية" },
    { value: "LOCALITY", label: "المحلية" },
    { value: "ADMIN_UNIT", label: "الوحدة الإدارية" },
    { value: "DISTRICT", label: "الحي" },
    { value: "EXPATRIATE_GENERAL", label: "عام المغتربين" },
    { value: "EXPATRIATE_REGION", label: "إقليم المغتربين" },
  ];

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const usersData = await apiClient.users.getAllUsers(token);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("فشل في تحميل بيانات المستخدمين. يرجى المحاولة مرة أخرى.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  // Filter users based on tab, search query, and admin level
  // Note: Hierarchy filtering is already done by the backend based on the authenticated admin's level
  useEffect(() => {
    let filtered = users;

    // Filter by tab (users vs admins)
    if (activeTab === "users") {
      filtered = filtered.filter((user) => user.role === "USER");
    } else {
      filtered = filtered.filter((user) => user.role === "ADMIN");
    }

    // Filter by admin level
    if (selectedAdminLevel !== "all") {
      filtered = filtered.filter((user) => user.adminLevel === selectedAdminLevel);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(query) ||
          user.mobileNumber?.toLowerCase().includes(query) ||
          user.profile?.firstName?.toLowerCase().includes(query) ||
          user.profile?.lastName?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, activeTab, searchQuery, selectedAdminLevel]);

  // Get hierarchy text for display
  const getHierarchyText = (user: User): string => {
    const parts: string[] = [];
    
    if (user.region) parts.push(user.region.name);
    if (user.locality) parts.push(user.locality.name);
    if (user.adminUnit) parts.push(user.adminUnit.name);
    if (user.district) parts.push(user.district.name);

    return parts.length > 0 ? parts.join(" > ") : "غير محدد";
  };

  // Get admin level label
  const getAdminLevelLabel = (adminLevel: string): string => {
    const filter = adminLevelFilters.find((f) => f.value === adminLevel);
    return filter ? filter.label : adminLevel;
  };

  // Handle user status toggle
  const handleToggleStatus = async (userId: string) => {
    if (!token) return;

    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      const newStatus = user.profile?.status === "active" ? "disabled" : "active";

      await apiClient.memberships.updateMembershipStatus(token, userId, newStatus);

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId
            ? {
                ...u,
                profile: {
                  ...u.profile,
                  status: newStatus,
                },
              }
            : u
        )
      );
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert("حدث خطأ أثناء تحديث حالة المستخدم");
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!token || !window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      return;
    }

    try {
      await apiClient.users.deleteUser(token, userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("تم حذف المستخدم بنجاح");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("حدث خطأ أثناء حذف المستخدم");
    }
  };

  // Handle password reset
  const handlePasswordReset = async (userId: string) => {
    if (!token) return;

    const newPassword = prompt("أدخل كلمة المرور الجديدة (6 أحرف على الأقل):");
    if (!newPassword || newPassword.length < 6) {
      alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    try {
      await apiClient.memberships.resetPassword(token, userId, newPassword);
      alert("تم إعادة تعيين كلمة المرور بنجاح");
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("حدث خطأ أثناء إعادة تعيين كلمة المرور");
    }
  };

  if (loading) {
    return (
      <RootAdminOnly>
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary-500)] border-t-transparent"></div>
            <div className="text-xl text-[var(--neutral-600)]">جاري التحميل...</div>
          </div>
        </div>
      </RootAdminOnly>
    );
  }

  return (
    <RootAdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">إدارة المستخدمين</h1>
          <button
            onClick={() => router.push("/dashboard/memberships")}
            className="app-button-primary"
          >
            إضافة مستخدم جديد
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-[var(--error-100)] p-4 text-[var(--error-600)]">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-[var(--neutral-200)]">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "users"
                ? "border-b-2 border-[var(--primary-500)] text-[var(--primary-600)]"
                : "text-[var(--neutral-600)] hover:text-[var(--neutral-900)]"
            }`}
          >
            المستخدمين ({users.filter((u) => u.role === "USER").length})
          </button>
          <button
            onClick={() => setActiveTab("admins")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "admins"
                ? "border-b-2 border-[var(--primary-500)] text-[var(--primary-600)]"
                : "text-[var(--neutral-600)] hover:text-[var(--neutral-900)]"
            }`}
          >
            المدراء ({users.filter((u) => u.role === "ADMIN").length})
          </button>
        </div>

        {/* Filters */}
        <div className="app-card">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Search Input */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                البحث
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                className="app-input"
              />
            </div>

            {/* Admin Level Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                المستوى الإداري
              </label>
              <select
                value={selectedAdminLevel}
                onChange={(e) => setSelectedAdminLevel(e.target.value)}
                className="app-input"
              >
                {adminLevelFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="app-card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--neutral-900)]">
              {activeTab === "users" ? "قائمة المستخدمين" : "قائمة المدراء"}
            </h2>
            <p className="text-sm text-[var(--neutral-600)]">
              عدد النتائج: {filteredUsers.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--neutral-200)]">
                  <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">
                    الاسم
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">
                    البريد الإلكتروني
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">
                    رقم الهاتف
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">
                    المستوى الإداري
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">
                    التسلسل الإداري
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">
                    الحالة
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">
                    تاريخ التسجيل
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[var(--neutral-500)]">
                      لا توجد نتائج
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[var(--neutral-200)]">
                      <td className="px-4 py-2">
                        {user.profile?.firstName && user.profile?.lastName
                          ? `${user.profile.firstName} ${user.profile.lastName}`
                          : user.email}
                      </td>
                      <td className="px-4 py-2">{user.email || "غير محدد"}</td>
                      <td className="px-4 py-2">{user.mobileNumber || "غير محدد"}</td>
                      <td className="px-4 py-2">
                        <span className="rounded-full bg-[var(--primary-100)] px-2 py-1 text-xs font-medium text-[var(--primary-600)]">
                          {getAdminLevelLabel(user.adminLevel)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-sm text-blue-600">{getHierarchyText(user)}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            user.profile?.status === "active"
                              ? "bg-[var(--success-100)] text-[var(--success-600)]"
                              : "bg-[var(--error-100)] text-[var(--error-600)]"
                          }`}
                        >
                          {user.profile?.status === "active" ? "نشط" : "معطل"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {new Date(user.createdAt).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/memberships/${user.id}`)}
                            className="app-button-primary text-xs"
                          >
                            عرض
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className="app-button-secondary text-xs"
                          >
                            {user.profile?.status === "active" ? "تعطيل" : "تفعيل"}
                          </button>
                          <button
                            onClick={() => handlePasswordReset(user.id)}
                            className="app-button-secondary text-xs"
                          >
                            إعادة تعيين
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="app-button-danger text-xs"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RootAdminOnly>
  );
}

