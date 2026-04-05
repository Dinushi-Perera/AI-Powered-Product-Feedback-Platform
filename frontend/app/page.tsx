"use client";

import { FormEvent, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { MessageSquarePlus, Bug, Lightbulb, Zap, HelpCircle, Send, User, Mail, ShieldAlert } from "lucide-react";

type Category = "Bug" | "Feature Request" | "Improvement" | "Other";

const categories: { label: Category; icon: React.ReactNode; desc: string; color: string }[] = [
  { label: "Bug", icon: <Bug size={18} />, desc: "Report an issue", color: "bg-rose-100 text-rose-600" },
  { label: "Feature Request", icon: <Lightbulb size={18} />, desc: "Suggest an idea", color: "bg-amber-100 text-amber-600" },
  { label: "Improvement", icon: <Zap size={18} />, desc: "Enhance existing flow", color: "bg-blue-100 text-blue-600" },
  { label: "Other", icon: <HelpCircle size={18} />, desc: "General feedback", color: "bg-slate-100 text-slate-600" }
];

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Bug");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const descriptionCount = description.length;
  const descriptionHint = useMemo(() => {
    if (descriptionCount >= 20) return "Looks great!";
    return `Minimum 20 characters required (${descriptionCount}/20).`;
  }, [descriptionCount]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (description.trim().length < 20) {
      setError("Description must be at least 20 characters.");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
          submitterName: submitterName || undefined,
          submitterEmail: submitterEmail || undefined
        })
      });

      setTitle("");
      setDescription("");
      setCategory("Bug");
      setSubmitterName("");
      setSubmitterEmail("");
      setSuccess("Your feedback has run its course to our team. Thank you!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-8 lg:gap-12 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Left Side: Branding & Info */}
        <div className="bg-gradient-to-br from-brand-600 to-indigo-900 p-10 lg:p-14 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8 opacity-90">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <MessageSquarePlus size={28} className="text-brand-50" />
              </div>
              <span className="text-xl font-bold tracking-wide">FeedPulse</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
              Help us shape <br/> the future.
            </h1>
            <p className="text-brand-100 text-lg leading-relaxed max-w-md">
              Whether it's a bug that's bothering you, a feature you're dreaming of, or just general thoughts—we want to hear it all.
            </p>
          </div>

          <div className="mt-12 relative z-10 hidden lg:block space-y-6">
            {categories.map(cat => (
              <div key={cat.label} className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                <div className={`p-3 rounded-full bg-white/20 ${cat.color.replace('bg-', 'bg-white text-')}`}>
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{cat.label}</h3>
                  <p className="text-sm text-brand-100">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Decorative background elements */}
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-20%] w-[400px] h-[400px] bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 lg:p-14 lg:pl-8 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Submit Feedback</h2>
            <p className="text-slate-500 mt-1">Fill out the form below to let us know your thoughts.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            
            {/* Category Cards Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">What is this regarding?</label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={`flex flex-col items-start gap-2 p-3 rounded-xl border-2 transition-all text-left
                      ${category === cat.label ? 'border-brand-600 bg-brand-50' : 'border-slate-100 bg-white hover:border-brand-200 hover:bg-slate-50'}`}
                  >
                    <div className={`p-2 rounded-lg ${cat.color}`}>{cat.icon}</div>
                    <span className={`text-sm font-medium ${category === cat.label ? 'text-brand-900' : 'text-slate-700'}`}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Title</label>
              <input 
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 placeholder-slate-400"
                placeholder="Short, descriptive title..."
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                maxLength={120} 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="block text-sm font-semibold text-slate-700">Description</label>
                <span className={`text-xs font-medium ${descriptionCount >= 20 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {descriptionHint}
                </span>
              </div>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 resize-none placeholder-slate-400"
                placeholder="Give us all the details..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 placeholder-slate-400"
                    placeholder="Jane Doe"
                    value={submitterName} 
                    onChange={(e) => setSubmitterName(e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Email <span className="text-slate-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 placeholder-slate-400"
                    placeholder="jane@example.com"
                    type="email"
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-4 text-rose-700 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300">
                <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-emerald-700 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300">
                <div className="p-1 rounded-full bg-emerald-200/50">
                  <Zap size={14} className="shrink-0 text-emerald-600" />
                </div>
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}

            <button 
              className="w-full relative overflow-hidden group btn border-0 bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg hover:shadow-brand-500/20 active:scale-[0.98] disabled:scale-100 disabled:opacity-70 disabled:cursor-not-allowed py-3.5 rounded-xl text-base"
              disabled={loading} 
              type="submit"
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Feedback</span>
                    <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] transition-transform duration-700 group-hover:translate-x-[150%]"></div>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
