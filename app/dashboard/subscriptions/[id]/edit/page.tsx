"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { apiClient } from '../../../../context/apiContext';
import { SubscriptionPlan } from '../../../../services/subscriptionService';


interface HierarchyOption {
  id: string;
  name: string;
}

export default function EditSubscriptionPlan() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'SDG',
    period: 'monthly',
    isDonation: false,
    targetRegionId: '',
    targetLocalityId: '',
    targetAdminUnitId: '',
    targetDistrictId: '',
  });
  
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [hierarchyOptions, setHierarchyOptions] = useState({
    regions: [] as HierarchyOption[],
    localities: [] as HierarchyOption[],
    adminUnits: [] as HierarchyOption[],
    districts: [] as HierarchyOption[],
  });
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  const [originalPlan, setOriginalPlan] = useState<SubscriptionPlan | null>(null);
  
  // Fetch subscription plan details
  const fetchPlanDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch plan details
      const plan = await apiClient.subscriptions.getSubscriptionPlanById(token!, id as string);
      setOriginalPlan(plan);
      
      // Set form data
      setFormData({
        title: plan.title || '',
        description: plan.description || '',
        price: plan.price || '',
        currency: plan.currency || 'SDG',
        period: plan.period || 'monthly',
        isDonation: plan.isDonation || false,
        targetRegionId: plan.targetRegionId || '',
        targetLocalityId: plan.targetLocalityId || '',
        targetAdminUnitId: plan.targetAdminUnitId || '',
        targetDistrictId: plan.targetDistrictId || '',
      });
      
      // Features field removed
      
    } catch (err) {
      console.error('Error fetching subscription plan details:', err);
      setError('حدث خطأ أثناء تحميل تفاصيل الاشتراك');
    } finally {
      setLoading(false);
    }
  }, [token, id]);
  
  useEffect(() => {
    if (token && id) {
      fetchPlanDetails();
    }
  }, [token, id, fetchPlanDetails]);
  
  // Fetch hierarchy options
  useEffect(() => {
    const fetchHierarchyOptions = async () => {
      try {
        setLoadingHierarchy(true);
        
        // Fetch regions
        const regions = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/hierarchy-management/regions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).then(res => res.json());
        
        setHierarchyOptions(prev => ({
          ...prev,
          regions: regions || []
        }));
        
      } catch (err) {
        console.error('Error fetching hierarchy options:', err);
        setError('حدث خطأ أثناء تحميل خيارات التسلسل الهرمي');
      } finally {
        setLoadingHierarchy(false);
      }
    };
    
    if (token) {
      fetchHierarchyOptions();
    }
  }, [token]);
  
  // Fetch localities when region changes
  useEffect(() => {
    const fetchLocalities = async () => {
      if (!formData.targetRegionId) {
        setHierarchyOptions(prev => ({
          ...prev,
          localities: [],
          adminUnits: [],
          districts: []
        }));
        return;
      }
      
      try {
        setLoadingHierarchy(true);
        const localities = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/hierarchy-management/regions/${formData.targetRegionId}/localities`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).then(res => res.json());
        
        setHierarchyOptions(prev => ({
          ...prev,
          localities: localities || [],
          adminUnits: [],
          districts: []
        }));
        
      } catch (err) {
        console.error('Error fetching localities:', err);
      } finally {
        setLoadingHierarchy(false);
      }
    };
    
    if (token && formData.targetRegionId) {
      fetchLocalities();
    }
  }, [token, formData.targetRegionId]);
  
  // Fetch admin units when locality changes
  useEffect(() => {
    const fetchAdminUnits = async () => {
      if (!formData.targetLocalityId) {
        setHierarchyOptions(prev => ({
          ...prev,
          adminUnits: [],
          districts: []
        }));
        return;
      }
      
      try {
        setLoadingHierarchy(true);
        const adminUnits = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/hierarchy-management/localities/${formData.targetLocalityId}/admin-units`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).then(res => res.json());
        
        setHierarchyOptions(prev => ({
          ...prev,
          adminUnits: adminUnits || [],
          districts: []
        }));
        
      } catch (err) {
        console.error('Error fetching admin units:', err);
      } finally {
        setLoadingHierarchy(false);
      }
    };
    
    if (token && formData.targetLocalityId) {
      fetchAdminUnits();
    }
  }, [token, formData.targetLocalityId]);
  
  // Fetch districts when admin unit changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.targetAdminUnitId) {
        setHierarchyOptions(prev => ({
          ...prev,
          districts: []
        }));
        return;
      }
      
      try {
        setLoadingHierarchy(true);
        const districts = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/hierarchy-management/admin-units/${formData.targetAdminUnitId}/districts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).then(res => res.json());
        
        setHierarchyOptions(prev => ({
          ...prev,
          districts: districts || []
        }));
        
      } catch (err) {
        console.error('Error fetching districts:', err);
      } finally {
        setLoadingHierarchy(false);
      }
    };
    
    if (token && formData.targetAdminUnitId) {
      fetchDistricts();
    }
  }, [token, formData.targetAdminUnitId]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'isDonation') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!originalPlan) return;
    
    // Validate form
    if (!formData.title.trim()) {
      setError('عنوان الاشتراك مطلوب');
      return;
    }
    
    if (!formData.isDonation && !formData.price.trim()) {
      setError('سعر الاشتراك مطلوب');
      return;
    }
    
    if (!formData.targetRegionId) {
      setError('يرجى تحديد مستوى واحد على الأقل من التسلسل الهرمي');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Clean up form data - convert empty strings to undefined for optional fields
      const cleanedFormData = {
        ...formData,
        price: formData.isDonation ? '0' : formData.price,
        targetRegionId: formData.targetRegionId || undefined,
        targetLocalityId: formData.targetLocalityId || undefined,
        targetAdminUnitId: formData.targetAdminUnitId || undefined,
        targetDistrictId: formData.targetDistrictId || undefined,
      };
      
      // Update the subscription plan
      await apiClient.subscriptions.updateSubscriptionPlan(token!, originalPlan.id, cleanedFormData);
      
      setSuccess('تم تحديث الاشتراك بنجاح');
      
      // Redirect after successful update
      setTimeout(() => {
        router.push(`/dashboard/subscriptions/${id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error updating subscription plan:', err);
      setError('حدث خطأ أثناء تحديث الاشتراك');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary-500)] border-t-transparent"></div>
          <div className="text-xl text-[var(--neutral-600)]">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (error && !originalPlan) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error || 'لا يمكن العثور على تفاصيل الاشتراك'}
        </div>
        <button
          onClick={() => router.push('/dashboard/subscriptions')}
          className="mt-4 rounded-md bg-[var(--primary-600)] px-4 py-2 text-white"
        >
          العودة إلى الاشتراكات
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--neutral-900)]">
          تعديل {formData.isDonation ? 'طلب تبرع' : 'اشتراك'}
        </h1>
        <p className="text-sm text-[var(--neutral-500)]">
          قم بتعديل تفاصيل {formData.isDonation ? 'طلب التبرع' : 'الاشتراك'}
        </p>
      </div>

      {/* Error and success messages */}
      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl rounded-lg border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="isDonation"
              name="isDonation"
              checked={formData.isDonation}
              onChange={handleChange}
              className="h-5 w-5 cursor-pointer rounded border-[var(--neutral-300)] text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
            />
            <label htmlFor="isDonation" className="mr-2 cursor-pointer text-[var(--neutral-700)]">
              هذا طلب تبرع (بدون مبلغ محدد)
            </label>
          </div>
          
          <div className="space-y-4">
            {/* Title field */}
            <div>
              <label htmlFor="title" className="mb-1 block font-medium text-[var(--neutral-700)]">
                العنوان *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                placeholder={formData.isDonation ? 'عنوان طلب التبرع' : 'عنوان الاشتراك'}
                required
              />
            </div>
            
            {/* Description field */}
            <div>
              <label htmlFor="description" className="mb-1 block font-medium text-[var(--neutral-700)]">
                الوصف
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                placeholder={formData.isDonation ? 'وصف طلب التبرع والغرض منه' : 'وصف الاشتراك وما يتضمنه'}
              />
            </div>
            
            {/* Price field - only shown if not donation */}
            {!formData.isDonation && (
              <div className="flex space-x-4 rtl:space-x-reverse">
                <div className="flex-1">
                  <label htmlFor="price" className="mb-1 block font-medium text-[var(--neutral-700)]">
                    السعر *
                  </label>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                    placeholder="مثال: 5000"
                    required={!formData.isDonation}
                  />
                </div>
                
                <div>
                  <label htmlFor="currency" className="mb-1 block font-medium text-[var(--neutral-700)]">
                    العملة
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                  >
                    <option value="SDG">جنيه سوداني (SDG)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Period field */}
            <div>
              <label htmlFor="period" className="mb-1 block font-medium text-[var(--neutral-700)]">
                الفترة
              </label>
              <select
                id="period"
                name="period"
                value={formData.period}
                onChange={handleChange}
                className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
              >
                <option value="monthly">شهري</option>
                <option value="quarterly">ربع سنوي</option>
                <option value="biannual">نصف سنوي</option>
                <option value="annual">سنوي</option>
                <option value="one-time">مرة واحدة</option>
              </select>
            </div>
            
            {/* Hierarchy targeting fields */}
            <div className="space-y-4 rounded-md border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
              <h3 className="font-semibold text-[var(--neutral-700)]">
                تحديد النطاق الجغرافي
              </h3>
              
              <div>
                <label htmlFor="targetRegionId" className="mb-1 block font-medium text-[var(--neutral-700)]">
                  الولاية *
                </label>
                <select
                  id="targetRegionId"
                  name="targetRegionId"
                  value={formData.targetRegionId}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                  required
                >
                  <option value="">اختر الولاية</option>
                  {hierarchyOptions.regions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="targetLocalityId" className="mb-1 block font-medium text-[var(--neutral-700)]">
                  المحلية (اختياري)
                </label>
                <select
                  id="targetLocalityId"
                  name="targetLocalityId"
                  value={formData.targetLocalityId}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                  disabled={!formData.targetRegionId || loadingHierarchy || hierarchyOptions.localities.length === 0}
                >
                  <option value="">اختر المحلية</option>
                  {hierarchyOptions.localities.map(locality => (
                    <option key={locality.id} value={locality.id}>{locality.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="targetAdminUnitId" className="mb-1 block font-medium text-[var(--neutral-700)]">
                  الوحدة الإدارية (اختياري)
                </label>
                <select
                  id="targetAdminUnitId"
                  name="targetAdminUnitId"
                  value={formData.targetAdminUnitId}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                  disabled={!formData.targetLocalityId || loadingHierarchy || hierarchyOptions.adminUnits.length === 0}
                >
                  <option value="">اختر الوحدة الإدارية</option>
                  {hierarchyOptions.adminUnits.map(adminUnit => (
                    <option key={adminUnit.id} value={adminUnit.id}>{adminUnit.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="targetDistrictId" className="mb-1 block font-medium text-[var(--neutral-700)]">
                  الحي (اختياري)
                </label>
                <select
                  id="targetDistrictId"
                  name="targetDistrictId"
                  value={formData.targetDistrictId}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                  disabled={!formData.targetAdminUnitId || loadingHierarchy || hierarchyOptions.districts.length === 0}
                >
                  <option value="">اختر الحي</option>
                  {hierarchyOptions.districts.map(district => (
                    <option key={district.id} value={district.id}>{district.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md bg-[var(--neutral-100)] px-4 py-2 text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
          >
            إلغاء
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)] disabled:opacity-50"
          >
            {submitting ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </form>
    </div>
  );
}
