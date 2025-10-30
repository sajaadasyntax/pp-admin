"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("No user found, redirecting to login...");
      window.location.href = "/login";
    }
  }, [user, isLoading]);

  // Handle navigation with loading state
  const handleNavigation = (path: string) => {
    setIsNavigating(true);
    window.location.href = path;
  };

  // Reset navigation state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // Mock notification count
  useEffect(() => {
    setNotificationCount(3);
  }, []);

  // Show loading state only during initial load
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary-500)] border-t-transparent"></div>
          <div className="text-xl text-[var(--neutral-600)]">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  // Don't render anything if no user
  if (!user) {
    return null;
  }

  const handleLogout = () => {
    setIsNavigating(true);
    logout();
    window.location.href = "/login";
  };

  const navItems = [
    { name: "الرئيسية", path: "/dashboard" },
    { name: "التقارير", path: "/dashboard/reports" },
    { name: "الاشتراكات", path: "/dashboard/subscriptions" },
    { name: "التصويت والاستطلاعات", path: "/dashboard/voting-surveys" },
    { name: "النشرة", path: "/dashboard/bulletin" },
    { name: "غرف المحادثة", path: "/dashboard/chatrooms" },
    { 
      name: "التسلسل الإداري", 
      path: "/dashboard/hierarchy",
      children: [
        { name: "نظرة عامة", path: "/dashboard/hierarchy" },
        { name: "المستوى القومي", path: "/dashboard/hierarchy/national-levels" },
        { name: "الولايات", path: "/dashboard/hierarchy/regions" },
        { name: "المحليات", path: "/dashboard/hierarchy/localities" },
        { name: "الوحدات الإدارية", path: "/dashboard/hierarchy/admin-units" },
        { name: "الأحياء", path: "/dashboard/hierarchy/districts" },
        { name: "المغتربين", path: "/dashboard/hierarchy/expatriates" },
        { name: "القطاعات", path: "/dashboard/hierarchy/sectors" },
      ]
    },
    // Only show these pages to root admin
    ...(user?.level === "مدير النظام" ? [
      { name: "العضويات", path: "/dashboard/memberships" },
      { name: "الأرشيف", path: "/dashboard/archive" },
      { name: "لجنة التصويت", path: "/dashboard/voting-committee" },
      { name: "طلبات الحذف", path: "/dashboard/deletion-requests" }
    ] : []),
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
          <nav className="flex-grow space-y-1 overflow-y-auto p-2">
            {navItems.map((item) => (
              <div key={item.path} className="mb-1">
                <Link
                  href={item.path}
                  className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm ${
                    pathname === item.path || (item.children && pathname.startsWith(item.path))
                      ? "bg-[var(--primary-50)] text-[var(--primary-600)]"
                      : "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!item.children) {
                      setIsMobileMenuOpen(false);
                      handleNavigation(item.path);
                    } else {
                      // Toggle submenu
                      const submenu = document.getElementById(`submenu-${item.name}`);
                      if (submenu) {
                        submenu.classList.toggle('hidden');
                      }
                    }
                  }}
                >
                  <span>{item.name}</span>
                  <div className="flex items-center">
                    {item.name === "الإشعارات" && notificationCount > 0 && (
                      <span className="mr-2 rounded-full bg-[var(--error-500)] px-2 py-1 text-xs text-white">
                        {notificationCount}
                      </span>
                    )}
                    {item.children && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </Link>
                
                {/* Submenu */}
                {item.children && (
                  <div 
                    id={`submenu-${item.name}`} 
                    className={`mr-4 mt-1 space-y-1 border-r border-[var(--neutral-200)] pr-2 ${
                      pathname.startsWith(item.path) ? '' : 'hidden'
                    }`}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        href={child.path}
                        className={`block rounded-xl px-3 py-2 text-sm ${
                          pathname === child.path
                            ? "bg-[var(--primary-50)] text-[var(--primary-600)]"
                            : "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          setIsMobileMenuOpen(false);
                          handleNavigation(child.path);
                        }}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
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
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {isNavigating ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary-500)] border-t-transparent"></div>
              <div className="text-xl text-[var(--neutral-600)]">جاري التحميل...</div>
            </div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
} 