import { useState } from "react";

export function CreateAccount() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-between px-6 py-10 font-['Inter']">
      {/* Logo area */}
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
          <h1 className="text-white text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="text-[#8A8A9B] text-sm">Join the community around you.</p>
        </div>

        {/* Full Name */}
        <div className="flex flex-col gap-2">
          <label className="text-[#8A8A9B] text-xs font-medium uppercase tracking-widest">Full Name</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="3" stroke="#5B8DEF" strokeWidth="1.5" />
                <path d="M2 13.5c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#5B8DEF" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Alex Johnson"
              className="w-full bg-[#141420] border border-[#252535] text-white placeholder-[#4A4A60] rounded-xl px-4 pl-10 py-3.5 text-sm focus:outline-none focus:border-[#5B8DEF] transition-colors"
            />
          </div>
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
          <label className="text-[#8A8A9B] text-xs font-medium uppercase tracking-widest">Password</label>
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
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Password strength */}
        {password.length > 0 && (
          <div className="flex gap-1.5">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                password.length >= i * 3
                  ? i <= 1 ? "bg-red-500" : i <= 2 ? "bg-orange-400" : i <= 3 ? "bg-yellow-400" : "bg-green-400"
                  : "bg-[#252535]"
              }`} />
            ))}
          </div>
        )}

        {/* CTA */}
        <button className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-[#5B8DEF] to-[#A259FF] text-white font-semibold text-base shadow-lg shadow-[#5B8DEF]/20 active:opacity-90 transition-opacity">
          Create Account
        </button>

        <p className="text-center text-[#4A4A60] text-sm">
          Already have an account?{" "}
          <span className="text-[#5B8DEF] font-medium">Sign in</span>
        </p>
      </div>

      {/* Footer */}
      <p className="text-[#35354A] text-xs text-center leading-relaxed">
        By creating an account, you agree to our{" "}
        <span className="text-[#5B8DEF]">Terms</span> &amp;{" "}
        <span className="text-[#5B8DEF]">Privacy Policy</span>
      </p>
    </div>
  );
}
