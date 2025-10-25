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
  expatriateRegions?: number;
  sectorLevels?: number;
}

export default function HierarchyPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<HierarchyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API base URL is imported from config

  // Fetch hierarchy statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/hierarchical-users/stats`, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching hierarchy stats:', error);
      setError('فشل في تحميل إحصائيات التسلسل الهرمي');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // Original Hierarchy Levels
  const originalHierarchy = [
    {
      title: 'المستوى القومي',
      description: 'إدارة المستوى القومي (أعلى مستوى)',
      icon: '🌟',
      href: '/dashboard/hierarchy/national-levels',
      count: stats?.nationalLevels || 1,
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      category: 'original'
    },
    {
      title: 'الولايات',
      description: 'إدارة الولايات والمناطق',
      icon: '🏛️',
      href: '/dashboard/hierarchy/regions',
      count: stats?.regions || 0,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      category: 'original'
    },
    {
      title: 'المحليات',
      description: 'إدارة المحليات والمدن',
      icon: '🏘️',
      href: '/dashboard/hierarchy/localities',
      count: stats?.localities || 0,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      category: 'original'
    },
    {
      title: 'الوحدات الإدارية',
      description: 'إدارة الوحدات الإدارية',
      icon: '🏢',
      href: '/dashboard/hierarchy/admin-units',
      count: stats?.adminUnits || 0,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      category: 'original'
    },
    {
      title: 'الأحياء',
      description: 'إدارة الأحياء والمناطق السكنية',
      icon: '🏠',
      href: '/dashboard/hierarchy/districts',
      count: stats?.districts || 0,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      category: 'original'
    }
  ];

  // New Hierarchy Types
  const newHierarchies = [
    {
      title: 'المغتربين',
      description: 'إدارة قطاعات المغتربين (13 قطاع)',
      icon: '✈️',
      href: '/dashboard/hierarchy/expatriates',
      count: stats?.expatriateRegions || 13,
      color: 'bg-cyan-500',
      hoverColor: 'hover:bg-cyan-600',
      category: 'expatriate'
    },
    {
      title: 'القطاعات',
      description: 'إدارة القطاعات (اجتماعي، اقتصادي، تنظيمي، سياسي)',
      icon: '💼',
      href: '/dashboard/hierarchy/sectors',
      count: stats?.sectorLevels || 0,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      category: 'sector'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة التسلسل الهرمي</h1>
        <p className="text-gray-600">إدارة المستويات الإدارية المختلفة في النظام</p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">🏛️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">الولايات</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.regions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">🏘️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">المحليات</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.localities || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">الوحدات الإدارية</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.adminUnits || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-2xl">🏠</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">الأحياء</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.districts || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Original Hierarchy Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">التسلسل الهرمي الجغرافي</h2>
          <span className="mr-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            التسلسل الأساسي
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {originalHierarchy.map((level, index) => (
            <Link
              key={index}
              href={level.href}
              className="group block bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="p-4 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors duration-200">
                    <span className="text-3xl">{level.icon}</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {level.title}
                    </h3>
                    <span className={`px-3 py-1 text-sm font-medium text-white rounded-full ${level.color}`}>
                      {level.count}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600 text-sm">{level.description}</p>
                  <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700">
                    <span className="text-sm font-medium">إدارة</span>
                    <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* New Hierarchies Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">التسلسلات الهرمية الجديدة</h2>
          <span className="mr-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            تم إضافتها حديثاً
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {newHierarchies.map((level, index) => (
            <Link
              key={index}
              href={level.href}
              className="group block bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="p-4 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors duration-200">
                    <span className="text-3xl">{level.icon}</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {level.title}
                    </h3>
                    <span className={`px-3 py-1 text-sm font-medium text-white rounded-full ${level.color}`}>
                      {level.count}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600 text-sm">{level.description}</p>
                  <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700">
                    <span className="text-sm font-medium">إدارة</span>
                    <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/hierarchy/regions?action=create"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
          >
            <span className="text-2xl mr-3">➕</span>
            <div>
              <p className="font-medium text-blue-900">إضافة ولاية جديدة</p>
              <p className="text-sm text-blue-700">إنشاء ولاية جديدة في النظام</p>
            </div>
          </Link>
          
          <Link
            href="/dashboard/hierarchy/users"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
          >
            <span className="text-2xl mr-3">👥</span>
            <div>
              <p className="font-medium text-green-900">إدارة المستخدمين</p>
              <p className="text-sm text-green-700">عرض وإدارة جميع المستخدمين</p>
            </div>
          </Link>
          
          <Link
            href="/dashboard/hierarchy/reports"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200"
          >
            <span className="text-2xl mr-3">📊</span>
            <div>
              <p className="font-medium text-purple-900">التقارير</p>
              <p className="text-sm text-purple-700">عرض تقارير التسلسل الهرمي</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}