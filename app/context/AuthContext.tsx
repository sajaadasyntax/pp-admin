"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient } from "./apiContext";
import Cookies from 'js-cookie';

// User levels in Arabic
export type UserLevel = "الحي" | "الوحدة الإدارية" | "المحلية" | "الولاية" | "الإتحادية" | "مدير النظام";

interface User {
  id: string;
  name: string;
  email: string;
  level: UserLevel;
  role: string;
  adminLevel: 'GENERAL_SECRETARIAT' | 'REGION' | 'LOCALITY' | 'ADMIN_UNIT' | 'DISTRICT' | 'USER' | 'ADMIN';
  regionId?: string;
  localityId?: string;
  adminUnitId?: string;
  districtId?: string;
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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
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
            regionId: userData.regionId,
            localityId: userData.localityId,
            adminUnitId: userData.adminUnitId,
            districtId: userData.districtId,
            region: userData.region,
            locality: userData.locality,
            adminUnit: userData.adminUnit,
            district: userData.district
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
    const { adminLevel, regionName, localityName, adminUnitName, districtName } = userData;
    
    switch(adminLevel) {
      case "GENERAL_SECRETARIAT":
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
      default:
        return "الحي";
    }
  };

  const login = async (mobileNumber: string, password: string) => {
    console.log("AuthContext: Starting login process");
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("AuthContext: Making API request");
      const response = await apiClient.auth.login(mobileNumber, password);
      console.log("AuthContext: API response received", response);
      const { token: authToken, refreshToken: newRefreshToken, user: userData } = response;
      
      // Make sure it's an admin account
      if (userData.role !== "ADMIN") {
        console.log("AuthContext: Non-admin user attempted login");
        throw new Error("غير مصرح لك بالدخول إلى لوحة التحكم");
      }
      
      console.log("AuthContext: Storing tokens");
      // Store tokens in cookies
      Cookies.set("token", authToken, { expires: 1 }); // 1 day
      Cookies.set("refreshToken", newRefreshToken, { expires: 7 }); // 7 days
      
      console.log("AuthContext: Updating state");
      // Then update state in the correct order
      setToken(authToken);
      setRefreshToken(newRefreshToken);
        setUser({
          id: userData.id,
          name: userData.name || userData.email,
          email: userData.email,
          level: mapRoleToLevel(userData),
          role: userData.role,
          adminLevel: userData.adminLevel,
          regionId: userData.regionId,
          localityId: userData.localityId,
          adminUnitId: userData.adminUnitId,
          districtId: userData.districtId,
          region: userData.region,
          locality: userData.locality,
          adminUnit: userData.adminUnit,
          district: userData.district
        });
      
      console.log("AuthContext: Login successful");
      return true; // Indicate successful login
    } catch (err) {
      console.error("AuthContext: Login error", err);
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
      console.log("AuthContext: Finishing login process");
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