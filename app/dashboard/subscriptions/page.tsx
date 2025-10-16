"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../context/apiContext';
import { SubscriptionPlan } from '../../services/subscriptionService';

export default function SubscriptionsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'donations' | 'pending' | 'receipts'>('subscriptions');
  const [receipts, setReceipts] = useState<any[]>([]);

  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Fetch subscription plans based on active tab
      const queryParams: any = {};
      
      if (activeTab === 'pending') {
        // Show unapproved plans for root admins
        queryParams.isApproved = false;
      } else if (activeTab === 'donations') {
        // Show approved donations + user's own unapproved donations
        queryParams.isDonation = true;
        if (user?.adminLevel === 'ADMIN') {
          // Root admin sees all approved donations
          queryParams.isApproved = true;
        }
        // Other admins see approved donations + their own unapproved donations
        // Don't filter by isApproved - let backend handle this
      } else {
        // Show approved subscriptions + user's own unapproved plans
        queryParams.isDonation = false;
        // For subscriptions tab, show approved plans + user's own unapproved plans
        if (user?.adminLevel === 'ADMIN') {
          // Root admin sees all approved plans
          queryParams.isApproved = true;
        } else {
          // Other admins see approved plans + their own unapproved plans
          // Don't filter by isApproved - let backend handle this
        }
      }
      
      const fetchedPlans = await apiClient.subscriptions.getSubscriptionPlans(token!, queryParams);
      
      setPlans(fetchedPlans);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      setError('حدث خطأ أثناء تحميل خطط الاشتراك');
      } finally {
        setLoading(false);
      }
  }, [token, activeTab]);

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Fetch subscriptions with receipts
      const subscriptions = await apiClient.subscriptions.getSubscriptions(token!, { 
        paymentStatus: 'pending_review',
        isDonation: activeTab === 'donations' ? true : (activeTab === 'subscriptions' ? false : undefined)
      });
      
      setReceipts(subscriptions);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError('فشل في تحميل الإيصالات');
    } finally {
      setLoading(false);
    }
  }, [token]);


  useEffect(() => {
    if (token) {
      if (activeTab === 'receipts') {
        fetchReceipts();
      } else {
        fetchSubscriptionPlans();
      }
    }
  }, [token, fetchSubscriptionPlans, fetchReceipts, activeTab]);

  const handleCreateNewPlan = () => {
    router.push('/dashboard/subscriptions/create');
  };

  const handleViewPlanDetails = (planId: string) => {
    router.push(`/dashboard/subscriptions/${planId}`);
  };

  const handleApprovePlan = async (planId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    try {
      await apiClient.subscriptions.approveSubscriptionPlan(token!, planId);
      setSuccess('تم الموافقة على الخطة بنجاح');
      fetchSubscriptionPlans(); // Refresh the list
    } catch (err) {
      console.error('Error approving plan:', err);
      setError('حدث خطأ أثناء الموافقة على الخطة');
    }
  };

  const handleApproveReceipt = async (subscriptionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.subscriptions.updateSubscription(token!, subscriptionId, {
        paymentStatus: 'paid'
      });
      setSuccess('تم الموافقة على الإيصال بنجاح');
      fetchReceipts();
    } catch (err) {
      console.error('Error approving receipt:', err);
      setError('فشل في الموافقة على الإيصال');
    }
  };

  const handleRejectReceipt = async (subscriptionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.subscriptions.updateSubscription(token!, subscriptionId, {
        paymentStatus: 'pending',
        receipt: undefined
      });
      setSuccess('تم رفض الإيصال');
      fetchReceipts();
    } catch (err) {
      console.error('Error rejecting receipt:', err);
      setError('فشل في رفض الإيصال');
    }
  };

  const handleTabChange = (tab: 'subscriptions' | 'donations' | 'pending' | 'receipts') => {
    setActiveTab(tab);
    setSuccess(null); // Clear success message when changing tabs
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">
            {activeTab === 'subscriptions' ? 'الاشتراكات' : 
             activeTab === 'donations' ? 'التبرعات' : 
             activeTab === 'pending' ? 'في انتظار الموافقة' : 'إيصالات الدفع'}
          </h1>
          <p className="text-sm text-[var(--neutral-500)]">
            {activeTab === 'subscriptions' ? 'إدارة اشتراكات الأعضاء' : 
             activeTab === 'donations' ? 'إدارة طلبات التبرع' : 
             activeTab === 'pending' ? 'الطلبات في انتظار موافقة الأمانة العامة' : 'مراجعة وإدارة إيصالات الدفع المرفوعة'}
          </p>
        </div>

        {/* Create New button */}
        {activeTab !== 'receipts' && (
          <button
            onClick={handleCreateNewPlan}
            className="rounded-lg bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
          >
            إنشاء {activeTab === 'subscriptions' ? 'اشتراك' : 'تبرع'} جديد
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-[var(--neutral-200)]">
        <div className="flex space-x-6 rtl:space-x-reverse">
          <button
            onClick={() => handleTabChange('subscriptions')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'subscriptions'
                ? 'border-b-2 border-[var(--primary-500)] text-[var(--primary-600)]'
                : 'text-[var(--neutral-600)]'
            }`}
          >
            الاشتراكات
          </button>
          <button
            onClick={() => handleTabChange('donations')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'donations'
                ? 'border-b-2 border-[var(--primary-500)] text-[var(--primary-600)]'
                : 'text-[var(--neutral-600)]'
            }`}
          >
            التبرعات
          </button>
          {user?.adminLevel === 'ADMIN' && (
            <>
              <button
                onClick={() => handleTabChange('pending')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-[var(--primary-500)] text-[var(--primary-600)]'
                    : 'text-[var(--neutral-600)]'
                }`}
              >
                في انتظار الموافقة
              </button>
              <button
                onClick={() => handleTabChange('receipts')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'receipts'
                    ? 'border-b-2 border-[var(--primary-500)] text-[var(--primary-600)]'
                    : 'text-[var(--neutral-600)]'
                }`}
              >
                إيصالات الدفع
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Success display */}
      {success && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      {/* Receipts content */}
      {activeTab === 'receipts' ? (
        receipts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="group overflow-hidden rounded-lg border border-[var(--neutral-200)] bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="bg-[var(--primary-50)] p-4">
                  <h3 className="text-lg font-semibold text-[var(--neutral-900)]">
                    {receipt.user?.profile?.firstName} {receipt.user?.profile?.lastName}
                  </h3>
                  <div className="mt-2 flex items-center">
                    <span className="text-2xl font-bold text-[var(--primary-700)]">{receipt.plan?.price}</span>
                    <span className="mr-1 text-[var(--neutral-600)]">{receipt.plan?.currency}</span>
                    <span className="mr-2 text-sm text-[var(--neutral-500)]">/ {receipt.plan?.period}</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="mb-4 text-[var(--neutral-600)]">{receipt.plan?.title}</p>
                  
                  {receipt.receipt && (
                    <div className="mb-4">
                      <img 
                        src={receipt.receipt} 
                        alt="Payment Receipt" 
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-between">
                    <div className="text-sm text-[var(--neutral-500)]">
                      {new Date(receipt.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={(e) => handleApproveReceipt(receipt.id, e)}
                        className="rounded-full bg-[var(--success-100)] px-3 py-1 text-xs font-medium text-[var(--success-700)] hover:bg-[var(--success-200)]"
                      >
                        موافقة
                      </button>
                      <button
                        onClick={(e) => handleRejectReceipt(receipt.id, e)}
                        className="rounded-full bg-[var(--error-100)] px-3 py-1 text-xs font-medium text-[var(--error-700)] hover:bg-[var(--error-200)]"
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] py-12">
            <div className="text-4xl">📄</div>
            <h3 className="mt-2 text-lg font-medium text-[var(--neutral-900)]">
              لا توجد إيصالات في انتظار المراجعة
            </h3>
            <p className="mt-1 text-[var(--neutral-600)]">
              جميع الإيصالات تمت مراجعتها
            </p>
          </div>
        )
      ) : (
        /* Plans grid */
        plans.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="group cursor-pointer overflow-hidden rounded-lg border border-[var(--neutral-200)] bg-white shadow-sm transition-all hover:shadow-md"
              onClick={() => handleViewPlanDetails(plan.id)}
            >
              <div className="bg-[var(--primary-50)] p-4">
                <h3 className="text-lg font-semibold text-[var(--neutral-900)]">{plan.title}</h3>
                <div className="mt-2 flex items-center">
                  <span className="text-2xl font-bold text-[var(--primary-700)]">{plan.price}</span>
                  <span className="mr-1 text-[var(--neutral-600)]">{plan.currency}</span>
                  <span className="mr-2 text-sm text-[var(--neutral-500)]">/ {plan.period}</span>
                </div>
              </div>
              
              <div className="p-4">
                {plan.description && <p className="mb-4 text-[var(--neutral-600)]">{plan.description}</p>}
                
                
                <div className="mt-4 flex justify-between">
                  <div className="text-sm text-[var(--neutral-500)]">
                    {new Date(plan.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {!plan.isApproved && user?.adminLevel === 'ADMIN' && (
                      <button
                        onClick={(e) => handleApprovePlan(plan.id, e)}
                        className="rounded-full bg-[var(--primary-100)] px-3 py-1 text-xs font-medium text-[var(--primary-700)] hover:bg-[var(--primary-200)]"
                      >
                        موافقة
                      </button>
                    )}
                    <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                      plan.isApproved 
                        ? 'bg-[var(--success-100)] text-[var(--success-700)]' 
                        : 'bg-[var(--warning-100)] text-[var(--warning-700)]'
                    }`}>
                      {plan.isApproved ? 'موافق عليه' : 'في الانتظار'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] py-12">
            <div className="text-4xl">
              {activeTab === 'subscriptions' ? '📝' : 
               activeTab === 'donations' ? '🎁' : '⏳'}
            </div>
            <h3 className="mt-2 text-lg font-medium text-[var(--neutral-900)]">
              {activeTab === 'subscriptions' ? 'لا توجد اشتراكات بعد' :
               activeTab === 'donations' ? 'لا توجد تبرعات بعد' : 'لا توجد طلبات في الانتظار'}
            </h3>
            <p className="mt-1 text-[var(--neutral-600)]">
              {activeTab === 'subscriptions' ? 'قم بإنشاء اشتراك جديد للبدء' : 
               activeTab === 'donations' ? 'قم بإنشاء تبرع جديد للبدء' : 'جميع الطلبات تمت الموافقة عليها'}
            </p>
            {activeTab !== 'pending' && (
              <button
                onClick={handleCreateNewPlan}
                className="mt-4 rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
              >
                إنشاء {activeTab === 'subscriptions' ? 'اشتراك' : 'تبرع'} جديد
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
} 