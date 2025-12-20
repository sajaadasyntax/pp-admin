import { apiUrl } from '../config/api';

interface SubscriptionPlan {
  id: string;
  title: string;
  description?: string;
  price: string;
  currency: string;
  period: string;
  features: string;
  active: boolean;
  isApproved: boolean;
  isDonation: boolean;
  creatorId?: string;
  creator?: any;
  approverId?: string;
  approver?: any;
  createdAt: string;
  updatedAt: string;
  targetNationalLevelId?: string;
  targetRegionId?: string;
  targetLocalityId?: string;
  targetAdminUnitId?: string;
  targetDistrictId?: string;
  targetExpatriateRegionId?: string;
  targetSectorNationalLevelId?: string;
  targetSectorRegionId?: string;
  targetSectorLocalityId?: string;
  targetSectorAdminUnitId?: string;
  targetSectorDistrictId?: string;
  subscriptions?: Subscription[];
}

interface Subscription {
  id: string;
  planId: string;
  plan?: SubscriptionPlan;
  userId: string;
  user?: any;
  startDate: string;
  endDate: string;
  amount: string;
  receipt?: string;
  paymentDate?: string;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  status: 'active' | 'expired' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionStats {
  totalSubscriptions: number;
  paidSubscriptions: number;
  pendingSubscriptions: number;
  paymentRate: number;
  totalPaid: number;
}

const subscriptionService = {
  // Subscription Plans
  getSubscriptionPlans: async (token: string, options: { 
    isApproved?: boolean, 
    isDonation?: boolean,
    hierarchyLevel?: 'region' | 'locality' | 'adminUnit' | 'district',
    hierarchyId?: string
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (options.isApproved !== undefined) queryParams.append('isApproved', options.isApproved.toString());
    if (options.isDonation !== undefined) queryParams.append('isDonation', options.isDonation.toString());
    if (options.hierarchyLevel && options.hierarchyId) {
      queryParams.append('hierarchyLevel', options.hierarchyLevel);
      queryParams.append('hierarchyId', options.hierarchyId);
    }
    
    const url = `${apiUrl}/subscriptions/plans?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscription plans');
    }
    
    const data = await response.json();
    return data.data as SubscriptionPlan[];
  },
  
  getSubscriptionPlanById: async (token: string, planId: string) => {
    const response = await fetch(`${apiUrl}/subscriptions/plans/${planId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscription plan details');
    }
    
    const data = await response.json();
    return data.data as SubscriptionPlan;
  },
  
  createSubscriptionPlan: async (
    token: string,
    planData: {
      title: string;
      description?: string;
      price: string;
      currency: string;
      period: string;
      isDonation?: boolean;
      targetNationalLevelId?: string;
      targetRegionId?: string;
      targetLocalityId?: string;
      targetAdminUnitId?: string;
      targetDistrictId?: string;
      targetExpatriateRegionId?: string;
      targetSectorNationalLevelId?: string;
      targetSectorRegionId?: string;
      targetSectorLocalityId?: string;
      targetSectorAdminUnitId?: string;
      targetSectorDistrictId?: string;
    }
  ) => {
    const dataToSend = {
      ...planData,
    };
    
    console.log('API call - URL:', `${apiUrl}/subscriptions/plans`);
    console.log('API call - Data:', dataToSend);
    
    const response = await fetch(`${apiUrl}/subscriptions/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dataToSend),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create subscription plan');
    }
    
    const data = await response.json();
    return data.data as SubscriptionPlan;
  },
  
  updateSubscriptionPlan: async (
    token: string,
    planId: string,
    planData: {
      title?: string;
      description?: string;
      price?: string;
      currency?: string;
      period?: string;
      active?: boolean;
      isDonation?: boolean;
      targetNationalLevelId?: string | null;
      targetRegionId?: string | null;
      targetLocalityId?: string | null;
      targetAdminUnitId?: string | null;
      targetDistrictId?: string | null;
      targetExpatriateRegionId?: string | null;
      targetSectorNationalLevelId?: string | null;
      targetSectorRegionId?: string | null;
      targetSectorLocalityId?: string | null;
      targetSectorAdminUnitId?: string | null;
      targetSectorDistrictId?: string | null;
    }
  ) => {
    const dataToSend = {
      ...planData,
    };
    
    const response = await fetch(`${apiUrl}/subscriptions/plans/${planId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dataToSend),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update subscription plan');
    }
    
    const data = await response.json();
    return data.data as SubscriptionPlan;
  },
  
  approveSubscriptionPlan: async (token: string, planId: string) => {
    const response = await fetch(`${apiUrl}/subscriptions/plans/${planId}/approve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to approve subscription plan');
    }
    
    const data = await response.json();
    return data.data as SubscriptionPlan;
  },
  
  deleteSubscriptionPlan: async (token: string, planId: string) => {
    const response = await fetch(`${apiUrl}/subscriptions/plans/${planId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete subscription plan');
    }
    
    return true;
  },
  
  // Subscriptions
  getSubscriptions: async (token: string, options: {
    planId?: string;
    userId?: string;
    status?: string;
    paymentStatus?: string;
    isDonation?: boolean;
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (options.planId) queryParams.append('planId', options.planId);
    if (options.userId) queryParams.append('userId', options.userId);
    if (options.status) queryParams.append('status', options.status);
    if (options.paymentStatus) queryParams.append('paymentStatus', options.paymentStatus);
    if (options.isDonation !== undefined) queryParams.append('isDonation', options.isDonation.toString());
    
    const url = `${apiUrl}/subscriptions?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions');
    }
    
    const data = await response.json();
    return data.data as Subscription[];
  },
  
  getSubscriptionById: async (token: string, subscriptionId: string) => {
    const response = await fetch(`${apiUrl}/subscriptions/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscription details');
    }
    
    const data = await response.json();
    return data.data as Subscription;
  },
  
  createSubscription: async (
    token: string,
    subscriptionData: {
      planId: string;
      userId: string;
      startDate: string;
      endDate: string;
      amount: string;
      paymentMethod?: string;
      receipt?: string;
    }
  ) => {
    const response = await fetch(`${apiUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subscriptionData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      // Handle specific error cases
      if (errorData.message && errorData.message.includes('already has an active subscription')) {
        throw new Error('المستخدم لديه اشتراك نشط بالفعل في هذه الخطة');
      }
      throw new Error(errorData.message || 'Failed to create subscription');
    }
    
    const data = await response.json();
    return data.data as Subscription;
  },
  
  updateSubscription: async (
    token: string,
    subscriptionId: string,
    subscriptionData: {
      paymentStatus?: string;
      receipt?: string;
      paymentMethod?: string;
      amount?: string;
      status?: string;
    }
  ) => {
    const response = await fetch(`${apiUrl}/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subscriptionData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update subscription');
    }
    
    const data = await response.json();
    return data.data as Subscription;
  },
  
  deleteSubscription: async (token: string, subscriptionId: string) => {
    const response = await fetch(`${apiUrl}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete subscription');
    }
    
    return true;
  },
  
  getSubscriptionStats: async (token: string, planId?: string) => {
    const queryParams = new URLSearchParams();
    if (planId) queryParams.append('planId', planId);
    
    const url = `${apiUrl}/subscriptions/stats?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscription statistics');
    }
    
    const data = await response.json();
    return data.data as SubscriptionStats;
  },
};

export default subscriptionService;
export type { SubscriptionPlan, Subscription, SubscriptionStats };
