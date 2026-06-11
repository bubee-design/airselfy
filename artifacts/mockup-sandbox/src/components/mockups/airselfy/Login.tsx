import { useState } from "react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-between px-6 py-10 font-['Inter']">
      {/* Logo */}
      <div className="w-full flex justify-center mt-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5B8DEF] to-[#A259FF] flex items-center justify-center shadow-lg shadow-[#5B8DEF]/30">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="10" r="5" fill="white" fillOpacity="0.9" />
              <path d="M6 22c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="21" cy="8" r="3" fill="white" fillOpacity="0.5" />
              <circle cx="7" cy="8" r="3" fill="white" fillOpacity="0.5" />
            </svg>
          </div>
          <span className="text-white text-2xl font-bold tracking-tight">airselfy</span>
        </div>
      </div>

      {/* Form */}
      <div className="w-full flex flex-col gap-5 -mt-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-white text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-[#8A8A9B] text-sm">Sign in to see who's around you.</p>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-[#8A8A9B] text-xs font-medium uppercase tracking-widest">Email</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="#5B8DEF" strokeWidth="1.5" />
                <path d="M1.5 5.5l5.72 3.8a1.5 1.5 0 001.56 0L14.5 5.5" stroke="#5B8DEF" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="alex@email.com"
              type="email"
              className="w-full bg-[#141420] border border-[#252535] text-white placeholder-[#4A4A60] rounded-xl px-4 pl-10 py-3.5 text-sm focus:outline-none focus:border-[#5B8DEF] transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[#8A8A9B] text-xs font-medium uppercase tracking-widest">Password</label>
            <span className="text-[#5B8DEF] text-xs font-medium">Forgot password?</span>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="#5B8DEF" strokeWidth="1.5" />
                <path d="M5 7V5a3 3 0 016 0v2" stroke="#5B8DEF" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="10.5" r="1" fill="#5B8DEF" />
              </svg>
            </div>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              className="w-full bg-[#141420] border border-[#252535] text-white placeholder-[#4A4A60] rounded-xl px-4 pl-10 pr-12 py-3.5 text-sm focus:outline-none focus:border-[#5B8DEF] transition-colors"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A4A60] hover:text-[#8A8A9B] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sign In CTA */}
        <button className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-[#5B8DEF] to-[#A259FF] text-white font-semibold text-base shadow-lg shadow-[#5B8DEF]/20 active:opacity-90 transition-opacity">
          Sign In
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#1E1E30]" />
          <span className="text-[#4A4A60] text-xs">or continue with</span>
          <div className="flex-1 h-px bg-[#1E1E30]" />
        </div>

        {/* Social */}
        <div className="flex gap-3">
          {["G", "A"].map((label) => (
            <button
              key={label}
              className="flex-1 py-3.5 rounded-xl border border-[#252535] bg-[#141420] text-white text-sm font-medium flex items-center justify-center gap-2 hover:border-[#5B8DEF]/40 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-[#252535] flex items-center justify-center text-[10px] font-bold text-[#8A8A9B]">{label}</div>
              {label === "G" ? "Google" : "Apple"}
            </button>
          ))}
        </div>

        <p className="text-center text-[#4A4A60] text-sm">
          New here?{" "}
          <span className="text-[#5B8DEF] font-medium">Create an account</span>
        </p>
      </div>

      <div className="h-4" />
    </div>
  );
}
