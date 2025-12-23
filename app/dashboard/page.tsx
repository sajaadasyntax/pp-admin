"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { apiClient } from "../context/apiContext";

// Define the activity type
interface RecentActivity {
  id: number;
  type: string;
  title: string;
  user: string;
  time: string;
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats state
  const [stats, setStats] = useState([
    { title: "إجمالي التقارير", value: 0, bgColor: "bg-[var(--primary-500)]" },
    { title: "المستخدمين النشطين", value: 0, bgColor: "bg-[var(--success-500)]" },
    { title: "الاشتراكات النشطة", value: 0, bgColor: "bg-[var(--accent-500)]" },
    { title: "التصويتات النشطة", value: 0, bgColor: "bg-[var(--error-500)]" },
  ]);

  // Recent activities state with proper typing
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Update stats with placeholder data
        // TODO: Fetch real data from the backend when endpoints are available
        setStats([
          { title: "إجمالي التقارير", value: 0, bgColor: "bg-[var(--primary-500)]" },
          { title: "المستخدمين النشطين", value: 0, bgColor: "bg-[var(--success-500)]" },
          { title: "الاشتراكات النشطة", value: 0, bgColor: "bg-[var(--accent-500)]" },
          { title: "التصويتات النشطة", value: 0, bgColor: "bg-[var(--error-500)]" },
        ]);
        
        // TODO: Fetch recent activities from API when endpoint is available
        setRecentActivities([]);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("حدث خطأ أثناء تحميل بيانات لوحة المعلومات");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [token]);

  // Function to handle navigation
  const navigateTo = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary-500)] border-t-transparent"></div>
          <div className="text-xl text-[var(--neutral-600)]">جاري تحميل لوحة المعلومات...</div>
        </div>
      </div>
    );
  }

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

      {/* Error message */}
      {error && (
        <div className="app-card bg-[var(--error-100)] text-[var(--error-700)]">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="app-card transition-all hover:shadow-md overflow-hidden cursor-pointer"
            onClick={() => {
              const paths = [
                "/dashboard/reports", 
                "/dashboard/hierarchy", 
                "/dashboard/subscriptions", 
                "/dashboard/voting"
              ];
              navigateTo(paths[index]);
            }}
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
                <p className="text-2xl font-bold text-[var(--neutral-900)]">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="app-card">
        <h2 className="mb-4 text-lg font-medium text-[var(--neutral-900)]">النشاطات الأخيرة</h2>
        {recentActivities.length > 0 ? (
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
        ) : (
          <div className="text-center py-4 text-[var(--neutral-500)]">لا توجد نشاطات حديثة</div>
        )}
      </div>
    </div>
  );
} 