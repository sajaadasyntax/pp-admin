"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import Link from 'next/link';

type SectorType = 'SOCIAL' | 'ECONOMIC' | 'ORGANIZATIONAL' | 'POLITICAL';
type SectorLevel = 'national' | 'region' | 'locality' | 'adminUnit' | 'district';

interface Sector {
  id: string;
  name: string;
  code?: string;
  sectorType: SectorType;
  description?: string;
  active: boolean;
}

const sectorTypeLabels: Record<SectorType, string> = {
  SOCIAL: 'الاجتماعي',
  ECONOMIC: 'الاقتصادي',
  ORGANIZATIONAL: 'التنظيمي',
  POLITICAL: 'السياسي'
};

const sectorTypeColors: Record<SectorType, string> = {
  SOCIAL: 'bg-blue-100 text-blue-800',
  ECONOMIC: 'bg-green-100 text-green-800',
  ORGANIZATIONAL: 'bg-purple-100 text-purple-800',
  POLITICAL: 'bg-red-100 text-red-800'
};

const levelLabels: Record<SectorLevel, string> = {
  national: 'المستوى القومي',
  region: 'الولاية',
  locality: 'المحلية',
  adminUnit: 'الوحدة الإدارية',
  district: 'الحي'
};

const levelEndpoints: Record<SectorLevel, string> = {
  national: 'sector-national-levels',
  region: 'sector-regions',
  locality: 'sector-localities',
  adminUnit: 'sector-admin-units',
  district: 'sector-districts'
};

export default function SectorsPage() {
  const { user, token } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<SectorLevel>('national');
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sector | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sectorType: 'SOCIAL' as SectorType,
    description: '',
    active: true
  });

  const fetchSectors = async () => {
    try {
      setLoading(true);
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const endpoint = levelEndpoints[selectedLevel];
      const response = await fetch(`${apiUrl}/sector-hierarchy/${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSectors(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectors();
  }, [selectedLevel, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const endpoint = levelEndpoints[selectedLevel];
      const url = editing 
        ? `${apiUrl}/sector-hierarchy/${endpoint}/${editing.id}`
        : `${apiUrl}/sector-hierarchy/${endpoint}`;
      
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditing(null);
        setFormData({ name: '', code: '', sectorType: 'SOCIAL', description: '', active: true });
        fetchSectors();
      }
    } catch (error) {
      alert('فشل في حفظ البيانات');
    }
  };

  const handleEdit = (sector: Sector) => {
    setEditing(sector);
    setFormData({
      name: sector.name,
      code: sector.code || '',
      sectorType: sector.sectorType,
      description: sector.description || '',
      active: sector.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const endpoint = levelEndpoints[selectedLevel];
      await fetch(`${apiUrl}/sector-hierarchy/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });
      fetchSectors();
    } catch (error) {
      alert('فشل في الحذف');
    }
  };

  const sectorsByType = sectors.reduce((acc, sector) => {
    if (!acc[sector.sectorType]) acc[sector.sectorType] = [];
    acc[sector.sectorType].push(sector);
    return acc;
  }, {} as Record<SectorType, Sector[]>);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التسلسل الهرمي للقطاعات</h1>
          <p className="text-gray-600 mt-1">القطاعات الأربعة عبر جميع المستويات</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({ name: '', code: '', sectorType: 'SOCIAL', description: '', active: true });
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          + إضافة قطاع
        </button>
      </div>

      {/* Level Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(levelLabels) as SectorLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => {
                setSelectedLevel(level);
                setShowForm(false);
                setEditing(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedLevel === level
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {levelLabels[level]}
            </button>
          ))}
        </div>
      </div>

      {/* Form Panel */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editing ? 'تعديل القطاع' : `إضافة قطاع جديد - ${levelLabels[selectedLevel]}`}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع القطاع *</label>
                <select
                  value={formData.sectorType}
                  onChange={(e) => setFormData({ ...formData, sectorType: e.target.value as SectorType })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="SOCIAL">الاجتماعي</option>
                  <option value="ECONOMIC">الاقتصادي</option>
                  <option value="ORGANIZATIONAL">التنظيمي</option>
                  <option value="POLITICAL">السياسي</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكود</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label className="mr-2 text-sm text-gray-700">فعال</label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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

      {/* Sectors by Type */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : sectors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">💼</div>
          <p className="text-gray-600">لا توجد قطاعات في {levelLabels[selectedLevel]}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(['SOCIAL', 'ECONOMIC', 'ORGANIZATIONAL', 'POLITICAL'] as SectorType[]).map((type) => {
            const typeSectors = sectorsByType[type] || [];
            if (typeSectors.length === 0) return null;

            return (
              <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    قطاع {sectorTypeLabels[type]}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${sectorTypeColors[type]}`}>
                    {typeSectors.length} قطاع
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeSectors.map((sector) => (
                    <div
                      key={sector.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{sector.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          sector.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {sector.active ? 'فعال' : 'غير فعال'}
                        </span>
                      </div>
                      {sector.code && (
                        <p className="text-sm text-gray-500 mb-2">الكود: {sector.code}</p>
                      )}
                      {sector.description && (
                        <p className="text-sm text-gray-600 mb-3">{sector.description}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(sector)}
                          className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm font-medium"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(sector.id)}
                          className="flex-1 px-3 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm font-medium"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
