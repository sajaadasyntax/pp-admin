"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface RootAdminOnlyProps {
  children: ReactNode;
}

export default function RootAdminOnly({ children }: RootAdminOnlyProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.level !== "مدير النظام")) {
      // User is not root admin, redirect to dashboard
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

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

  // Show unauthorized message if user is not root admin
  if (!user || user.level !== "مدير النظام") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="app-card p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--error-600)] mb-4">غير مصرح بالوصول</h2>
          <p className="text-[var(--neutral-600)]">
            هذه الصفحة مخصصة لمدير النظام فقط.
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

  // User is root admin, render children
  return <>{children}</>;
}
