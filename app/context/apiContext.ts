// API client service for connecting to the backend
import { UserData, ContentData, BulletinData, PlanData, SurveyData, VotingData } from '../types';
import subscriptionService from '../services/subscriptionService';
import { apiUrl } from '@/app/config/api';

// Centralized base URL comes from config
export const PUBLIC_URL = apiUrl.replace(/\/api$/, '');

// Helper function for handling API responses
const handleResponse = async (response: Response) => {
  try {
    // Status 204 No Content doesn't have a body to parse
    if (response.status === 204) {
      return { success: true };
    }
    
    // Try to parse the response as JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      // Only parse if we have content
      if (text && text.trim()) {
        data = JSON.parse(text);
      } else {
        data = {}; // Empty object if no content
      }
    } else {
      data = { message: 'Response is not JSON' };
    }
    
    // Check if response is ok
    if (!response.ok) {
      console.error('API Error:', response.status, data);
      throw new Error(data?.error || data?.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Response handling error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('حدث خطأ في الاتصال بالخادم');
  }
};

// API client with authentication
export const apiClient = {
  // Auth endpoints
  auth: {
    login: async (mobileNumber: string, password: string) => {
      try {
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileNumber, password }),
          credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || data.message || 'حدث خطأ في الاتصال بالخادم');
        }
        return data;
      } catch (error) {
        console.error('Login request failed:', error);
        throw error;
      }
    },
    logout: async (token: string) => {
      const response = await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
  },
  
  // User endpoints
  users: {
    getProfile: async (token: string) => {
      const response = await fetch(`${apiUrl}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getAllUsers: async (token: string) => {
      const response = await fetch(`${apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getUserById: async (token: string, userId: string) => {
      const response = await fetch(`${apiUrl}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createUser: async (token: string, userData: UserData) => {
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },
    updateUser: async (token: string, userId: string, userData: UserData) => {
      const response = await fetch(`${apiUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },
    deleteUser: async (token: string, userId: string) => {
      const response = await fetch(`${apiUrl}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
  },
  
  // Content endpoints
  content: {
    getAllContent: async (token: string, params: Record<string, string> = {}) => {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? 
        `${apiUrl}/content?${queryParams}` : 
        `${apiUrl}/content`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getContentById: async (token: string, contentId: string) => {
      const response = await fetch(`${apiUrl}/content/${contentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createContent: async (token: string, contentData: ContentData) => {
      const response = await fetch(`${apiUrl}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(contentData),
      });
      return handleResponse(response);
    },
    updateContent: async (token: string, contentId: string, contentData: ContentData) => {
      const response = await fetch(`${apiUrl}/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(contentData),
      });
      return handleResponse(response);
    },
    deleteContent: async (token: string, contentId: string) => {
      const response = await fetch(`${apiUrl}/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    togglePublishContent: async (token: string, contentId: string) => {
      const response = await fetch(`${apiUrl}/content/${contentId}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
  },
  
  // Bulletins endpoints
  bulletins: {
    getAllBulletins: async (token: string) => {
      const response = await fetch(`${apiUrl}/content/bulletins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createBulletin: async (token: string, bulletinData: BulletinData, imageFile?: File) => {
      // CRITICAL: Make sure targetRegionId is always set
      if (!bulletinData.targetRegionId) {
        throw new Error("targetRegionId is required for creating bulletins. Please select a target region.");
      }
      
      // If no image file, use the standard JSON request
      if (!imageFile) {
        // Ensure regionId is properly included
        console.log('Creating bulletin with data (no image):', bulletinData);
        
        // Double-check targetRegionId is present and is a string
        const dataToSend = {
          ...bulletinData,
          targetRegionId: String(bulletinData.targetRegionId),
        };
        
        console.log("FINAL DATA TO SEND:", dataToSend);
        
        const response = await fetch(`${apiUrl}/content/bulletins`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSend),
        });
        return handleResponse(response);
      }
      
      // If image file exists, use FormData for multipart/form-data
      const formData = new FormData();
      
      // Make sure we're including the bulletin data
      console.log('Creating bulletin with data (with image):', bulletinData);
      
      // Double-check targetRegionId is present and is a string
      const dataToSend = {
        ...bulletinData,
        targetRegionId: String(bulletinData.targetRegionId),
      };
      
      console.log("FINAL DATA TO SEND (with image):", dataToSend);
      
      formData.append('bulletinData', JSON.stringify(dataToSend));
      formData.append('image', imageFile);
      
      const response = await fetch(`${apiUrl}/content/bulletins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      return handleResponse(response);
    },
    updateBulletin: async (token: string, bulletinId: string, bulletinData: BulletinData, imageFile?: File) => {
      // CRITICAL: Make sure targetRegionId is always set
      if (!bulletinData.targetRegionId) {
        throw new Error("targetRegionId is required for updating bulletins. Please select a target region.");
      }
      
      // If no image file, use the standard JSON request
      if (!imageFile) {
        // Ensure regionId is properly included
        console.log('Updating bulletin with data (no image):', bulletinData);
        
        // Double-check targetRegionId is present and is a string
        const dataToSend = {
          ...bulletinData,
          targetRegionId: String(bulletinData.targetRegionId),
        };
        
        console.log("FINAL UPDATE DATA TO SEND:", dataToSend);
        
        const response = await fetch(`${apiUrl}/content/bulletins/${bulletinId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSend),
        });
        return handleResponse(response);
      }
      
      // If image file exists, use FormData for multipart/form-data
      const formData = new FormData();
      
      // Make sure we're including the bulletin data
      console.log('Updating bulletin with data (with image):', bulletinData);
      
      // Double-check targetRegionId is present and is a string
      const dataToSend = {
        ...bulletinData,
        targetRegionId: String(bulletinData.targetRegionId),
      };
      
      console.log("FINAL UPDATE DATA TO SEND (with image):", dataToSend);
      
      formData.append('bulletinData', JSON.stringify(dataToSend));
      formData.append('image', imageFile);
      
      const response = await fetch(`${apiUrl}/content/bulletins/${bulletinId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      return handleResponse(response);
    },
    deleteBulletin: async (token: string, bulletinId: string) => {
      const response = await fetch(`${apiUrl}/content/bulletins/${bulletinId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
  },
  
  // Archive endpoints
  archive: {
    getAllDocuments: async (token: string, category?: string) => {
      const url = category ? 
        `${apiUrl}/content/archive?category=${encodeURIComponent(category)}` :
        `${apiUrl}/content/archive`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    uploadDocument: async (token: string, formData: FormData) => {
      const response = await fetch(`${apiUrl}/content/archive/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      return handleResponse(response);
    },
    deleteDocument: async (token: string, documentId: string) => {
      const response = await fetch(`${apiUrl}/content/archive/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
  },
  
  // Surveys endpoints
  surveys: {
    getAllSurveys: async (token: string) => {
      const response = await fetch(`${apiUrl}/content/surveys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getSurveyById: async (token: string, surveyId: string) => {
      const response = await fetch(`${apiUrl}/content/surveys/${surveyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createSurvey: async (token: string, surveyData: SurveyData) => {
      const response = await fetch(`${apiUrl}/content/surveys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(surveyData),
      });
      return handleResponse(response);
    },
    updateSurvey: async (token: string, surveyId: string, surveyData: SurveyData) => {
      const response = await fetch(`${apiUrl}/content/surveys/${surveyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(surveyData),
      });
      return handleResponse(response);
    },
    deleteSurvey: async (token: string, surveyId: string) => {
      const response = await fetch(`${apiUrl}/content/surveys/${surveyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getSurveyResponses: async (token: string, surveyId: string) => {
      const response = await fetch(`${apiUrl}/content/surveys/${surveyId}/responses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
  },
  
  // Voting endpoints
  voting: {
    getAllVotingItems: async (token: string) => {
      const response = await fetch(`${apiUrl}/content/voting`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getVotingItemById: async (token: string, votingId: string) => {
      const response = await fetch(`${apiUrl}/content/voting/${votingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createVotingItem: async (token: string, votingData: VotingData) => {
      const response = await fetch(`${apiUrl}/content/voting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(votingData),
      });
      return handleResponse(response);
    },
    updateVotingItem: async (token: string, votingId: string, votingData: VotingData) => {
      const response = await fetch(`${apiUrl}/content/voting/${votingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(votingData),
      });
      return handleResponse(response);
    },
    deleteVotingItem: async (token: string, votingId: string) => {
      const response = await fetch(`${apiUrl}/content/voting/${votingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getVotingResults: async (token: string, votingId: string) => {
      const response = await fetch(`${apiUrl}/content/voting/${votingId}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
  },
  
  // Reports endpoints
  reports: {
    getAllReports: async (token: string, status?: string) => {
      const url = status ? 
        `${apiUrl}/content/reports?status=${encodeURIComponent(status)}` :
        `${apiUrl}/content/reports`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getReportById: async (token: string, reportId: string) => {
      const response = await fetch(`${apiUrl}/content/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    updateReportStatus: async (token: string, reportId: string, status: string) => {
      const response = await fetch(`${apiUrl}/content/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return handleResponse(response);
    },
    deleteReport: async (token: string, reportId: string) => {
      const response = await fetch(`${apiUrl}/content/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
  },
  
  // Memberships endpoints
  memberships: {
    getAllMemberships: async (token: string, status?: string) => {
      const url = status ? 
        `${apiUrl}/users/memberships?status=${encodeURIComponent(status)}` : 
        `${apiUrl}/users/memberships`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createMember: async (token: string, memberData: UserData) => {
      const response = await fetch(`${apiUrl}/users/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(memberData),
      });
      return handleResponse(response);
    },
    getMemberDetails: async (token: string, memberId: string) => {
      const response = await fetch(`${apiUrl}/users/${memberId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    updateMembershipStatus: async (token: string, userId: string, status: string) => {
      const response = await fetch(`${apiUrl}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return handleResponse(response);
    },
    resetPassword: async (token: string, userId: string, newPassword: string) => {
      const response = await fetch(`${apiUrl}/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      return handleResponse(response);
    },
    deleteMembership: async (token: string, userId: string) => {
      const response = await fetch(`${apiUrl}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
  },
  
  // Subscription plans endpoints
  subscriptionPlans: {
    getAllPlans: async (token: string) => {
      const response = await fetch(`${apiUrl}/content/subscription-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createPlan: async (token: string, planData: PlanData) => {
      const response = await fetch(`${apiUrl}/content/subscription-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(planData),
      });
      return handleResponse(response);
    },
    updatePlan: async (token: string, planId: string, planData: PlanData) => {
      const response = await fetch(`${apiUrl}/content/subscription-plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(planData),
      });
      return handleResponse(response);
    },
    deletePlan: async (token: string, planId: string) => {
      const response = await fetch(`${apiUrl}/content/subscription-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
  },
  
  // Subscription management using the new subscription service
  subscriptions: subscriptionService,
};