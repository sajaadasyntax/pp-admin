"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    
    const success = await login(email, password);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("فشل تسجيل الدخول. الرجاء التحقق من بيانات الاعتماد الخاصة بك");
    }
  };

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
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-xl border border-[var(--neutral-300)] px-4 py-3 text-[var(--neutral-900)] placeholder-[var(--neutral-400)] focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
                placeholder="أدخل البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
