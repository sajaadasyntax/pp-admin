"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../context/apiContext';
import { getUserHierarchySelection, getUserHierarchyDisplayText } from '../../../utils/hierarchyUtils';
import HierarchySelector, { HierarchySelection } from '../../../components/HierarchySelector';

export default function CreateSubscriptionPlan() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'SDG', // Default currency
    period: 'monthly', // Default period
    isDonation: false,
  });

  // Hierarchy selection state
  const [hierarchySelection, setHierarchySelection] = useState<HierarchySelection | null>(null);

  // Auto-populate hierarchy based on user's level
  useEffect(() => {
    if (user) {
      const userHierarchy = getUserHierarchySelection(user);
      if (userHierarchy) {
        console.log('Auto-populating hierarchy for user:', userHierarchy);
        setHierarchySelection(userHierarchy);
      } else {
        console.log('No hierarchy found for user:', user);
      }
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    
    console.log('Form submission - formData:', formData);
    console.log('Hierarchy selection:', hierarchySelection);
    
    // Validate form
    if (!formData.title.trim()) {
      setError('عنوان الاشتراك مطلوب');
      return;
    }
    
    if (!formData.isDonation && !formData.price.trim()) {
      setError('سعر الاشتراك مطلوب');
      return;
    }
    
    // Validate hierarchy selection
    if (!hierarchySelection) {
      setError('يرجى اختيار مستوى الاستهداف');
      return;
    }
    
    // Validate based on hierarchy type
    if (hierarchySelection.hierarchyType === 'ORIGINAL' && !hierarchySelection.regionId && !hierarchySelection.nationalLevelId) {
      setError('يرجى اختيار الولاية أو المستوى القومي');
      return;
    }
    if (hierarchySelection.hierarchyType === 'EXPATRIATE' && !hierarchySelection.expatriateRegionId) {
      setError('يرجى اختيار إقليم المغتربين');
      return;
    }
    if (hierarchySelection.hierarchyType === 'SECTOR' && !hierarchySelection.sectorRegionId && !hierarchySelection.sectorNationalLevelId) {
      setError('يرجى اختيار قطاع');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Build subscription data with hierarchy targeting
      const subscriptionData: any = {
        ...formData,
        price: formData.isDonation ? '0' : formData.price,
      };
      
      // Add hierarchy targeting based on selection type
      if (hierarchySelection.hierarchyType === 'ORIGINAL') {
        if (hierarchySelection.nationalLevelId) {
          subscriptionData.targetNationalLevelId = hierarchySelection.nationalLevelId;
        }
        if (hierarchySelection.regionId) {
          subscriptionData.targetRegionId = hierarchySelection.regionId;
        }
        if (hierarchySelection.localityId) {
          subscriptionData.targetLocalityId = hierarchySelection.localityId;
        }
        if (hierarchySelection.adminUnitId) {
          subscriptionData.targetAdminUnitId = hierarchySelection.adminUnitId;
        }
        if (hierarchySelection.districtId) {
          subscriptionData.targetDistrictId = hierarchySelection.districtId;
        }
      } else if (hierarchySelection.hierarchyType === 'EXPATRIATE') {
        if (hierarchySelection.expatriateRegionId) {
          subscriptionData.targetExpatriateRegionId = hierarchySelection.expatriateRegionId;
        }
      } else if (hierarchySelection.hierarchyType === 'SECTOR') {
        if (hierarchySelection.sectorNationalLevelId) {
          subscriptionData.targetSectorNationalLevelId = hierarchySelection.sectorNationalLevelId;
        }
        if (hierarchySelection.sectorRegionId) {
          subscriptionData.targetSectorRegionId = hierarchySelection.sectorRegionId;
        }
        if (hierarchySelection.sectorLocalityId) {
          subscriptionData.targetSectorLocalityId = hierarchySelection.sectorLocalityId;
        }
        if (hierarchySelection.sectorAdminUnitId) {
          subscriptionData.targetSectorAdminUnitId = hierarchySelection.sectorAdminUnitId;
        }
        if (hierarchySelection.sectorDistrictId) {
          subscriptionData.targetSectorDistrictId = hierarchySelection.sectorDistrictId;
        }
      }
      // GLOBAL type doesn't add any targeting - content is visible to everyone
      
      console.log('Subscription data being sent:', subscriptionData);
      
      // Create the subscription plan
      await apiClient.subscriptions.createSubscriptionPlan(token!, subscriptionData);
      
      setSuccess('تم إنشاء الاشتراك بنجاح');
      
      // Redirect to subscriptions page after successful creation
      setTimeout(() => {
        router.push('/dashboard/subscriptions');
      }, 1500);
      
    } catch (err) {
      console.error('Error creating subscription plan:', err);
      setError('حدث خطأ أثناء إنشاء الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--neutral-900)]">
          إنشاء {formData.isDonation ? 'طلب تبرع' : 'اشتراك'} جديد
        </h1>
        <p className="text-sm text-[var(--neutral-500)]">
          قم بإدخال تفاصيل {formData.isDonation ? 'طلب التبرع' : 'الاشتراك'} الجديد
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
            
            {/* Hierarchy targeting */}
            <div className="space-y-4 rounded-md border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--neutral-700)]">
                  تحديد الاستهداف *
                </h3>
                <div className="text-sm text-[var(--neutral-600)]">
                  <span className="font-medium">النطاق الحالي:</span> {getUserHierarchyDisplayText(user)}
                </div>
              </div>
              
              <p className="text-sm text-[var(--neutral-500)]">
                اختر من سيرى هذا {formData.isDonation ? 'طلب التبرع' : 'الاشتراك'}. يمكنك استهداف منطقة جغرافية، أو المغتربين، أو قطاع معين، أو جعله عالمياً للجميع.
              </p>
              
              {user?.adminLevel !== 'ADMIN' && (
                <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                  <p className="text-sm text-blue-700">
                    <strong>ملاحظة:</strong> سيتم إنشاء {formData.isDonation ? 'طلب التبرع' : 'الاشتراك'} تلقائياً للنطاق الإداري الخاص بك: <strong>{getUserHierarchyDisplayText(user)}</strong>
                  </p>
                </div>
              )}
              
              <HierarchySelector
                onSelectionChange={setHierarchySelection}
                initialSelection={hierarchySelection}
                showGlobalOption={true}
                className="bg-white p-4 rounded-lg border border-[var(--neutral-200)]"
                disabled={user?.adminLevel !== 'ADMIN'}
              />

              {hierarchySelection && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>الاستهداف المحدد:</strong>{' '}
                    {hierarchySelection.hierarchyType === 'GLOBAL' && 'عالمي - سيراه جميع المستخدمين'}
                    {hierarchySelection.hierarchyType === 'ORIGINAL' && `جغرافي - ${
                      hierarchySelection.districtName || 
                      hierarchySelection.adminUnitName || 
                      hierarchySelection.localityName || 
                      hierarchySelection.regionName || 
                      hierarchySelection.nationalLevelName || 
                      'غير محدد'
                    }`}
                    {hierarchySelection.hierarchyType === 'EXPATRIATE' && `المغتربين - ${hierarchySelection.expatriateRegionName || 'غير محدد'}`}
                    {hierarchySelection.hierarchyType === 'SECTOR' && `القطاع - ${
                      hierarchySelection.sectorDistrictName || 
                      hierarchySelection.sectorAdminUnitName || 
                      hierarchySelection.sectorLocalityName || 
                      hierarchySelection.sectorRegionName || 
                      hierarchySelection.sectorNationalLevelName || 
                      'غير محدد'
                    }`}
                  </p>
                </div>
              )}
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
            disabled={loading}
            className="rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)] disabled:opacity-50"
          >
            {loading ? 'جارٍ الإنشاء...' : 'إنشاء'}
          </button>
        </div>
      </form>
    </div>
  );
}
