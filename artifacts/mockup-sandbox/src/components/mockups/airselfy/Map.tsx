import { useState } from "react";

type Balloon = { id: number; name: string; initials: string; x: number; y: number; color: string; dist: string };

const balloons: Balloon[] = [
  { id: 1, name: "Sam K.", initials: "SK", x: 42, y: 30, color: "#FF6B6B", dist: "120m" },
  { id: 2, name: "Jordan M.", initials: "JM", x: 68, y: 55, color: "#FFB347", dist: "240m" },
  { id: 3, name: "Taylor R.", initials: "TR", x: 22, y: 62, color: "#4ADEAD", dist: "380m" },
  { id: 4, name: "Morgan P.", initials: "MP", x: 78, y: 22, color: "#F06EFF", dist: "410m" },
  { id: 5, name: "Riley S.", initials: "RS", x: 55, y: 78, color: "#5B8DEF", dist: "470m" },
];

function BalloonMarker({ b, selected, onTap }: { b: Balloon; selected: boolean; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      style={{ left: `${b.x}%`, top: `${b.y}%` }}
      className="absolute -translate-x-1/2 -translate-y-full transition-transform active:scale-95"
    >
      <div className={`relative flex flex-col items-center ${selected ? "scale-110" : ""} transition-transform`}>
        {/* Balloon body */}
        <div
          style={{ background: b.color, boxShadow: selected ? `0 0 16px ${b.color}80` : "none" }}
          className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/20"
        >
          <span className="text-white text-xs font-bold">{b.initials}</span>
        </div>
        {/* Balloon string */}
        <div style={{ background: b.color }} className="w-0.5 h-3 opacity-60" />
        <div style={{ background: b.color }} className="w-1.5 h-1.5 rounded-full opacity-40" />
      </div>
    </button>
  );
}

