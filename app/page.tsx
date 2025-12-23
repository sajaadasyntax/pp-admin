"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";

export default function LoginPage() {
  const [mobileNumber, setMobileNumber] = useState("900000001");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const { login, isLoading, user } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!mobileNumber || !password) {
      setError("الرجاء إدخال رقم الهاتف وكلمة المرور");
      return;
    }
    
    try {
      // Add Sudan country code (+249) to the mobile number
      const fullMobileNumber = `+249${mobileNumber}`;
      const success = await login(fullMobileNumber, password);
      if (success) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("فشل تسجيل الدخول. الرجاء التحقق من بيانات الاعتماد الخاصة بك");
    }
  };

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary-500)] border-t-transparent"></div>
          <div className="text-xl text-[var(--neutral-600)]">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  // If user is logged in, show redirect message (useEffect will handle redirect)
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary-500)] border-t-transparent"></div>
          <div className="text-xl text-[var(--neutral-600)]">جاري التوجيه إلى لوحة التحكم...</div>
        </div>
      </div>
    );
  }

  // If not logged in, show login form

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-[var(--card)] p-6 shadow-lg">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-[var(--primary-600)]">لوحة إدارة التطبيق</h1>
          <p className="mb-4 text-sm text-[var(--neutral-500)]">قم بتسجيل الدخول للوصول إلى لوحة التحكم</p>
        </div>
        
        {error && (
          <div className="rounded-xl bg-[var(--error-50)] p-4 text-sm text-[var(--error-600)]">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="mobileNumber" className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                رقم الهاتف
              </label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                autoComplete="tel"
                required
                className="relative block w-full appearance-none rounded-xl border border-[var(--neutral-300)] px-4 py-3 text-[var(--neutral-900)] placeholder-[var(--neutral-400)] focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
                placeholder="أدخل رقم الهاتف (مثال: 900000001)"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                dir="rtl"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-xl border border-[var(--neutral-300)] px-4 py-3 text-[var(--neutral-900)] placeholder-[var(--neutral-400)] focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="rtl"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="app-button-primary w-full py-3 text-base"
            >
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
