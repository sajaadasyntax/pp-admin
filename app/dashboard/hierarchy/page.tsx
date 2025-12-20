"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import Link from 'next/link';

interface HierarchyStats {
  regions: number;
  localities: number;
  adminUnits: number;
  districts: number;
  totalUsers: number;
  nationalLevels?: number;
}

export default function HierarchyPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<HierarchyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/hierarchical-users/stats`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const hierarchyLevels = [
    {
      title: 'المستوى القومي',
      icon: '🌟',
      href: '/dashboard/hierarchy/national-levels',
      count: stats?.nationalLevels || 1,
      color: 'from-yellow-400 to-yellow-600',
      description: 'أعلى مستوى في التسلسل الهرمي'
    },
    {
      title: 'الولايات',
      icon: '🏛️',
      href: '/dashboard/hierarchy/regions',
      count: stats?.regions || 0,
      color: 'from-blue-400 to-blue-600',
      description: 'إدارة الولايات والمناطق'
    },
    {
      title: 'المحليات',
      icon: '🏘️',
      href: '/dashboard/hierarchy/localities',
      count: stats?.localities || 0,
      color: 'from-green-400 to-green-600',
      description: 'إدارة المحليات والمدن'
    },
    {
      title: 'الوحدات الإدارية',
      icon: '🏢',
      href: '/dashboard/hierarchy/admin-units',
      count: stats?.adminUnits || 0,
      color: 'from-purple-400 to-purple-600',
      description: 'إدارة الوحدات الإدارية'
    },
    {
      title: 'الأحياء',
      icon: '🏠',
      href: '/dashboard/hierarchy/districts',
      count: stats?.districts || 0,
      color: 'from-orange-400 to-orange-600',
      description: 'إدارة الأحياء والمناطق السكنية'
    },
    {
      title: 'القطاعات',
      icon: '📊',
      href: '/dashboard/hierarchy/sectors',
      count: 4,
      color: 'from-indigo-400 to-indigo-600',
      description: 'إدارة القطاعات الأربعة (الاجتماعي، الاقتصادي، التنظيمي، السياسي)'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">التسلسل الهرمي الجغرافي</h1>
        <p className="text-gray-600 text-lg">إدارة المستويات الإدارية الجغرافية (المستوى القومي → الولاية → المحلية → الوحدة الإدارية → الحي)</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{stats?.regions || 0}</div>
          <div className="text-sm text-gray-600 mt-1">الولايات</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{stats?.localities || 0}</div>
          <div className="text-sm text-gray-600 mt-1">المحليات</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{stats?.adminUnits || 0}</div>
          <div className="text-sm text-gray-600 mt-1">الوحدات الإدارية</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{stats?.districts || 0}</div>
          <div className="text-sm text-gray-600 mt-1">الأحياء</div>
        </div>
      </div>

      {/* Hierarchy Levels */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">المستويات الإدارية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hierarchyLevels.map((level) => (
            <Link
              key={level.href}
              href={level.href}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className={`h-2 bg-gradient-to-r ${level.color}`}></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{level.icon}</div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${level.color} text-white`}>
                    {level.count}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {level.title}
                </h3>
                <p className="text-sm text-gray-600">{level.description}</p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                  <span>إدارة</span>
                  <svg className="w-4 h-4 mr-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