export function Map() {
  const [selected, setSelected] = useState<Balloon | null>(null);
  const [mediaChoice, setMediaChoice] = useState<"photo" | "video" | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  const handleTap = (b: Balloon) => {
    setSelected(b);
    setMediaChoice(null);
    setDuration(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-['Inter'] overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-12 pb-3 z-10 relative">
        <span className="text-white text-sm font-medium">9:41</span>
        <div className="flex items-center gap-1">
          <span className="text-white text-xs">●●●●</span>
          <span className="text-white/60 text-xs ml-1">●</span>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 pb-3 flex items-center justify-between z-10 relative">
        <div>
          <h1 className="text-white text-xl font-bold">Nearby</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[#8A8A9B] text-xs">Live · updates every 15s</span>
          </div>
        </div>
        <div className="bg-[#141420] border border-[#252535] rounded-xl px-3 py-2 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5" stroke="#5B8DEF" strokeWidth="1.4" strokeDasharray="2 1.5" />
            <circle cx="7" cy="7" r="2" fill="#5B8DEF" />
          </svg>
          <span className="text-white text-xs font-medium">500m</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 mx-4 mb-4 rounded-2xl overflow-hidden relative border border-[#252535]" style={{ minHeight: 420 }}>
        {/* Map background — simulated street grid */}
        <div className="absolute inset-0 bg-[#141420]">
          {/* Grid lines simulating streets */}
          <svg width="100%" height="100%" className="absolute inset-0 opacity-30">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#252535" strokeWidth="1" />
              </pattern>
              <pattern id="bigGrid" width="120" height="120" patternUnits="userSpaceOnUse">
                <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#2E2E45" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#bigGrid)" />
          </svg>

          {/* Street highlights */}
          <div className="absolute top-1/3 left-0 right-0 h-8 bg-[#1A1A2E]/80" />
          <div className="absolute top-2/3 left-0 right-0 h-5 bg-[#1A1A2E]/60" />
          <div className="absolute left-1/4 top-0 bottom-0 w-5 bg-[#1A1A2E]/60" />
          <div className="absolute left-2/3 top-0 bottom-0 w-8 bg-[#1A1A2E]/80" />

          {/* Radius circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border border-[#5B8DEF]/20 bg-[#5B8DEF]/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-[#5B8DEF]/15 bg-[#5B8DEF]/3" />
        </div>

        {/* Balloons */}
        {balloons.map(b => (
          <BalloonMarker key={b.id} b={b} selected={selected?.id === b.id} onTap={() => handleTap(b)} />
        ))}

        {/* You marker */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-4 h-4 rounded-full bg-[#5B8DEF] border-2 border-white shadow-lg shadow-[#5B8DEF]/50 relative">
            <div className="absolute inset-0 rounded-full bg-[#5B8DEF] animate-ping opacity-40" />
          </div>
        </div>

        {/* Compass */}
        <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#0A0A0F]/80 border border-[#252535] flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="8" stroke="#252535" strokeWidth="1" />
            <path d="M9 2l1.5 5H7.5L9 2z" fill="#FF6B6B" />
            <path d="M9 16l-1.5-5h3L9 16z" fill="#4A4A60" />
          </svg>
        </div>

        {/* Location lock */}
        <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-[#0A0A0F]/80 border border-[#252535] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" stroke="#5B8DEF" strokeWidth="1.5" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="#5B8DEF" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Bottom sheet — balloon tapped */}
      {selected && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#0F0F1A] border-t border-[#252535] rounded-t-3xl px-6 pt-4 pb-8">
          {/* Handle */}
          <div className="w-10 h-1 bg-[#252535] rounded-full mx-auto mb-4" />

          <div className="flex items-center gap-3 mb-5">
            <div style={{ background: selected.color + "20", border: `1px solid ${selected.color}40` }} className="w-12 h-12 rounded-full flex items-center justify-center">
              <span style={{ color: selected.color }} className="text-sm font-bold">{selected.initials}</span>
            </div>
            <div>
              <p className="text-white font-semibold">{selected.name}</p>
              <p className="text-[#8A8A9B] text-sm">{selected.dist} away</p>
            </div>
          </div>

          {!mediaChoice ? (
            <>
              <p className="text-[#8A8A9B] text-xs uppercase tracking-widest mb-3">Request from {selected.name.split(" ")[0]}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setMediaChoice("photo")}
                  className="flex-1 py-3.5 rounded-xl bg-[#5B8DEF]/10 border border-[#5B8DEF]/20 text-[#5B8DEF] font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="#5B8DEF" strokeWidth="1.4" />
                    <circle cx="8" cy="8" r="2.5" stroke="#5B8DEF" strokeWidth="1.4" />
                  </svg>
                  Photo
                </button>
                <button
                  onClick={() => setMediaChoice("video")}
                  className="flex-1 py-3.5 rounded-xl bg-[#A259FF]/10 border border-[#A259FF]/20 text-[#A259FF] font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="4" width="9" height="8" rx="1.5" stroke="#A259FF" strokeWidth="1.4" />
                    <path d="M10 7l5-2v6l-5-2V7z" stroke="#A259FF" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                  Video
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setMediaChoice(null)} className="text-[#8A8A9B]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <p className="text-white font-semibold">{mediaChoice === "photo" ? "Photo" : "Video"} request</p>
              </div>
              <p className="text-[#8A8A9B] text-xs uppercase tracking-widest mb-3">Duration</p>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    style={duration === d ? { background: mediaChoice === "photo" ? "#5B8DEF" : "#A259FF" } : {}}
                    className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${
                      duration === d
                        ? "border-transparent text-white"
                        : "border-[#252535] text-[#8A8A9B] bg-[#141420]"
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
              {duration && (
                <button
                  style={{ background: mediaChoice === "photo" ? "linear-gradient(135deg,#5B8DEF,#A259FF)" : "linear-gradient(135deg,#A259FF,#FF6B6B)" }}
                  className="w-full mt-4 py-4 rounded-2xl text-white font-semibold text-base shadow-lg"
                >
                  Send Request
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
