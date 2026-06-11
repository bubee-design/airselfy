import { useState } from "react";

type MediaItem = {
  id: number;
  type: "photo" | "video";
  by: string;
  date: string;
  time: string;
  duration?: string;
  bg: string;
  color: string;
};

const items: MediaItem[] = [
  { id: 1, type: "photo", by: "Sam K.", date: "Today", time: "2:14 PM", bg: "from-[#1a2a3a] to-[#0d1a28]", color: "#FF6B6B" },
  { id: 2, type: "video", by: "Jordan M.", date: "Today", time: "1:47 PM", duration: "10s", bg: "from-[#1a1228] to-[#0d0a1a]", color: "#A259FF" },
  { id: 3, type: "photo", by: "Taylor R.", date: "Yesterday", time: "6:32 PM", bg: "from-[#1a2818] to-[#0d180a]", color: "#4ADEAD" },
  { id: 4, type: "video", by: "Sam K.", date: "Yesterday", time: "4:15 PM", duration: "20s", bg: "from-[#281a0a] to-[#180d00]", color: "#FFB347" },
  { id: 5, type: "photo", by: "Morgan P.", date: "Jun 9", time: "3:22 PM", bg: "from-[#221628] to-[#140a1a]", color: "#F06EFF" },
  { id: 6, type: "photo", by: "Riley S.", date: "Jun 9", time: "11:05 AM", bg: "from-[#0a1c2a] to-[#061018]", color: "#5B8DEF" },
];

const grouped = items.reduce<Record<string, MediaItem[]>>((acc, item) => {
  const key = item.date;
  if (!acc[key]) acc[key] = [];
  acc[key].push(item);
  return acc;
}, {});

export function Album() {
  const [activeTab, setActiveTab] = useState("album");
  const [selected, setSelected] = useState<MediaItem | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-['Inter']">
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <span className="text-white text-sm font-medium">9:41</span>
        <div className="flex items-center gap-1 text-white/60 text-xs">●●●●</div>
      </div>

      {/* Header */}
      <div className="px-6 pt-2 pb-4">
        <h1 className="text-white text-2xl font-bold tracking-tight">Your Album</h1>
        <p className="text-[#8A8A9B] text-sm mt-0.5">{items.length} items · requested by you</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-6 mb-5 overflow-x-auto scrollbar-hide">
        {["All", "Photos", "Videos"].map((f, i) => (
          <button
            key={f}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
              i === 0
                ? "bg-[#5B8DEF] text-white border-[#5B8DEF]"
                : "bg-transparent text-[#8A8A9B] border-[#252535]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {Object.entries(grouped).map(([date, groupItems]) => (
          <div key={date} className="mb-6">
            <p className="text-[#8A8A9B] text-xs font-medium uppercase tracking-widest mb-3">{date}</p>
            <div className="grid grid-cols-2 gap-3">
              {groupItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="relative rounded-2xl overflow-hidden aspect-square border border-[#252535] active:scale-95 transition-transform"
                >
                  {/* Media preview */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.bg}`} />

                  {/* Simulated content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      style={{ background: item.color + "18", border: `1px solid ${item.color}30` }}
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                    >
                      {item.type === "photo" ? (
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                          <rect x="2" y="5" width="22" height="16" rx="3" stroke={item.color} strokeWidth="1.5" />
                          <circle cx="13" cy="13" r="4" stroke={item.color} strokeWidth="1.5" />
                          <circle cx="13" cy="13" r="1.5" fill={item.color} />
                        </svg>
                      ) : (
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                          <rect x="2" y="7" width="15" height="12" rx="2.5" stroke={item.color} strokeWidth="1.5" />
                          <path d="M17 11l7-3v10l-7-3V11z" stroke={item.color} strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Video duration badge */}
                  {item.type === "video" && item.duration && (
                    <div className="absolute top-2.5 left-2.5 bg-black/60 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                      <span className="text-white text-[10px] font-semibold">{item.duration}</span>
                    </div>
                  )}

                  {/* Photo badge */}
                  {item.type === "photo" && (
                    <div className="absolute top-2.5 left-2.5 bg-black/60 rounded-full px-2 py-0.5">
                      <span className="text-white text-[10px] font-semibold">Photo</span>
                    </div>
                  )}

                  {/* Attribution */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-2.5">
                    <p className="text-white text-[11px] font-semibold">By: {item.by}</p>
                    <p className="text-white/60 text-[10px]">{item.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected modal */}
      {selected && (
        <div className="absolute inset-0 bg-black/90 flex flex-col z-50">
          <div className="flex items-center justify-between px-6 pt-14 pb-4">
            <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M13 5L5 13M5 5l8 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">By: {selected.by}</p>
              <p className="text-white/50 text-xs">{selected.date} · {selected.time}</p>
            </div>
            <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3" r="1.5" fill="white" />
                <circle cx="8" cy="8" r="1.5" fill="white" />
                <circle cx="8" cy="13" r="1.5" fill="white" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center px-6">
            <div className={`w-full aspect-[3/4] rounded-3xl bg-gradient-to-br ${selected.bg} flex flex-col items-center justify-center border border-white/10`}>
              <div
                style={{ background: selected.color + "20", border: `1px solid ${selected.color}40` }}
                className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
              >
                {selected.type === "photo" ? (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="3" y="8" width="34" height="24" rx="4" stroke={selected.color} strokeWidth="2" />
                    <circle cx="20" cy="20" r="7" stroke={selected.color} strokeWidth="2" />
                    <circle cx="20" cy="20" r="2.5" fill={selected.color} />
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="3" y="10" width="22" height="18" rx="3.5" stroke={selected.color} strokeWidth="2" />
                    <path d="M25 17l12-5v16l-12-5V17z" stroke={selected.color} strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <p style={{ color: selected.color }} className="text-sm font-medium opacity-60">
                {selected.type === "photo" ? "Photo captured" : `Video · ${selected.duration}`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-12 pt-4">
            <button className="flex-1 py-3.5 rounded-2xl bg-[#141420] border border-[#252535] text-white font-medium text-sm flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v8M4 6l4-4 4 4M2 13h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Save
            </button>
            <button className="flex-1 py-3.5 rounded-2xl bg-[#141420] border border-[#252535] text-white font-medium text-sm flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 7l-4 2 4 2M10 9l4-2-4-2M9 4l-2 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Share
            </button>
            <button className="py-3.5 px-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 4h10M5 4V3h6v1M6 7v5M10 7v5M4 4l.7 9h6.6L12 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="absolute bottom-0 left-0 right-0 mx-4 mb-8 bg-[#141420] border border-[#252535] rounded-2xl px-2 py-3 flex items-center justify-around">
        {[
          { id: "home", label: "Home", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 10L11 3l8 7v9a1 1 0 01-1 1H14v-5H8v5H4a1 1 0 01-1-1v-9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg> },
          { id: "map", label: "Map", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="10" r="6" stroke="currentColor" strokeWidth="1.6" /><path d="M11 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="11" cy="10" r="2" stroke="currentColor" strokeWidth="1.6" /></svg> },
          { id: "album", label: "Album", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" /><rect x="6" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.4" /></svg> },
          { id: "profile", label: "Profile", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg> },
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
