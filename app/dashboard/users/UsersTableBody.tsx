"use client";

interface User {
  id: string;
  email: string;
  mobileNumber: string;
  role: string;
  adminLevel: string;
  activeHierarchy?: string;
  profile?: { firstName?: string; lastName?: string; status?: string };
  hierarchyStatuses?: Record<string, string>;
  createdAt: string;
  region?: { id: string; name: string };
  locality?: { id: string; name: string };
  adminUnit?: { id: string; name: string };
  district?: { id: string; name: string };
  expatriateRegion?: { id: string; name: string };
  sectorNationalLevel?: { id: string; name: string };
  sectorRegion?: { id: string; name: string };
  sectorLocality?: { id: string; name: string };
  sectorAdminUnit?: { id: string; name: string };
  sectorDistrict?: { id: string; name: string };
}

interface UsersTableBodyProps {
  users: User[];
  getHierarchyCount: (u: User) => number;
  getHierarchyText: (u: User) => string;
  getExpatriateText: (u: User) => string;
  getSectorText: (u: User) => string;
  getAdminLevelLabel: (s: string) => string;
  getActiveHierarchyLabel: (s?: string) => string;
  onToggleStatus: (id: string) => void;
  onPasswordReset: (id: string) => void;
  onDeleteUser: (id: string) => void;
}

export function UsersTableBody({
  users,
  getHierarchyCount,
  getHierarchyText,
  getExpatriateText,
  getSectorText,
  getAdminLevelLabel,
  getActiveHierarchyLabel,
  onToggleStatus,
  onPasswordReset,
  onDeleteUser,
}: UsersTableBodyProps) {
  if (users.length === 0) {
    return (
      <tr>
        <td colSpan={8} className="px-4 py-8 text-center text-[var(--neutral-500)]">
          لا توجد نتائج
        </td>
      </tr>
    );
  }

  return (
    <>
      {users.map((user) => {
        const hCount = getHierarchyCount(user);
        const geoText = getHierarchyText(user);
        const expText = getExpatriateText(user);
        const secText = getSectorText(user);
        const hStatuses = user.hierarchyStatuses || {};
        return (
          <tr key={user.id} className="border-b border-[var(--neutral-200)]">
            <td className="px-4 py-2">
              <div className="flex flex-col">
                <span className="font-medium">
                  {user.profile?.firstName && user.profile?.lastName
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user.email}
                </span>
                <span className="text-xs text-[var(--neutral-500)]">{user.email || ""}</span>
              </div>
            </td>
            <td className="px-4 py-2 text-sm">{user.mobileNumber || "غير محدد"}</td>
            <td className="px-4 py-2">
              <span className="rounded-full bg-[var(--primary-100)] px-2 py-1 text-xs font-medium text-[var(--primary-600)]">
                {getAdminLevelLabel(user.adminLevel)}
              </span>
            </td>
            <td className="px-4 py-2">
              <div className="flex flex-col gap-1 text-xs">
                {geoText && geoText !== "غير محدد" && (
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" title="جغرافي" />
                    <span className="text-green-700">{geoText}</span>
                    {hStatuses["ORIGINAL"] === "suspended" || hStatuses["ORIGINAL"] === "disabled" ? (
                      <span className="rounded bg-red-100 px-1 text-[10px] text-red-600">موقوف</span>
                    ) : null}
                  </div>
                )}
                {expText && (
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500" title="مغتربين" />
                    <span className="text-blue-700">{expText}</span>
                    {hStatuses["EXPATRIATE"] === "suspended" || hStatuses["EXPATRIATE"] === "disabled" ? (
                      <span className="rounded bg-red-100 px-1 text-[10px] text-red-600">موقوف</span>
                    ) : null}
                  </div>
                )}
                {secText && (
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500" title="قطاع" />
                    <span className="text-orange-700">{secText}</span>
                    {hStatuses["SECTOR"] === "suspended" || hStatuses["SECTOR"] === "disabled" ? (
                      <span className="rounded bg-red-100 px-1 text-[10px] text-red-600">موقوف</span>
                    ) : null}
                  </div>
                )}
                {hCount === 0 && <span className="text-[var(--neutral-400)]">غير محدد</span>}
                {hCount > 1 && (
                  <span className="mt-0.5 inline-block rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                    متعدد التسلسلات ({hCount})
                  </span>
                )}
              </div>
            </td>
            <td className="px-4 py-2">
              <span className="inline-block rounded-full bg-[var(--neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--neutral-700)]">
                {getActiveHierarchyLabel(user.activeHierarchy)}
              </span>
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
            <td className="px-4 py-2 text-sm">
              {new Date(user.createdAt).toLocaleDateString("ar-EG")}
            </td>
            <td className="px-4 py-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onToggleStatus(user.id)}
                  className="app-button-secondary text-xs"
                >
                  {user.profile?.status === "active" ? "تعطيل" : "تفعيل"}
                </button>
                <button
                  onClick={() => onPasswordReset(user.id)}
                  className="app-button-secondary text-xs"
                >
                  إعادة تعيين
                </button>
                <button
                  onClick={() => onDeleteUser(user.id)}
                  className="app-button-danger text-xs"
                >
                  حذف
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}
