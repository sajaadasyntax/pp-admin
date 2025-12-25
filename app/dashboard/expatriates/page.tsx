"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import Link from 'next/link';

interface HierarchyStats {
  nationalLevels: number;
  regions: number;
  localities: number;
  adminUnits: number;
  districts: number;
  users: number;
}

export default function ExpatriatesPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<HierarchyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Fetch national levels to get count
        const nlResponse = await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-national-levels`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const nlData = nlResponse.ok ? await nlResponse.json() : [];

        // Fetch regions to get count
        const regResponse = await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-regions`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const regData = regResponse.ok ? await regResponse.json() : [];

        setStats({
          nationalLevels: Array.isArray(nlData) ? nlData.length : 0,
          regions: Array.isArray(regData) ? regData.length : 0,
          localities: 0, // Will be fetched when we have regions
          adminUnits: 0,
          districts: 0,
          users: Array.isArray(regData) ? regData.reduce((sum: number, r: any) => sum + (r._count?.users || 0), 0) : 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const hierarchyCards = [
    {
      title: 'المستوى القومي',
      icon: '🌍',
      href: '/dashboard/expatriates/national-levels',
      count: stats?.nationalLevels || 0,
      color: 'from-purple-400 to-purple-600',
      description: 'إدارة المستويات القومية للمغتربين'
    },
    {
      title: 'القطاعات',
      icon: '✈️',
      href: '/dashboard/expatriates/regions',
      count: stats?.regions || 0,
      color: 'from-cyan-400 to-cyan-600',
      description: 'إدارة قطاعات المغتربين حول العالم'
    },
    {
      title: 'المحليات',
      icon: '🏘️',
      href: '/dashboard/expatriates/localities',
      count: stats?.localities || 0,
      color: 'from-green-400 to-green-600',
      description: 'إدارة محليات المغتربين'
    },
    {
      title: 'الوحدات الإدارية',
      icon: '🏢',
      href: '/dashboard/expatriates/admin-units',
      count: stats?.adminUnits || 0,
      color: 'from-orange-400 to-orange-600',
      description: 'إدارة الوحدات الإدارية للمغتربين'
    },
    {
      title: 'الأحياء',
      icon: '🏠',
      href: '/dashboard/expatriates/districts',
      count: stats?.districts || 0,
      color: 'from-red-400 to-red-600',
      description: 'إدارة أحياء المغتربين'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">المغتربين</h1>
        <p className="text-gray-600 text-lg">إدارة التسلسل الهرمي للمغتربين - نظام منفصل عن التسلسل الهرمي الجغرافي</p>
      </div>

      {/* Info Banner */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6 mb-8">
        <div className="flex items-start">
          <span className="text-3xl ml-4">ℹ️</span>
          <div>
            <h3 className="text-cyan-900 font-semibold text-lg mb-2">عن نظام المغتربين</h3>
            <p className="text-cyan-800">
              نظام المغتربين هو تسلسل هرمي مماثل للتسلسل الجغرافي، يتضمن 5 مستويات: 
              المستوى القومي ← القطاعات ← المحليات ← الوحدات الإدارية ← الأحياء.
              يمكن إدارة المستخدمين والمسؤولين والقطاعات في كل مستوى.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{stats?.regions || 0}</div>
          <div className="text-sm text-gray-600 mt-1">إجمالي القطاعات</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-green-600">{stats?.localities || 0}</div>
          <div className="text-sm text-gray-600 mt-1">إجمالي المحليات</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-blue-600">{stats?.users || 0}</div>
          <div className="text-sm text-gray-600 mt-1">إجمالي المستخدمين</div>
        </div>
      </div>

      {/* Hierarchy Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hierarchyCards.map((card, index) => (
          <Link
            key={index}
            href={card.href}
            className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
          >
            <div className={`h-2 bg-gradient-to-r ${card.color}`}></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{card.icon}</div>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {card.count}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
                {card.title}
              </h3>
              <p className="text-sm text-gray-600">{card.description}</p>
              <div className="mt-4 flex items-center text-cyan-600 text-sm font-medium">
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
  );
}
