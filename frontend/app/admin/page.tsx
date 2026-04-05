"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { ShieldCheck, Mail, Lock, ArrowRight, Activity } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      const token = response.data.token;
      document.cookie = `adminToken=${token}; path=/; max-age=${60 * 60 * 12}; SameSite=Lax`;
      localStorage.setItem("adminToken", token);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop')] bg-cover bg-center px-4 py-12 relative">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 border border-white/20">
        
        {/* Header Section */}
        <div className="bg-gradient-to-b from-brand-50 to-white px-8 pt-10 pb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm border border-brand-100 flex items-center justify-center text-brand-600 mb-6 relative">
            {/* <Activity className="absolute text-brand-200 w-12 h-12 opacity-50" strokeWidth={1} /> */}
            <ShieldCheck size={32} className="relative z-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Portal</h1>
          <p className="mt-2 text-slate-500 font-medium">Verify your credentials to continue</p>
        </div>

        <form onSubmit={onSubmit} className="px-8 pb-10 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 ml-1">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 placeholder-slate-400"
                type="email" 
                placeholder="admin@example.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline px-1">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 font-medium text-center animate-in slide-in-from-top-1 duration-300">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button 
              className="w-full group relative overflow-hidden btn border-0 bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed py-3.5 rounded-xl text-base font-semibold" 
              type="submit" 
              disabled={loading}
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Secure Sign In</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent to-white/10 skew-x-12 group-hover:left-[200%] transition-all duration-700 ease-in-out"></div>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
