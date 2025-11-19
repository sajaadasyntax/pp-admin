"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Region {
  id: string;
  name: string;
}

interface Locality {
  id: string;
  name: string;
  regionId: string;
}

interface AdminUnit {
  id: string;
  name: string;
  localityId: string;
  locality?: Locality;
}

interface District {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  adminUnitId: string;
  adminUnit?: AdminUnit;
  _count?: {
    users: number;
  };
}

export default function DistrictsPage() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const [districts, setDistricts] = useState<District[]>([]);
  const [adminUnits, setAdminUnits] = useState<AdminUnit[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedAdminUnit, setSelectedAdminUnit] = useState<string | null>(
    searchParams.get('adminUnit') || null
  );
  const [selectedLocality, setSelectedLocality] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<District | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    adminUnitId: ''
  });

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!token) throw new Error('No authentication token');
    
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  }, [token]);

  const fetchRegions = useCallback(async () => {
    try {
      const data = await apiCall('/hierarchy/regions');
      setRegions(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [apiCall]);

  const fetchLocalities = useCallback(async (regionId: string) => {
    try {
      const data = await apiCall(`/hierarchy/regions/${regionId}/localities`);
      setLocalities(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [apiCall]);

  const fetchAdminUnits = useCallback(async (localityId: string) => {
    try {
      const data = await apiCall(`/hierarchy/localities/${localityId}/admin-units`);
      setAdminUnits(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [apiCall]);

  const fetchDistricts = useCallback(async (adminUnitId: string) => {
    try {
      setLoading(true);
      const data = await apiCall(`/hierarchy/admin-units/${adminUnitId}/districts`);
      setDistricts(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  useEffect(() => {
    if (selectedRegion) {
      fetchLocalities(selectedRegion);
    } else {
      setLocalities([]);
      setAdminUnits([]);
    }
  }, [selectedRegion, fetchLocalities]);

  useEffect(() => {
    if (selectedLocality) {
      fetchAdminUnits(selectedLocality);
    } else {
      setAdminUnits([]);
    }
  }, [selectedLocality, fetchAdminUnits]);

  useEffect(() => {
    if (selectedAdminUnit) {
      fetchDistricts(selectedAdminUnit);
      setFormData(prev => ({ ...prev, adminUnitId: selectedAdminUnit }));
    } else {
      setDistricts([]);
    }
  }, [selectedAdminUnit, fetchDistricts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.adminUnitId) {
      alert('الرجاء إدخال الاسم واختيار الوحدة الإدارية');
      return;
    }

    try {
      if (editing) {
        await apiCall(`/hierarchy/districts/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name.trim(),
            code: formData.code.trim(),
            description: formData.description.trim()
          }),
        });
      } else {
        await apiCall(`/hierarchy/admin-units/${formData.adminUnitId}/districts`, {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name.trim(),
            code: formData.code.trim(),
            description: formData.description.trim()
          }),
        });
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', code: '', description: '', adminUnitId: selectedAdminUnit || '' });
      if (selectedAdminUnit) fetchDistricts(selectedAdminUnit);
    } catch (error) {
      alert('فشل في حفظ البيانات');
    }
  };

  const handleEdit = (district: District) => {
    setEditing(district);
    setFormData({
      name: district.name,
      code: district.code || '',
      description: district.description || '',
      adminUnitId: district.adminUnitId
    });
    setShowForm(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiCall(`/hierarchy/districts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentStatus }),
      });
      if (selectedAdminUnit) fetchDistricts(selectedAdminUnit);
    } catch (error) {
      alert('فشل في تحديث الحالة');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الأحياء</h1>
          <p className="text-gray-600 mt-1">إدارة الأحياء والمناطق السكنية</p>
        </div>
        <button
          onClick={() => {
            if (!selectedAdminUnit) {
              alert('الرجاء اختيار وحدة إدارية أولاً');
              return;
            }
            setShowForm(true);
            setEditing(null);
            setFormData({ name: '', code: '', description: '', adminUnitId: selectedAdminUnit });
          }}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
          disabled={!selectedAdminUnit}
        >
          + إضافة حي
        </button>
      </div>

      {/* Navigation Selectors */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-3">اختر الولاية</h2>
          <div className="flex flex-wrap gap-2">
            {regions.map(region => (
              <button
                key={region.id}
                onClick={() => {
                  setSelectedRegion(region.id);
                  setSelectedLocality(null);
                  setSelectedAdminUnit(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedRegion === region.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>
        </div>
        {selectedRegion && (
          <div>
            <h2 className="text-lg font-semibold mb-3">اختر المحلية</h2>
            <div className="flex flex-wrap gap-2">
              {localities.map(locality => (
                <button
                  key={locality.id}
                  onClick={() => {
                    setSelectedLocality(locality.id);
                    setSelectedAdminUnit(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedLocality === locality.id
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {locality.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {selectedLocality && (
          <div>
            <h2 className="text-lg font-semibold mb-3">اختر الوحدة الإدارية</h2>
            <div className="flex flex-wrap gap-2">
              {adminUnits.map(adminUnit => (
                <button
                  key={adminUnit.id}
                  onClick={() => setSelectedAdminUnit(adminUnit.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedAdminUnit === adminUnit.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {adminUnit.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form Panel */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editing ? 'تعديل الحي' : 'إضافة حي جديد'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة الإدارية *</label>
              <select
                value={formData.adminUnitId}
                onChange={(e) => setFormData({ ...formData, adminUnitId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">اختر الوحدة الإدارية</option>
                {adminUnits.map(adminUnit => (
                  <option key={adminUnit.id} value={adminUnit.id}>{adminUnit.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكود</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                {editing ? 'تحديث' : 'إضافة'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Districts List */}
      {!selectedAdminUnit ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-gray-600">الرجاء اختيار وحدة إدارية لعرض الأحياء</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : districts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-gray-600">لا توجد أحياء في هذه الوحدة الإدارية</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {districts.map((district) => (
            <div
              key={district.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{district.name}</h3>
                  {district.code && (
                    <span className="text-sm text-gray-500">الكود: {district.code}</span>
                  )}
                  {district.description && (
                    <p className="text-sm text-gray-600 mt-2">{district.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleStatus(district.id, district.active)}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    district.active
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {district.active ? 'فعال' : 'غير فعال'}
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <span>المستخدمين: <strong>{district._count?.users || 0}</strong></span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(district)}
                  className="flex-1 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-sm font-medium"
                >
                  تعديل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back Link */}
      <div className="mt-6">
        <Link href="/dashboard/hierarchy" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          العودة للتسلسل الهرمي
        </Link>
      </div>
    </div>
  );
}
