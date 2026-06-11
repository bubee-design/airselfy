import { useState } from "react";

const initials = "AJ";
const userName = "Alex Johnson";

export function Home() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-['Inter']">
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <span className="text-white text-sm font-medium">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="11" viewBox="0 0 16 11" fill="white">
            <rect x="0" y="6" width="2.5" height="5" rx="0.5" />
            <rect x="3.5" y="4" width="2.5" height="7" rx="0.5" />
            <rect x="7" y="2" width="2.5" height="9" rx="0.5" />
            <rect x="10.5" y="0" width="2.5" height="11" rx="0.5" />
            <rect x="14" y="3" width="2" height="8" rx="0.5" fillOpacity="0.4" />
          </svg>
          <svg width="15" height="11" viewBox="0 0 15 11" fill="white">
            <path d="M7.5 2.5C9.8 2.5 11.8 3.5 13.2 5.1L14.5 3.8C12.7 1.8 10.2 0.5 7.5 0.5C4.8 0.5 2.3 1.8 0.5 3.8L1.8 5.1C3.2 3.5 5.2 2.5 7.5 2.5Z" />
            <path d="M7.5 5.5C9 5.5 10.3 6.1 11.3 7.1L12.6 5.8C11.2 4.5 9.4 3.7 7.5 3.7C5.6 3.7 3.8 4.5 2.4 5.8L3.7 7.1C4.7 6.1 6 5.5 7.5 5.5Z" />
            <circle cx="7.5" cy="9.5" r="1.5" />
          </svg>
          <div className="flex items-center gap-0.5">
            <div className="w-6 h-3 rounded-sm border border-white/40 p-px">
              <div className="h-full w-4/5 bg-green-400 rounded-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-2 pb-6">
        <div>
          <p className="text-[#8A8A9B] text-sm">Good morning 👋</p>
          <h1 className="text-white text-xl font-bold tracking-tight">{userName.split(" ")[0]}</h1>
        </div>
        {/* Profile avatar */}
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#5B8DEF] to-[#A259FF] flex items-center justify-center shadow-lg shadow-[#5B8DEF]/30">
            <span className="text-white font-bold text-sm">{initials}</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#0A0A0F]" />
        </div>
      </div>

      {/* Nearby stat */}
      <div className="mx-6 mb-6 bg-[#141420] border border-[#252535] rounded-2xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#5B8DEF]/10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="3" fill="#5B8DEF" />
              <circle cx="9" cy="9" r="6" stroke="#5B8DEF" strokeWidth="1.5" strokeOpacity="0.3" />
              <circle cx="9" cy="9" r="8.5" stroke="#5B8DEF" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="2 2" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">12 people nearby</p>
            <p className="text-[#8A8A9B] text-xs">within 500m of you</p>
          </div>
        </div>
        <div className="flex -space-x-2">
          {["#5B8DEF","#A259FF","#FF6B6B"].map((c, i) => (
            <div key={i} style={{ background: c }} className="w-7 h-7 rounded-full border-2 border-[#141420]" />
          ))}
          <div className="w-7 h-7 rounded-full border-2 border-[#141420] bg-[#252535] flex items-center justify-center">
            <span className="text-[#8A8A9B] text-[9px] font-bold">+9</span>
          </div>
        </div>
      </div>

      {/* Request Buttons */}
      <div className="px-6 mb-6">
        <p className="text-[#8A8A9B] text-xs font-medium uppercase tracking-widest mb-4">Request from nearby</p>
        <div className="flex gap-3">
          {/* Photo Button */}
          <button className="flex-1 bg-[#141420] border border-[#252535] rounded-2xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-transform hover:border-[#5B8DEF]/40">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5B8DEF]/20 to-[#5B8DEF]/5 flex items-center justify-center border border-[#5B8DEF]/20">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="7" width="22" height="16" rx="3" stroke="#5B8DEF" strokeWidth="1.8" />
                <circle cx="14" cy="15" r="4.5" stroke="#5B8DEF" strokeWidth="1.8" />
                <circle cx="14" cy="15" r="1.5" fill="#5B8DEF" />
                <path d="M10 7l1.5-2h5L18 7" stroke="#5B8DEF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="21" cy="11" r="1" fill="#5B8DEF" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">Photo</p>
              <p className="text-[#8A8A9B] text-xs mt-0.5">Request a shot</p>
            </div>
          </button>

          {/* Video Button */}
          <button className="flex-1 bg-[#141420] border border-[#252535] rounded-2xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-transform hover:border-[#A259FF]/40">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A259FF]/20 to-[#A259FF]/5 flex items-center justify-center border border-[#A259FF]/20">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="8" width="16" height="12" rx="2.5" stroke="#A259FF" strokeWidth="1.8" />
                <path d="M19 12l6-3v10l-6-3V12z" stroke="#A259FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8" cy="13" r="2" fill="#A259FF" fillOpacity="0.6" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">Video</p>
              <p className="text-[#8A8A9B] text-xs mt-0.5">Request a clip</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent requests */}
      <div className="px-6 flex-1">
        <p className="text-[#8A8A9B] text-xs font-medium uppercase tracking-widest mb-3">Recent requests</p>
        <div className="flex flex-col gap-2">
          {[
            { name: "Sam K.", initials: "SK", type: "Photo", time: "2m ago", color: "#FF6B6B", done: true },
            { name: "Jordan M.", initials: "JM", type: "Video · 10s", time: "14m ago", color: "#FFB347", done: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#141420] border border-[#1E1E30] rounded-xl px-4 py-3">
              <div style={{ background: item.color + "22", border: `1px solid ${item.color}40` }} className="w-9 h-9 rounded-full flex items-center justify-center">
                <span style={{ color: item.color }} className="text-xs font-bold">{item.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{item.name}</p>
                <p className="text-[#8A8A9B] text-xs">{item.type} · {item.time}</p>
              </div>
              {item.done ? (
                <div className="w-6 h-6 rounded-full bg-green-400/15 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#252535] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#FFB347] animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="mx-4 mb-8 mt-4 bg-[#141420] border border-[#252535] rounded-2xl px-2 py-3 flex items-center justify-around">
        {[
          { id: "home", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 10L11 3l8 7v9a1 1 0 01-1 1H14v-5H8v5H4a1 1 0 01-1-1v-9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>, label: "Home" },
          { id: "map", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="10" r="6" stroke="currentColor" strokeWidth="1.6" /><path d="M11 16v4M8 19h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="11" cy="10" r="2" stroke="currentColor" strokeWidth="1.6" /></svg>, label: "Map" },
          { id: "album", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" /><rect x="6" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.4" /><circle cx="7" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M2 14l3-3 2 2 3-4 4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>, label: "Album" },
          { id: "profile", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>, label: "Profile" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors ${activeTab === tab.id ? "text-[#5B8DEF]" : "text-[#4A4A60]"}`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
