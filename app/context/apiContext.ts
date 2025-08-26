// API client service for connecting to the backend

export const API_BASE_URL = 'http://localhost:5000/api';
export const PUBLIC_URL = 'http://localhost:5000';

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
    login: async (email: string, password: string) => {
      console.log('Making login request to:', `${API_BASE_URL}/auth/login`);
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        });
        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', data);
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
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
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
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getAllUsers: async (token: string) => {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getUserById: async (token: string, userId: string) => {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createUser: async (token: string, userData: any) => {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },
    updateUser: async (token: string, userId: string, userData: any) => {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
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
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
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
    getAllContent: async (token: string, params: any = {}) => {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? 
        `${API_BASE_URL}/content?${queryParams}` : 
        `${API_BASE_URL}/content`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getContentById: async (token: string, contentId: string) => {
      const response = await fetch(`${API_BASE_URL}/content/${contentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createContent: async (token: string, contentData: any) => {
      const response = await fetch(`${API_BASE_URL}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(contentData),
      });
      return handleResponse(response);
    },
    updateContent: async (token: string, contentId: string, contentData: any) => {
      const response = await fetch(`${API_BASE_URL}/content/${contentId}`, {
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
      const response = await fetch(`${API_BASE_URL}/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    togglePublishContent: async (token: string, contentId: string) => {
      const response = await fetch(`${API_BASE_URL}/content/${contentId}/publish`, {
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
      const response = await fetch(`${API_BASE_URL}/content/bulletins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createBulletin: async (token: string, bulletinData: any, imageFile?: File) => {
      // CRITICAL: Make sure targetRegionId is always set
      if (!bulletinData.targetRegionId) {
        console.error("MISSING targetRegionId in bulletinData:", bulletinData);
        
        // Get first region as fallback (this is a last resort)
        try {
          const regionsResponse = await fetch(`${API_BASE_URL}/hierarchy-management/regions`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (regionsResponse.ok) {
            const regions = await regionsResponse.json();
            if (regions && regions.length > 0) {
              bulletinData.targetRegionId = regions[0].id;
              console.log("Automatically added targetRegionId:", bulletinData.targetRegionId);
            } else {
              throw new Error("No regions found to use as targetRegionId");
            }
          } else {
            throw new Error("Failed to fetch regions for targetRegionId");
          }
        } catch (error) {
          console.error("Failed to get default region:", error);
          throw new Error("targetRegionId is required for creating bulletins");
        }
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
        
        const response = await fetch(`${API_BASE_URL}/content/bulletins`, {
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
      
      const response = await fetch(`${API_BASE_URL}/content/bulletins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      return handleResponse(response);
    },
    updateBulletin: async (token: string, bulletinId: string, bulletinData: any, imageFile?: File) => {
      // CRITICAL: Make sure targetRegionId is always set
      if (!bulletinData.targetRegionId) {
        console.error("MISSING targetRegionId in bulletinData (update):", bulletinData);
        
        // Get first region as fallback (this is a last resort)
        try {
          const regionsResponse = await fetch(`${API_BASE_URL}/hierarchy-management/regions`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (regionsResponse.ok) {
            const regions = await regionsResponse.json();
            if (regions && regions.length > 0) {
              bulletinData.targetRegionId = regions[0].id;
              console.log("Automatically added targetRegionId for update:", bulletinData.targetRegionId);
            } else {
              throw new Error("No regions found to use as targetRegionId for update");
            }
          } else {
            throw new Error("Failed to fetch regions for targetRegionId during update");
          }
        } catch (error) {
          console.error("Failed to get default region for update:", error);
          throw new Error("targetRegionId is required for updating bulletins");
        }
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
        
        const response = await fetch(`${API_BASE_URL}/content/bulletins/${bulletinId}`, {
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
      
      const response = await fetch(`${API_BASE_URL}/content/bulletins/${bulletinId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      return handleResponse(response);
    },
    deleteBulletin: async (token: string, bulletinId: string) => {
      const response = await fetch(`${API_BASE_URL}/content/bulletins/${bulletinId}`, {
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
        `${API_BASE_URL}/content/archive?category=${encodeURIComponent(category)}` :
        `${API_BASE_URL}/content/archive`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    uploadDocument: async (token: string, formData: FormData) => {
      const response = await fetch(`${API_BASE_URL}/content/archive/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      return handleResponse(response);
    },
    deleteDocument: async (token: string, documentId: string) => {
      const response = await fetch(`${API_BASE_URL}/content/archive/${documentId}`, {
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
      const response = await fetch(`${API_BASE_URL}/content/surveys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getSurveyById: async (token: string, surveyId: string) => {
      const response = await fetch(`${API_BASE_URL}/content/surveys/${surveyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createSurvey: async (token: string, surveyData: any) => {
      const response = await fetch(`${API_BASE_URL}/content/surveys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(surveyData),
      });
      return handleResponse(response);
    },
    updateSurvey: async (token: string, surveyId: string, surveyData: any) => {
      const response = await fetch(`${API_BASE_URL}/content/surveys/${surveyId}`, {
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
      const response = await fetch(`${API_BASE_URL}/content/surveys/${surveyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getSurveyResponses: async (token: string, surveyId: string) => {
      const response = await fetch(`${API_BASE_URL}/content/surveys/${surveyId}/responses`, {
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
      const response = await fetch(`${API_BASE_URL}/content/voting`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getVotingItemById: async (token: string, votingId: string) => {
      const response = await fetch(`${API_BASE_URL}/content/voting/${votingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createVotingItem: async (token: string, votingData: any) => {
      const response = await fetch(`${API_BASE_URL}/content/voting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(votingData),
      });
      return handleResponse(response);
    },
    updateVotingItem: async (token: string, votingId: string, votingData: any) => {
      const response = await fetch(`${API_BASE_URL}/content/voting/${votingId}`, {
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
      const response = await fetch(`${API_BASE_URL}/content/voting/${votingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getVotingResults: async (token: string, votingId: string) => {
      const response = await fetch(`${API_BASE_URL}/content/voting/${votingId}/results`, {
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
        `${API_BASE_URL}/content/reports?status=${encodeURIComponent(status)}` :
        `${API_BASE_URL}/content/reports`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getReportById: async (token: string, reportId: string) => {
      const response = await fetch(`${API_BASE_URL}/content/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    updateReportStatus: async (token: string, reportId: string, status: string) => {
      const response = await fetch(`${API_BASE_URL}/content/reports/${reportId}/status`, {
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
      const response = await fetch(`${API_BASE_URL}/content/reports/${reportId}`, {
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
        `${API_BASE_URL}/users/memberships?status=${encodeURIComponent(status)}` : 
        `${API_BASE_URL}/users/memberships`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createMember: async (token: string, memberData: any) => {
      const response = await fetch(`${API_BASE_URL}/users/members`, {
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
      const response = await fetch(`${API_BASE_URL}/users/${memberId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    updateMembershipStatus: async (token: string, userId: string, status: string) => {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
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
      const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
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
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
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
      const response = await fetch(`${API_BASE_URL}/content/subscription-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    createPlan: async (token: string, planData: any) => {
      const response = await fetch(`${API_BASE_URL}/content/subscription-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(planData),
      });
      return handleResponse(response);
    },
    updatePlan: async (token: string, planId: string, planData: any) => {
      const response = await fetch(`${API_BASE_URL}/content/subscription-plans/${planId}`, {
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
      const response = await fetch(`${API_BASE_URL}/content/subscription-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
  },
  
  // Subscriptions management
  subscriptions: {
    getAllSubscriptions: async (token: string) => {
      const response = await fetch(`${API_BASE_URL}/content/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    getUserSubscriptions: async (token: string, userId: string) => {
      const response = await fetch(`${API_BASE_URL}/content/subscriptions/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    },
    updateSubscriptionStatus: async (token: string, subscriptionId: string, status: string) => {
      const response = await fetch(`${API_BASE_URL}/content/subscriptions/${subscriptionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return handleResponse(response);
    },
  },
}; 