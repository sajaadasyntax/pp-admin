"use client";

import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  // Mock statistics data
  const stats = [
    { title: "إجمالي التقارير", value: 75, bgColor: "bg-[var(--primary-500)]" },
    { title: "العضويات النشطة", value: 580, bgColor: "bg-[var(--success-500)]" },
    { title: "الاشتراكات النشطة", value: 240, bgColor: "bg-[var(--accent-500)]" },
    { title: "التصويتات النشطة", value: 12, bgColor: "bg-[var(--error-500)]" },
  ];

  // Mock recent activities
  const recentActivities = [
    {
      id: 1,
      type: "report",
      title: "تم إنشاء تقرير جديد",
      user: "أحمد محمد",
      time: "منذ 15 دقيقة",
    },
    {
      id: 2,
      type: "membership",
      title: "تم قبول عضوية جديدة",
      user: "سارة علي",
      time: "منذ 3 ساعات",
    },
    {
      id: 3,
      type: "subscription",
      title: "تم تعطيل اشتراك",
      user: "محمد أحمد",
      time: "منذ 5 ساعات",
    },
    {
      id: 4,
      type: "voting",
      title: "تم إنشاء تصويت جديد",
      user: "خالد عبدالله",
      time: "منذ 8 ساعات",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="app-card flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--neutral-900)]">
            مرحباً، {user?.name}
          </h1>
          <p className="text-sm text-[var(--neutral-500)]">
            هذه هي لوحة التحكم الخاصة بمستوى {user?.level}
          </p>
        </div>
        <div className="h-12 w-12 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-600)]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="app-card transition-all hover:shadow-md overflow-hidden"
          >
            <div className="flex items-center">
              <div
                className={`mr-4 rounded-xl ${stat.bgColor} p-3 text-white`}
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--neutral-500)]">{stat.title}</p>
                <p className="text-2xl font-bold text-[var(--neutral-900)]">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="app-card">
        <h2 className="mb-4 text-lg font-medium text-[var(--neutral-900)]">النشاطات الأخيرة</h2>
        <div className="divide-y divide-[var(--neutral-200)]">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--neutral-800)]">{activity.title}</p>
                  <p className="text-sm text-[var(--neutral-500)]">
                    بواسطة: {activity.user}
                  </p>
                </div>
                <span className="text-xs text-[var(--neutral-500)]">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="app-card">
        <h2 className="mb-4 text-lg font-medium text-[var(--neutral-900)]">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          <button className="app-button-primary">
            إنشاء تقرير
          </button>
          <button className="app-button-secondary">
            إدارة العضويات
          </button>
          <button className="app-button rounded-full bg-[var(--accent-100)] text-[var(--accent-700)] hover:bg-[var(--accent-200)]">
            إدارة الاشتراكات
          </button>
          <button className="app-button rounded-full bg-[var(--success-100)] text-[var(--success-600)] hover:bg-[var(--success-200)]">
            إنشاء تصويت
          </button>
        </div>
      </div>
    </div>
  );
} 