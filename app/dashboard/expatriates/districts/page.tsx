"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import Link from 'next/link';

interface ExpatriateRegion { id: string; name: string; }
interface ExpatriateLocality { id: string; name: string; expatriateRegionId: string; }
interface ExpatriateAdminUnit { id: string; name: string; expatriateLocalityId: string; }
interface ExpatriateDistrict {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  expatriateAdminUnitId: string;
  expatriateAdminUnit?: { id: string; name: string; expatriateLocalityId: string; expatriateLocality?: { id: string; name: string; expatriateRegionId: string; expatriateRegion?: ExpatriateRegion; }; };
  adminId?: string;
  admin?: { id: string; email?: string; mobileNumber: string; profile?: { firstName?: string; lastName?: string; }; memberDetails?: { fullName?: string; }; };
  _count?: { users: number; };
}
interface AdminUser { id: string; name: string; email?: string; mobileNumber: string; adminLevel: string; }
interface UserForManagement { id: string; name?: string; email?: string; mobileNumber: string; }

export default function ExpatriateDistrictsPage() {
  const { token } = useAuth();
  const [regions, setRegions] = useState<ExpatriateRegion[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [localities, setLocalities] = useState<ExpatriateLocality[]>([]);
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>('');
  const [adminUnits, setAdminUnits] = useState<ExpatriateAdminUnit[]>([]);
  const [selectedAdminUnitId, setSelectedAdminUnitId] = useState<string>('');
  const [districts, setDistricts] = useState<ExpatriateDistrict[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExpatriateDistrict | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', expatriateAdminUnitId: '', active: true });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExpatriateDistrict | null>(null);
  const [availableAdmins, setAvailableAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // User management
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedDistrictForUsers, setSelectedDistrictForUsers] = useState<ExpatriateDistrict | null>(null);
  const [currentUsers, setCurrentUsers] = useState<UserForManagement[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ mobileNumber: '', password: '', email: '', firstName: '', lastName: '', fullName: '' });

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!token) throw new Error('No token');
    const response = await fetch(`${apiUrl}${endpoint}`, { ...options, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...options.headers } });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }, [token]);

  const fetchRegions = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiCall('/expatriate-hierarchy/expatriate-regions');
      setRegions(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedRegionId) setSelectedRegionId(data[0].id);
    } catch (error) { console.error('Error:', error); }
  }, [token, apiCall, selectedRegionId]);

  const fetchLocalities = useCallback(async () => {
    if (!token || !selectedRegionId) return;
    try {
      const data = await apiCall(`/expatriate-hierarchy/expatriate-regions/${selectedRegionId}/localities`);
      setLocalities(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) setSelectedLocalityId(data[0].id);
      else { setSelectedLocalityId(''); setAdminUnits([]); setDistricts([]); }
    } catch (error) { console.error('Error:', error); }
  }, [token, selectedRegionId, apiCall]);

  const fetchAdminUnits = useCallback(async () => {
    if (!token || !selectedLocalityId) return;
    try {
      const data = await apiCall(`/expatriate-hierarchy/expatriate-localities/${selectedLocalityId}/admin-units`);
      setAdminUnits(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) setSelectedAdminUnitId(data[0].id);
      else { setSelectedAdminUnitId(''); setDistricts([]); }
    } catch (error) { console.error('Error:', error); }
  }, [token, selectedLocalityId, apiCall]);

  const fetchDistricts = useCallback(async () => {
    if (!token || !selectedAdminUnitId) return;
    setLoading(true);
    try {
      const data = await apiCall(`/expatriate-hierarchy/expatriate-admin-units/${selectedAdminUnitId}/districts`);
      setDistricts(Array.isArray(data) ? data : []);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  }, [token, selectedAdminUnitId, apiCall]);

  useEffect(() => { fetchRegions(); }, [fetchRegions]);
  useEffect(() => { if (selectedRegionId) fetchLocalities(); }, [selectedRegionId, fetchLocalities]);
  useEffect(() => { if (selectedLocalityId) fetchAdminUnits(); }, [selectedLocalityId, fetchAdminUnits]);
  useEffect(() => { if (selectedAdminUnitId) fetchDistricts(); }, [selectedAdminUnitId, fetchDistricts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) await apiCall(`/expatriate-hierarchy/expatriate-districts/${editing.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      else await apiCall('/expatriate-hierarchy/expatriate-districts', { method: 'POST', body: JSON.stringify({ ...formData, expatriateAdminUnitId: selectedAdminUnitId }) });
      setShowForm(false); setEditing(null); setFormData({ name: '', code: '', description: '', expatriateAdminUnitId: '', active: true }); fetchDistricts();
    } catch (error) { alert('حدث خطأ أثناء الحفظ'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (item: ExpatriateDistrict) => {
    setEditing(item);
    setFormData({ name: item.name, code: item.code || '', description: item.description || '', expatriateAdminUnitId: item.expatriateAdminUnitId, active: item.active });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    try { await apiCall(`/expatriate-hierarchy/expatriate-districts/${id}`, { method: 'DELETE' }); fetchDistricts(); }
    catch (error) { alert('حدث خطأ أثناء الحذف'); }
  };

  const fetchAvailableAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const response = await fetch(`${apiUrl}/users/available-admins?level=expatriate_district`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setAvailableAdmins(data.data || []); }
    } catch (error) { console.error('Error:', error); }
    finally { setLoadingAdmins(false); }
  };

  const handleManageAdmin = (item: ExpatriateDistrict) => { setSelectedItem(item); setShowAdminModal(true); fetchAvailableAdmins(); };

  const handleAssignAdmin = async (adminId: string | null) => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await apiCall(`/expatriate-hierarchy/expatriate-districts/${selectedItem.id}`, { method: 'PUT', body: JSON.stringify({ adminId }) });
      alert(adminId ? 'تم تعيين المسؤول بنجاح' : 'تم إلغاء تعيين المسؤول بنجاح');
      setShowAdminModal(false); fetchDistricts();
    } catch (error) { alert('فشل في تعيين المسؤول'); }
    finally { setSubmitting(false); }
  };

  const handleManageUsers = async (item: ExpatriateDistrict) => {
    setSelectedDistrictForUsers(item);
    setShowUserModal(true);
    setLoadingUsers(true);
    try {
      const users = await apiCall(`/expatriate-hierarchy/expatriate-districts/${item.id}/users`);
      setCurrentUsers(Array.isArray(users) ? users.map((u: any) => ({
        id: u.id,
        name: u.memberDetails?.fullName || u.profile?.firstName + ' ' + u.profile?.lastName || u.mobileNumber,
        email: u.email,
        mobileNumber: u.mobileNumber
      })) : []);
    } catch (error) { console.error('Error:', error); }
    finally { setLoadingUsers(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistrictForUsers) return;
    setCreatingUser(true);
    try {
      await apiCall(`/expatriate-hierarchy/expatriate-districts/${selectedDistrictForUsers.id}/users`, {
        method: 'POST',
        body: JSON.stringify(createUserForm)
      });
      alert('تم إنشاء المستخدم بنجاح');
      setShowCreateUserModal(false);
      setCreateUserForm({ mobileNumber: '', password: '', email: '', firstName: '', lastName: '', fullName: '' });
      handleManageUsers(selectedDistrictForUsers);
      fetchDistricts();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء إنشاء المستخدم');
    } finally { setCreatingUser(false); }
  };

  const getAdminName = (item: ExpatriateDistrict): string => {
    if (!item.admin) return 'غير معين';
    const { profile, memberDetails, email, mobileNumber } = item.admin;
    if (profile?.firstName && profile?.lastName) return `${profile.firstName} ${profile.lastName}`;
    if (memberDetails?.fullName) return memberDetails.fullName;
    return email || mobileNumber;
  };

  const selectedAdminUnit = adminUnits.find(au => au.id === selectedAdminUnitId);

  if (loading && regions.length === 0) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/expatriates" className="text-red-600 hover:text-red-800 mb-2 inline-block">← العودة للمغتربين</Link>
        <h1 className="text-3xl font-bold text-gray-900">أحياء المغتربين</h1>
        <p className="text-gray-600">إدارة الأحياء والمستخدمين في نظام المغتربين</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">القطاع:</label>
          <select value={selectedRegionId} onChange={(e) => setSelectedRegionId(e.target.value)} className="border rounded-lg px-3 py-2 min-w-[150px]">
            {regions.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">المحلية:</label>
          <select value={selectedLocalityId} onChange={(e) => setSelectedLocalityId(e.target.value)} className="border rounded-lg px-3 py-2 min-w-[150px]" disabled={localities.length === 0}>
            {localities.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">الوحدة:</label>
          <select value={selectedAdminUnitId} onChange={(e) => setSelectedAdminUnitId(e.target.value)} className="border rounded-lg px-3 py-2 min-w-[150px]" disabled={adminUnits.length === 0}>
            {adminUnits.map((au) => (<option key={au.id} value={au.id}>{au.name}</option>))}
          </select>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ name: '', code: '', description: '', expatriateAdminUnitId: selectedAdminUnitId, active: true }); }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 mr-auto self-end" disabled={!selectedAdminUnitId}>
          + إضافة حي
        </button>
      </div>

      {selectedAdminUnit && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <span className="text-red-800">عرض أحياء الوحدة: <strong>{selectedAdminUnit.name}</strong></span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {districts.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="font-bold text-gray-900">{item.name}</h3>{item.code && <p className="text-sm text-gray-500">الكود: {item.code}</p>}</div>
                <span className={`px-2 py-1 text-xs rounded-full ${item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.active ? 'فعال' : 'غير فعال'}</span>
              </div>
              <div className="text-sm text-gray-600 mb-3"><span>المستخدمين: {item._count?.users || 0}</span></div>
              <div className="text-sm mb-3">
                <span className="text-gray-500">المسؤول: </span>
                <span className={item.admin ? 'text-gray-900' : 'text-orange-600'}>{getAdminName(item)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleManageAdmin(item)} className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100">إدارة المسؤول</button>
                <button onClick={() => handleManageUsers(item)} className="px-3 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100">المستخدمين</button>
                <button onClick={() => handleEdit(item)} className="px-3 py-1 bg-gray-50 text-gray-700 rounded text-xs hover:bg-gray-100">تعديل</button>
                <button onClick={() => handleDelete(item.id)} className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && districts.length === 0 && selectedAdminUnitId && (
        <div className="text-center py-12 text-gray-500"><p className="text-lg mb-2">لا توجد أحياء</p><p className="text-sm">أضف حي جديد للبدء</p></div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editing ? 'تعديل الحي' : 'إضافة حي جديد'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">الكود</label><input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={3} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{submitting ? 'جاري الحفظ...' : 'حفظ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">إدارة المسؤول - {selectedItem.name}</h2>
            {loadingAdmins ? (<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div></div>) : (
              <div className="space-y-3">
                {selectedItem.admin && (<div className="p-3 bg-green-50 rounded-lg border border-green-200"><div className="flex items-center justify-between"><div><div className="font-medium">{getAdminName(selectedItem)}</div><div className="text-sm text-gray-500">المسؤول الحالي</div></div><button onClick={() => handleAssignAdmin(null)} className="text-red-600 hover:text-red-800 text-sm">إلغاء التعيين</button></div></div>)}
                <div className="text-sm font-medium text-gray-700 mb-2">المستخدمين المتاحين:</div>
                {availableAdmins.length === 0 ? (<p className="text-gray-500 text-sm">لا يوجد مستخدمين متاحين</p>) : (availableAdmins.map((admin) => (<div key={admin.id} className="p-3 border rounded-lg hover:bg-gray-50"><div className="flex items-center justify-between"><div><div className="font-medium">{admin.name}</div><div className="text-sm text-gray-500">{admin.mobileNumber}</div></div><button onClick={() => handleAssignAdmin(admin.id)} disabled={submitting} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50">تعيين</button></div></div>)))}
              </div>
            )}
            <div className="flex justify-end mt-6"><button onClick={() => setShowAdminModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إغلاق</button></div>
          </div>
        </div>
      )}

      {/* Users Modal */}
      {showUserModal && selectedDistrictForUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">مستخدمين الحي - {selectedDistrictForUsers.name}</h2>
              <button onClick={() => setShowCreateUserModal(true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">+ إضافة مستخدم</button>
            </div>
            {loadingUsers ? (<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div></div>) : (
              <div className="space-y-3">
                {currentUsers.length === 0 ? (<p className="text-gray-500 text-sm text-center py-4">لا يوجد مستخدمين في هذا الحي</p>) : (
                  currentUsers.map((user) => (<div key={user.id} className="p-3 border rounded-lg"><div className="font-medium">{user.name || user.mobileNumber}</div><div className="text-sm text-gray-500">{user.mobileNumber}</div>{user.email && <div className="text-sm text-gray-500">{user.email}</div>}</div>))
                )}
              </div>
            )}
            <div className="flex justify-end mt-6"><button onClick={() => setShowUserModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إغلاق</button></div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إضافة مستخدم جديد</h2>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label><input type="text" value={createUserForm.mobileNumber} onChange={(e) => setCreateUserForm({ ...createUserForm, mobileNumber: e.target.value })} className="w-full border rounded-lg px-3 py-2" required placeholder="+249123456789" dir="ltr" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور *</label><input type="password" value={createUserForm.password} onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label><input type="email" value={createUserForm.email} onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" dir="ltr" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label><input type="text" value={createUserForm.fullName} onChange={(e) => setCreateUserForm({ ...createUserForm, fullName: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowCreateUserModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                <button type="submit" disabled={creatingUser} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{creatingUser ? 'جاري الإنشاء...' : 'إنشاء'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

