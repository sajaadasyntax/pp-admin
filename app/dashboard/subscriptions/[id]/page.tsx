"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../context/apiContext';
import { SubscriptionPlan, Subscription, SubscriptionStats } from '../../../services/subscriptionService';

export default function SubscriptionDetailsPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const router = useRouter();
  
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchPlanDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch plan details
      const planDetails = await apiClient.subscriptions.getSubscriptionPlanById(token!, id as string);
      setPlan(planDetails);

      // Fetch subscriptions for this plan
      const planSubscriptions = await apiClient.subscriptions.getSubscriptions(token!, { planId: id as string });
      setSubscriptions(planSubscriptions);

      // Fetch stats
      const planStats = await apiClient.subscriptions.getSubscriptionStats(token!, id as string);
      setStats(planStats);
      
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

  const handleApprove = async () => {
    if (!plan) return;
    
    try {
      setApproving(true);
      await apiClient.subscriptions.approveSubscriptionPlan(token!, plan.id);
      
      // Refresh plan details
      fetchPlanDetails();
    } catch (err) {
      console.error('Error approving plan:', err);
      setError('حدث خطأ أثناء الموافقة على الاشتراك');
    } finally {
      setApproving(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/subscriptions/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!plan || !confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) return;
    
    try {
      setLoading(true);
      await apiClient.subscriptions.deleteSubscriptionPlan(token!, plan.id);
      
      // Redirect back to subscriptions list
      router.push('/dashboard/subscriptions');
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('حدث خطأ أثناء حذف الاشتراك');
      setLoading(false);
    }
  };

  const handleAddSubscription = () => {
    setShowSubscriptionModal(true);
  };

  const handleCloseSubscriptionModal = () => {
    setShowSubscriptionModal(false);
    setSelectedSubscription(null);
  };

  const handleViewSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowSubscriptionModal(true);
  };

  const handleMarkPayment = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };

  const handleSubmitPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedSubscription) return;
    
    const formData = new FormData(e.currentTarget);
    const paymentMethod = formData.get('paymentMethod') as string;
    const amount = formData.get('amount') as string;
    
    try {
      await apiClient.subscriptions.updateSubscription(token!, selectedSubscription.id, {
        paymentStatus: 'paid',
        paymentMethod,
        amount
      });
      
      // Refresh data
      fetchPlanDetails();
      
      // Close modal
      handleClosePaymentModal();
    } catch (err) {
      console.error('Error updating payment:', err);
      setError('حدث خطأ أثناء تحديث حالة الدفع');
    }
  };

  const handleSubscriptionFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!plan) return;
    
    const formData = new FormData(e.currentTarget);
    const userId = formData.get('userId') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const amount = formData.get('amount') as string;
    const paymentMethod = formData.get('paymentMethod') as string;
    
    try {
      await apiClient.subscriptions.createSubscription(token!, {
        planId: plan.id,
        userId,
        startDate,
        endDate,
        amount: amount || plan.price,
        paymentMethod
      });
      
      // Refresh data
      fetchPlanDetails();
      
      // Close modal
      handleCloseSubscriptionModal();
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError('حدث خطأ أثناء إنشاء الاشتراك');
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

  if (error || !plan) {
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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">
            {plan.isDonation ? 'طلب تبرع:' : 'اشتراك:'} {plan.title}
          </h1>
          <p className="text-sm text-[var(--neutral-500)]">
            تفاصيل {plan.isDonation ? 'طلب التبرع' : 'الاشتراك'} والمشتركين
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2 rtl:space-x-reverse">
          {user?.adminLevel === 'GENERAL_SECRETARIAT' && !plan.isApproved && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="rounded-md bg-[var(--success-600)] px-4 py-2 text-white hover:bg-[var(--success-700)] disabled:opacity-50"
            >
              {approving ? 'جارٍ الموافقة...' : 'الموافقة على الطلب'}
            </button>
          )}
          
          {(user?.adminLevel === 'GENERAL_SECRETARIAT' || plan.creatorId === user?.id) && (
            <>
              <button
                onClick={handleEdit}
                className="rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
              >
                تعديل
              </button>
              
              <button
                onClick={handleDelete}
                className="rounded-md bg-[var(--error-600)] px-4 py-2 text-white hover:bg-[var(--error-700)]"
              >
                حذف
              </button>
            </>
          )}
        </div>
      </div>

      {/* Approval status banner */}
      {!plan.isApproved && (
        <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-yellow-700">
          هذا {plan.isDonation ? 'طلب التبرع' : 'الاشتراك'} بانتظار موافقة الأمانة العامة ولن يظهر للأعضاء حتى تتم الموافقة عليه.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Plan details */}
        <div className="md:col-span-1">
          <div className="rounded-lg border border-[var(--neutral-200)] bg-white shadow-sm">
            <div className="bg-[var(--primary-50)] p-4">
              <h3 className="text-lg font-semibold text-[var(--neutral-900)]">تفاصيل {plan.isDonation ? 'طلب التبرع' : 'الاشتراك'}</h3>
            </div>
            
            <div className="p-4">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-[var(--neutral-500)]">العنوان</dt>
                  <dd className="text-[var(--neutral-800)]">{plan.title}</dd>
                </div>
                
                {plan.description && (
                  <div>
                    <dt className="text-sm text-[var(--neutral-500)]">الوصف</dt>
                    <dd className="text-[var(--neutral-800)]">{plan.description}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm text-[var(--neutral-500)]">السعر</dt>
                  <dd className="text-[var(--neutral-800)]">
                    {plan.isDonation ? 'تبرع مفتوح (بدون سعر محدد)' : `${plan.price} ${plan.currency}`}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm text-[var(--neutral-500)]">الفترة</dt>
                  <dd className="text-[var(--neutral-800)]">
                    {plan.period === 'monthly' && 'شهري'}
                    {plan.period === 'quarterly' && 'ربع سنوي'}
                    {plan.period === 'biannual' && 'نصف سنوي'}
                    {plan.period === 'annual' && 'سنوي'}
                    {plan.period === 'one-time' && 'مرة واحدة'}
                  </dd>
                </div>
                
                
                <div>
                  <dt className="text-sm text-[var(--neutral-500)]">تاريخ الإنشاء</dt>
                  <dd className="text-[var(--neutral-800)]">
                    {new Date(plan.createdAt).toLocaleDateString('ar-EG')}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm text-[var(--neutral-500)]">بواسطة</dt>
                  <dd className="text-[var(--neutral-800)]">
                    {plan.creator?.profile?.firstName} {plan.creator?.profile?.lastName || plan.creator?.email || ''}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm text-[var(--neutral-500)]">حالة الموافقة</dt>
                  <dd>
                    {plan.isApproved ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        تمت الموافقة
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        بانتظار الموافقة
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Stats */}
          {stats && (
            <div className="mt-6 rounded-lg border border-[var(--neutral-200)] bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-[var(--neutral-900)]">إحصائيات</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md bg-[var(--primary-50)] p-3 text-center">
                  <span className="block text-sm text-[var(--neutral-500)]">إجمالي الاشتراكات</span>
                  <span className="text-xl font-bold text-[var(--primary-700)]">{stats.totalSubscriptions}</span>
                </div>
                
                <div className="rounded-md bg-[var(--success-50)] p-3 text-center">
                  <span className="block text-sm text-[var(--neutral-500)]">المدفوعة</span>
                  <span className="text-xl font-bold text-[var(--success-700)]">{stats.paidSubscriptions}</span>
                </div>
                
                <div className="rounded-md bg-[var(--warning-50)] p-3 text-center">
                  <span className="block text-sm text-[var(--neutral-500)]">قيد الانتظار</span>
                  <span className="text-xl font-bold text-[var(--warning-700)]">{stats.pendingSubscriptions}</span>
                </div>
                
                <div className="rounded-md bg-[var(--accent-50)] p-3 text-center">
                  <span className="block text-sm text-[var(--neutral-500)]">نسبة الدفع</span>
                  <span className="text-xl font-bold text-[var(--accent-700)]">
                    {Math.round(stats.paymentRate)}%
                  </span>
                </div>
                
                <div className="col-span-2 rounded-md bg-[var(--neutral-50)] p-3 text-center">
                  <span className="block text-sm text-[var(--neutral-500)]">إجمالي المدفوعات</span>
                  <span className="text-xl font-bold text-[var(--neutral-900)]">
                    {stats.totalPaid.toLocaleString()} {plan.currency}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Subscriptions */}
        <div className="md:col-span-2">
          <div className="rounded-lg border border-[var(--neutral-200)] bg-white shadow-sm">
            <div className="flex items-center justify-between bg-[var(--primary-50)] p-4">
              <h3 className="text-lg font-semibold text-[var(--neutral-900)]">المشتركون</h3>
              
              {plan.isApproved && (
                <button
                  onClick={handleAddSubscription}
                  className="rounded-md bg-[var(--primary-600)] px-3 py-1 text-sm text-white hover:bg-[var(--primary-700)]"
                >
                  + إضافة مشترك
                </button>
              )}
            </div>
            
            <div className="p-4">
              {subscriptions.length > 0 ? (
                <div className="overflow-hidden rounded-md border border-[var(--neutral-200)]">
                  <table className="min-w-full divide-y divide-[var(--neutral-200)]">
                    <thead className="bg-[var(--neutral-50)]">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-medium text-[var(--neutral-700)]">المستخدم</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-[var(--neutral-700)]">تاريخ البداية</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-[var(--neutral-700)]">تاريخ النهاية</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-[var(--neutral-700)]">المبلغ</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-[var(--neutral-700)]">حالة الدفع</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-[var(--neutral-700)]">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--neutral-200)] bg-white">
                      {subscriptions.map((subscription) => (
                        <tr key={subscription.id} className="hover:bg-[var(--neutral-50)]">
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--neutral-800)]">
                            {subscription.user?.profile?.firstName} {subscription.user?.profile?.lastName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--neutral-800)]">
                            {new Date(subscription.startDate).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--neutral-800)]">
                            {new Date(subscription.endDate).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--neutral-800)]">
                            {subscription.amount} {plan.currency}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm">
                            {subscription.paymentStatus === 'paid' && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                تم الدفع
                              </span>
                            )}
                            {subscription.paymentStatus === 'pending' && (
                              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                قيد الانتظار
                              </span>
                            )}
                            {subscription.paymentStatus === 'cancelled' && (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                ملغي
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm">
                            <div className="flex space-x-2 rtl:space-x-reverse">
                              <button
                                onClick={() => handleViewSubscription(subscription)}
                                className="rounded-md bg-[var(--primary-50)] px-2 py-1 text-xs text-[var(--primary-600)] hover:bg-[var(--primary-100)]"
                              >
                                عرض
                              </button>
                              
                              {subscription.paymentStatus === 'pending' && (
                                <button
                                  onClick={() => handleMarkPayment(subscription)}
                                  className="rounded-md bg-[var(--success-50)] px-2 py-1 text-xs text-[var(--success-600)] hover:bg-[var(--success-100)]"
                                >
                                  تسجيل دفع
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="text-4xl">📝</div>
                  <h3 className="mt-2 text-lg font-medium text-[var(--neutral-900)]">
                    لا يوجد مشتركون بعد
                  </h3>
                  <p className="mt-1 text-[var(--neutral-600)]">
                    لا يوجد أحد مشترك في هذا {plan.isDonation ? 'التبرع' : 'الاشتراك'} حتى الآن
                  </p>
                  
                  {plan.isApproved && (
                    <button
                      onClick={handleAddSubscription}
                      className="mt-4 rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
                    >
                      إضافة مشترك جديد
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-[var(--neutral-900)]">
              {selectedSubscription ? 'تفاصيل الاشتراك' : 'إضافة مشترك جديد'}
            </h3>
            
            {selectedSubscription ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">المستخدم</label>
                  <div className="rounded-md border border-[var(--neutral-200)] p-2">
                    {selectedSubscription.user?.profile?.firstName} {selectedSubscription.user?.profile?.lastName}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">تاريخ البداية</label>
                    <div className="rounded-md border border-[var(--neutral-200)] p-2">
                      {new Date(selectedSubscription.startDate).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">تاريخ النهاية</label>
                    <div className="rounded-md border border-[var(--neutral-200)] p-2">
                      {new Date(selectedSubscription.endDate).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">المبلغ</label>
                  <div className="rounded-md border border-[var(--neutral-200)] p-2">
                    {selectedSubscription.amount} {plan.currency}
                  </div>
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">حالة الدفع</label>
                  <div className="rounded-md border border-[var(--neutral-200)] p-2">
                    {selectedSubscription.paymentStatus === 'paid' && 'تم الدفع'}
                    {selectedSubscription.paymentStatus === 'pending' && 'قيد الانتظار'}
                    {selectedSubscription.paymentStatus === 'cancelled' && 'ملغي'}
                  </div>
                </div>
                
                {selectedSubscription.paymentStatus === 'paid' && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">طريقة الدفع</label>
                      <div className="rounded-md border border-[var(--neutral-200)] p-2">
                        {selectedSubscription.paymentMethod || 'غير محدد'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">تاريخ الدفع</label>
                      <div className="rounded-md border border-[var(--neutral-200)] p-2">
                        {selectedSubscription.paymentDate ? new Date(selectedSubscription.paymentDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                      </div>
                    </div>
                    
                    {selectedSubscription.receipt && (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">إيصال الدفع</label>
                        <div className="mt-2">
                          <a
                            href={selectedSubscription.receipt}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block rounded-md bg-[var(--primary-50)] px-4 py-2 text-sm text-[var(--primary-600)] hover:bg-[var(--primary-100)]"
                          >
                            عرض الإيصال
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleCloseSubscriptionModal}
                    className="rounded-md bg-[var(--neutral-100)] px-4 py-2 text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscriptionFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="userId" className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                    معرف المستخدم *
                  </label>
                  <input
                    type="text"
                    id="userId"
                    name="userId"
                    required
                    className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                    placeholder="أدخل معرف المستخدم"
                  />
                  <p className="mt-1 text-xs text-[var(--neutral-500)]">
                    ملاحظة: يجب أن يكون المستخدم موجودًا بالفعل في النظام
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                      تاريخ البداية *
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      required
                      className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                      تاريخ النهاية *
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      required
                      className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="amount" className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                    المبلغ *
                  </label>
                  <input
                    type="text"
                    id="amount"
                    name="amount"
                    defaultValue={plan.isDonation ? '' : plan.price}
                    required
                    className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                    placeholder="أدخل المبلغ"
                  />
                </div>
                
                <div>
                  <label htmlFor="paymentMethod" className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                    طريقة الدفع
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                  >
                    <option value="">اختر طريقة الدفع</option>
                    <option value="cash">نقدًا</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="mobile_payment">دفع موبايل</option>
                  </select>
                </div>
                
                <div className="mt-6 flex justify-end space-x-2 rtl:space-x-reverse">
                  <button
                    type="button"
                    onClick={handleCloseSubscriptionModal}
                    className="rounded-md bg-[var(--neutral-100)] px-4 py-2 text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                  >
                    إلغاء
                  </button>
                  
                  <button
                    type="submit"
                    className="rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
                  >
                    إضافة
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-[var(--neutral-900)]">
              تسجيل دفع
            </h3>
            
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">المستخدم</label>
                <div className="rounded-md border border-[var(--neutral-200)] p-2">
                  {selectedSubscription.user?.profile?.firstName} {selectedSubscription.user?.profile?.lastName}
                </div>
              </div>
              
              <div>
                <label htmlFor="amount" className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  المبلغ *
                </label>
                <input
                  type="text"
                  id="amount"
                  name="amount"
                  defaultValue={selectedSubscription.amount}
                  required
                  className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                />
              </div>
              
              <div>
                <label htmlFor="paymentMethod" className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  طريقة الدفع *
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  required
                  className="w-full rounded-md border border-[var(--neutral-300)] p-2 focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
                >
                  <option value="">اختر طريقة الدفع</option>
                  <option value="cash">نقدًا</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="mobile_payment">دفع موبايل</option>
                </select>
              </div>
              
              <div className="mt-6 flex justify-end space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={handleClosePaymentModal}
                  className="rounded-md bg-[var(--neutral-100)] px-4 py-2 text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                >
                  إلغاء
                </button>
                
                <button
                  type="submit"
                  className="rounded-md bg-[var(--success-600)] px-4 py-2 text-white hover:bg-[var(--success-700)]"
                >
                  تأكيد الدفع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
