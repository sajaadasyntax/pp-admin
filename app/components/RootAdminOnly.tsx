"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface RootAdminOnlyProps {
  children: ReactNode;
}

// Admin levels that can manage users (tiered access)
const USER_MANAGEMENT_LEVELS = [
  'ADMIN',
  'GENERAL_SECRETARIAT',
  'NATIONAL_LEVEL',
  'REGION',
  'LOCALITY',
  'ADMIN_UNIT',
  'DISTRICT'
];

export function RootAdminOnly({ children }: RootAdminOnlyProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Check if user has management-level access (can manage users in their scope)
  const hasManagementAccess = user && (
    user.level === "مدير النظام" || 
    USER_MANAGEMENT_LEVELS.includes(user.adminLevel)
  );

  useEffect(() => {
    if (!isLoading && !hasManagementAccess) {
      // User doesn't have management access, redirect to dashboard
      router.push("/dashboard");
    }
  }, [hasManagementAccess, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary-500)] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[var(--neutral-600)]">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user doesn't have management access
  if (!hasManagementAccess) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="app-card p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--error-600)] mb-4">غير مصرح بالوصول</h2>
          <p className="text-[var(--neutral-600)]">
            هذه الصفحة مخصصة للمسؤولين فقط.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  // User has management access, render children
  return <>{children}</>;
}
