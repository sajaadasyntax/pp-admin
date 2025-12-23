"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import Link from 'next/link';

interface ExpatriateRegion {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  _count?: {
    users: number;
    sectorNationalLevels: number;
  };
}

export default function ExpatriatesPage() {
  const { user, token } = useAuth();
  const [regions, setRegions] = useState<ExpatriateRegion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegions = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/expatriate-hierarchy/expatriate-regions`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRegions(data.data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRegions();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">المغتربين</h1>
        <p className="text-gray-600 text-lg">إدارة قطاعات المغتربين (13 قطاع حول العالم) - نظام منفصل عن التسلسل الهرمي الجغرافي</p>
      </div>

      {/* Info Banner */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6 mb-8">
        <div className="flex items-start">
          <span className="text-3xl ml-4">ℹ️</span>
          <div>
            <h3 className="text-cyan-900 font-semibold text-lg mb-2">عن نظام المغتربين</h3>
            <p className="text-cyan-800">
              نظام المغتربين هو تسلسل هرمي منفصل تماماً عن التسلسل الهرمي الجغرافي. يتضمن 13 قطاع للمغتربين حول العالم.
              يمكن إنشاء القطاعات الأربعة (الاجتماعي، الاقتصادي، التنظيمي، السياسي) لكل قطاع من قطاعات المغتربين.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{regions.length}</div>
          <div className="text-sm text-gray-600 mt-1">إجمالي القطاعات</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-green-600">
            {regions.filter(r => r.active).length}
          </div>
          <div className="text-sm text-gray-600 mt-1">القطاعات الفعالة</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-blue-600">
            {regions.reduce((sum, r) => sum + (r._count?.users || 0), 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">إجمالي المستخدمين</div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/dashboard/expatriates/regions"
          className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
        >
          <div className="h-2 bg-gradient-to-r from-cyan-400 to-cyan-600"></div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-4xl">✈️</div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
              إدارة قطاعات المغتربين
            </h3>
            <p className="text-sm text-gray-600">عرض وإدارة جميع قطاعات المغتربين الـ 13</p>
            <div className="mt-4 flex items-center text-cyan-600 text-sm font-medium">
              <span>إدارة</span>
              <svg className="w-4 h-4 mr-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Regions Preview */}
      {regions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">قطاعات المغتربين</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.slice(0, 6).map((region) => (
              <div
                key={region.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{region.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    region.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {region.active ? 'فعال' : 'غير فعال'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span>المستخدمين: {region._count?.users || 0}</span>
                </div>
              </div>
            ))}
          </div>
          {regions.length > 6 && (
            <div className="mt-4 text-center">
              <Link
                href="/dashboard/expatriates/regions"
                className="text-cyan-600 hover:text-cyan-800 font-medium"
              >
                عرض جميع القطاعات ({regions.length})
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
