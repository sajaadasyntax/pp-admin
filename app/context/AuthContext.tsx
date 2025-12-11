"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient } from "./apiContext";
import Cookies from 'js-cookie';

// User levels in Arabic
export type UserLevel = "الحي" | "الوحدة الإدارية" | "المحلية" | "الولاية" | "الإتحادية" | "مدير النظام";

// AdminLevel type matching backend schema.prisma
export type AdminLevelType = 
  | 'GENERAL_SECRETARIAT' 
  | 'REGION' 
  | 'LOCALITY' 
  | 'ADMIN_UNIT' 
  | 'DISTRICT' 
  | 'USER' 
  | 'ADMIN'
  | 'NATIONAL_LEVEL'
  | 'EXPATRIATE_GENERAL'
  | 'EXPATRIATE_REGION';

// ActiveHierarchy type matching backend schema.prisma
export type ActiveHierarchyType = 'ORIGINAL' | 'EXPATRIATE' | 'SECTOR';

interface User {
  id: string;
  name: string;
  email: string;
  level: UserLevel;
  role: string;
  adminLevel: AdminLevelType;
  activeHierarchy?: ActiveHierarchyType;
  
  // Original hierarchy
  nationalLevelId?: string;
  regionId?: string;
  localityId?: string;
  adminUnitId?: string;
  districtId?: string;
  
  // Expatriate hierarchy
  expatriateRegionId?: string;
  
  // Sector hierarchy
  sectorNationalLevelId?: string;
  sectorRegionId?: string;
  sectorLocalityId?: string;
  sectorAdminUnitId?: string;
  sectorDistrictId?: string;
  
  // Original hierarchy objects
  nationalLevel?: {
    id: string;
    name: string;
  };
  region?: {
    id: string;
    name: string;
  };
  locality?: {
    id: string;
    name: string;
  };
  adminUnit?: {
    id: string;
    name: string;
  };
  district?: {
    id: string;
    name: string;
  };
  
  // Expatriate hierarchy objects
  expatriateRegion?: {
    id: string;
    name: string;
  };
  
  // Sector hierarchy objects
  sectorNationalLevel?: {
    id: string;
    name: string;
  };
  sectorRegion?: {
    id: string;
    name: string;
  };
  sectorLocality?: {
    id: string;
    name: string;
  };
  sectorAdminUnit?: {
    id: string;
    name: string;
  };
  sectorDistrict?: {
    id: string;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (mobileNumber: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  login: async () => false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on initial load
  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = Cookies.get("token");
        const storedRefreshToken = Cookies.get("refreshToken");
        
        if (storedToken && storedRefreshToken) {
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          
          // Fetch user profile with the token
          const userData = await apiClient.users.getProfile(storedToken);
          setUser({
            id: userData.id,
            name: userData.name || userData.email,
            email: userData.email,
            level: mapRoleToLevel(userData),
            role: userData.role,
            adminLevel: userData.adminLevel,
            activeHierarchy: userData.activeHierarchy,
            // Original hierarchy
            nationalLevelId: userData.nationalLevelId,
            regionId: userData.regionId,
            localityId: userData.localityId,
            adminUnitId: userData.adminUnitId,
            districtId: userData.districtId,
            // Expatriate hierarchy
            expatriateRegionId: userData.expatriateRegionId,
            // Sector hierarchy
            sectorNationalLevelId: userData.sectorNationalLevelId,
            sectorRegionId: userData.sectorRegionId,
            sectorLocalityId: userData.sectorLocalityId,
            sectorAdminUnitId: userData.sectorAdminUnitId,
            sectorDistrictId: userData.sectorDistrictId,
            // Original hierarchy objects
            nationalLevel: userData.nationalLevel,
            region: userData.region,
            locality: userData.locality,
            adminUnit: userData.adminUnit,
            district: userData.district,
            // Expatriate hierarchy objects
            expatriateRegion: userData.expatriateRegion,
            // Sector hierarchy objects
            sectorNationalLevel: userData.sectorNationalLevel,
            sectorRegion: userData.sectorRegion,
            sectorLocality: userData.sectorLocality,
            sectorAdminUnit: userData.sectorAdminUnit,
            sectorDistrict: userData.sectorDistrict
          });
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        // Clear invalid tokens
        Cookies.remove("token");
        Cookies.remove("refreshToken");
        setToken(null);
        setRefreshToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  const mapRoleToLevel = (userData: any): UserLevel => {
    // Map backend adminLevel to frontend user levels
    const { adminLevel } = userData;
    
    switch(adminLevel) {
      case "GENERAL_SECRETARIAT":
        return "الإتحادية";
      case "NATIONAL_LEVEL":
        return "الإتحادية";
      case "REGION":
        return "الولاية";
      case "LOCALITY":
        return "المحلية";
      case "ADMIN_UNIT":
        return "الوحدة الإدارية";
      case "DISTRICT":
        return "الحي";
      case "ADMIN":
        return "مدير النظام";
      case "EXPATRIATE_GENERAL":
        return "الإتحادية";
      case "EXPATRIATE_REGION":
        return "الولاية";
      default:
        return "الحي";
    }
  };

  const login = async (mobileNumber: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.auth.login(mobileNumber, password);
      const { token: authToken, refreshToken: newRefreshToken, user: userData } = response;
      
      // Make sure it's an admin account
      if (userData.role !== "ADMIN") {
        throw new Error("غير مصرح لك بالدخول إلى لوحة التحكم");
      }
      
      // Store tokens in cookies
      Cookies.set("token", authToken, { expires: 1 }); // 1 day
      Cookies.set("refreshToken", newRefreshToken, { expires: 7 }); // 7 days
      
      // Then update state
      setToken(authToken);
      setRefreshToken(newRefreshToken);
      setUser({
        id: userData.id,
        name: userData.name || userData.email,
        email: userData.email,
        level: mapRoleToLevel(userData),
        role: userData.role,
        adminLevel: userData.adminLevel,
        activeHierarchy: userData.activeHierarchy,
        // Original hierarchy
        nationalLevelId: userData.nationalLevelId,
        regionId: userData.regionId,
        localityId: userData.localityId,
        adminUnitId: userData.adminUnitId,
        districtId: userData.districtId,
        // Expatriate hierarchy
        expatriateRegionId: userData.expatriateRegionId,
        // Sector hierarchy
        sectorNationalLevelId: userData.sectorNationalLevelId,
        sectorRegionId: userData.sectorRegionId,
        sectorLocalityId: userData.sectorLocalityId,
        sectorAdminUnitId: userData.sectorAdminUnitId,
        sectorDistrictId: userData.sectorDistrictId,
        // Original hierarchy objects
        nationalLevel: userData.nationalLevel,
        region: userData.region,
        locality: userData.locality,
        adminUnit: userData.adminUnit,
        district: userData.district,
        // Expatriate hierarchy objects
        expatriateRegion: userData.expatriateRegion,
        // Sector hierarchy objects
        sectorNationalLevel: userData.sectorNationalLevel,
        sectorRegion: userData.sectorRegion,
        sectorLocality: userData.sectorLocality,
        sectorAdminUnit: userData.sectorAdminUnit,
        sectorDistrict: userData.sectorDistrict
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء تسجيل الدخول";
      setError(errorMessage);
      // Clear any partial state
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      Cookies.remove("token");
      Cookies.remove("refreshToken");
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      if (token) {
        await apiClient.auth.logout(token);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Clear state and storage in the correct order
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      Cookies.remove("token");
      Cookies.remove("refreshToken");
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 