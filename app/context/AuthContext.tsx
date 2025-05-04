"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// User levels in Arabic
export type UserLevel = "الحي" | "الوحدة الإدارية" | "المحلية" | "الولاية" | "الإتحادية" | "مدير النظام";

interface User {
  id: string;
  name: string;
  level: UserLevel;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage or session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Here you would normally make an API call to your backend
      // This is a mock implementation for now
      if (email && password) {
        // Mock user data - in production, this would come from API
        const mockUser: User = {
          id: "1",
          name: "مستخدم تجريبي",
          level: "المحلية",
          email
        };
        
        setUser(mockUser);
        localStorage.setItem("user", JSON.stringify(mockUser));
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 