"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // Mock notification count
  useEffect(() => {
    setNotificationCount(3);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navItems = [
    { name: "الرئيسية", path: "/dashboard" },
    { name: "التقارير", path: "/dashboard/reports" },
    { name: "العضويات", path: "/dashboard/memberships" },
    { name: "الاشتراكات", path: "/dashboard/subscriptions" },
    { name: "التصويت", path: "/dashboard/voting" },
    { name: "الإشعارات", path: "/dashboard/notifications" },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)] md:flex-row">
      {/* Mobile Header */}
      <header className="bg-[var(--card)] p-4 shadow-md md:hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--primary-600)]">لوحة الإدارة</h1>
          <button
            type="button"
            className="rounded-full bg-[var(--primary-50)] p-2 text-[var(--primary-600)]"
            onClick={toggleMobileMenu}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 md:hidden" 
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 right-0 z-50 w-64 transform bg-[var(--card)] shadow-lg transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Dashboard Logo/Title */}
          <div className="border-b border-[var(--neutral-200)] p-4">
            <h1 className="text-xl font-bold text-[var(--primary-600)]">لوحة الإدارة</h1>
            <p className="mt-1 text-sm text-[var(--neutral-500)]">
              مستوى الإدارة: {user.level}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-grow space-y-1 p-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center rounded-xl px-3 py-3 text-sm ${
                  pathname === item.path
                    ? "bg-[var(--primary-50)] text-[var(--primary-600)]"
                    : "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>{item.name}</span>
                {item.name === "الإشعارات" && notificationCount > 0 && (
                  <span className="mr-2 rounded-full bg-[var(--error-500)] px-2 py-1 text-xs text-white">
                    {notificationCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* User Info and Logout */}
          <div className="border-t border-[var(--neutral-200)] p-4">
            <div className="mb-2 text-sm font-medium text-[var(--neutral-800)]">
              {user.name}
            </div>
            <button
              onClick={handleLogout}
              className="app-button-danger w-full justify-center"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </div>
  );
} 