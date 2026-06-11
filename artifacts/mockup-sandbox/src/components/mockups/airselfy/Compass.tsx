import { useState, useEffect } from "react";

export function Compass() {
  const [heading, setHeading] = useState(37);
  const [distance, setDistance] = useState(240);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeading(h => (h + (Math.random() - 0.3) * 8) % 360);
      setDistance(d => Math.max(0, d - Math.floor(Math.random() * 3)));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (distance <= 100) setArrived(true);
  }, [distance]);

  const arrowRotation = heading;

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center font-['Inter'] px-6">
      {/* Status bar */}
      <div className="w-full flex items-center justify-between pt-12 pb-4">
        <span className="text-white text-sm font-medium">9:41</span>
        <div className="flex items-center gap-1 text-white/60 text-xs">●●●●</div>
      </div>

      {/* Header */}
      <div className="w-full flex items-center gap-3 mb-8">
        <button className="w-9 h-9 rounded-xl bg-[#141420] border border-[#252535] flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14l-5-5 5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <p className="text-white font-semibold">Navigate to</p>
          <p className="text-[#8A8A9B] text-sm">Jordan M. · Photo request</p>
        </div>
      </div>

      {/* Compass circle */}
      <div className="relative w-72 h-72 flex items-center justify-center mb-8">
        {/* Outer ring */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 288 288">
          <circle cx="144" cy="144" r="136" stroke="#1E1E30" strokeWidth="2" fill="none" />
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            const isMajor = i % 9 === 0;
            const r1 = 128, r2 = isMajor ? 118 : 122;
            const x1 = 144 + r1 * Math.sin(angle);
            const y1 = 144 - r1 * Math.cos(angle);
            const x2 = 144 + r2 * Math.sin(angle);
            const y2 = 144 - r2 * Math.cos(angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isMajor ? "#5B8DEF" : "#252535"} strokeWidth={isMajor ? 2 : 1} />;
          })}
          {[{ label: "N", a: 0 }, { label: "E", a: 90 }, { label: "S", a: 180 }, { label: "W", a: 270 }].map(({ label, a }) => {
            const rad = (a * Math.PI) / 180;
            return (
              <text key={label} x={144 + 106 * Math.sin(rad)} y={144 - 106 * Math.cos(rad) + 5}
                textAnchor="middle" fill={label === "N" ? "#FF6B6B" : "#4A4A60"} fontSize="12" fontWeight="700" fontFamily="Inter">
                {label}
              </text>
            );
          })}
        </svg>

        <div className="absolute w-52 h-52 rounded-full bg-[#5B8DEF]/5 border border-[#5B8DEF]/15" />

        {/* Direction arrow */}
        <div
          className="absolute w-44 h-44 flex items-center justify-center transition-transform"
          style={{ transform: `rotate(${arrowRotation}deg)`, transitionDuration: "600ms" }}
        >
          <svg width="48" height="96" viewBox="0 0 48 96" fill="none" className="-mt-12">
            <path d="M24 4L40 52H24V52H8L24 4Z" fill="url(#arrowGrad)" />
            <path d="M24 92L8 52H24H40L24 92Z" fill="#252535" />
            <defs>
              <linearGradient id="arrowGrad" x1="24" y1="4" x2="24" y2="52" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#5B8DEF" />
                <stop offset="100%" stopColor="#A259FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute w-5 h-5 rounded-full bg-[#141420] border-2 border-[#5B8DEF] z-10" />

        {/* Camera-unlocked overlay */}
        {arrived && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(10,10,15,0.92)", transition: "opacity 0.4s" }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
              style={{ backgroundColor: "rgba(91,141,239,0.13)", border: "1.5px solid rgba(91,141,239,0.28)" }}>
              {/* Camera icon */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="3" y="9" width="26" height="17" rx="3" stroke="#5B8DEF" strokeWidth="2" />
                <circle cx="16" cy="17" r="5" stroke="#5B8DEF" strokeWidth="2" />
                <path d="M11 9V7a2 2 0 012-2h6a2 2 0 012 2v2" stroke="#5B8DEF" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-white font-bold text-lg">Camera Unlocked</p>
          </div>
        )}
      </div>

      {/* Distance */}
      <div className="flex flex-col items-center mb-6">
        <p className="text-white text-5xl font-bold tracking-tight">
          {distance}<span className="text-2xl text-[#8A8A9B] ml-1">m</span>
        </p>
        <p className="text-[#8A8A9B] text-sm mt-1">to Jordan M.</p>
      </div>

      {/* Status card */}
      <div className="w-full bg-[#141420] border border-[#252535] rounded-2xl px-5 py-4 flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(91,141,239,0.10)", border: "1px solid rgba(91,141,239,0.20)" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="6" width="16" height="10" rx="2" stroke="#5B8DEF" strokeWidth="1.5" />
            <circle cx="10" cy="11" r="2.5" stroke="#5B8DEF" strokeWidth="1.5" />
            <path d="M7 6V5a3 3 0 016 0v1" stroke="#5B8DEF" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">Photo Request</p>
          <p className={`text-xs transition-colors ${arrived ? "text-[#5B8DEF]" : "text-[#8A8A9B]"}`}>
            {arrived ? "In range · open camera below" : "Navigate to Jordan M.'s location"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-[#5B8DEF] rounded-full animate-pulse" />
          <span className="text-[#5B8DEF] text-xs font-medium">Live</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex w-full justify-between gap-3 mb-6">
        {[
          { label: "Heading", value: `${Math.round(heading)}°` },
          { label: "Bearing", value: "NE" },
          { label: "Distance", value: `${distance}m` },
        ].map(({ label, value }) => (
          <div key={label} className="flex-1 bg-[#141420] border border-[#252535] rounded-xl px-3 py-3 text-center">
            <p className="text-[#8A8A9B] text-xs mb-1">{label}</p>
            <p className="text-white font-bold text-base">{value}</p>
          </div>
        ))}
      </div>

      {/* Open Camera button — shown when within 100 m */}
      {arrived && (
        <div className="w-full px-0">
          <button
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-semibold text-white text-base"
            style={{ background: "linear-gradient(90deg, #5B8DEF 0%, #A259FF 100%)" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="5" width="16" height="11" rx="2" stroke="white" strokeWidth="1.6" />
              <circle cx="10" cy="10.5" r="2.5" stroke="white" strokeWidth="1.6" />
              <path d="M7 5V4a3 3 0 016 0v1" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Open Camera
          </button>
        </div>
      )}
    </div>
  );
}
