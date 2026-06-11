import { useState } from "react";

export function Camera() {
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [duration, setDuration] = useState(10);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [captured, setCaptured] = useState(false);

  const handleCapture = () => {
    if (mode === "photo") {
      setCaptured(true);
      setTimeout(() => setCaptured(false), 500);
    } else {
      if (!recording) {
        setRecording(true);
        setElapsed(0);
        const interval = setInterval(() => {
          setElapsed(e => {
            if (e + 1 >= duration) {
              clearInterval(interval);
              setRecording(false);
              setCaptured(true);
              setTimeout(() => setCaptured(false), 600);
              return 0;
            }
            return e + 1;
          });
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-['Inter'] relative overflow-hidden">
      {/* Camera viewfinder */}
      <div className="flex-1 relative">
        {/* Simulated camera feed */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d1f33] to-[#1a0a28]">
          {/* Scene elements */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0A1420]/80 to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-32 h-48 bg-[#1a2a3a]/60 rounded-lg" style={{ transform: "perspective(400px) rotateY(-15deg)" }} />
          <div className="absolute top-1/3 right-1/5 w-20 h-36 bg-[#151f2a]/80 rounded" style={{ transform: "perspective(300px) rotateY(10deg)" }} />
          <div className="absolute top-1/2 left-1/2 w-48 h-1 bg-[#252535] opacity-30 -translate-x-1/2" />
          {/* Subject blur circles */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white/5 blur-xl" />
        </div>

        {/* Flash overlay */}
        {captured && <div className="absolute inset-0 bg-white animate-ping z-50 opacity-80" style={{ animationDuration: "0.1s" }} />}

        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 390 500">
          <line x1="130" y1="0" x2="130" y2="500" stroke="white" strokeWidth="0.5" />
          <line x1="260" y1="0" x2="260" y2="500" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="166" x2="390" y2="166" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="333" x2="390" y2="333" stroke="white" strokeWidth="0.5" />
        </svg>

        {/* Focus bracket */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20">
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#5B8DEF]" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#5B8DEF]" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#5B8DEF]" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#5B8DEF]" />
        </div>

        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-14 pb-4 bg-gradient-to-b from-black/60 to-transparent">
          <button className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14l-5-5 5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Request info badge */}
          <div className="bg-black/50 rounded-full px-3 py-1.5 flex items-center gap-2">
            <div style={{ background: "#FFB347" }} className="w-2 h-2 rounded-full" />
            <span className="text-white text-xs font-medium">From Jordan M.</span>
          </div>

          {/* Flash */}
          <button className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M10 2L5 10h5l-2 6 8-9h-5l2-5z" stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Recording indicator */}
        {recording && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-full px-4 py-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-semibold tabular-nums">{elapsed}s / {duration}s</span>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-black px-6 pt-5 pb-10">
        {/* Mode switcher — only show the appropriate mode */}
        <div className="flex items-center justify-center mb-5">
          <div className="bg-[#141414] rounded-full p-1 flex">
            {["photo", "video"].map(m => (
              <button
                key={m}
                onClick={() => setMode(m as "photo" | "video")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  mode === m ? "bg-white text-black" : "text-white/50"
                }`}
              >
                {m === "photo" ? "Photo" : "Video"}
              </button>
            ))}
          </div>
        </div>

        {/* Duration selector (video only) */}
        {mode === "video" && (
          <div className="flex justify-center gap-2 mb-5">
            {[5, 10, 20, 30].map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`w-12 h-8 rounded-full text-xs font-semibold transition-all ${
                  duration === d
                    ? "bg-[#A259FF] text-white"
                    : "bg-[#141414] text-white/50 border border-white/10"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        )}

        {/* Capture row */}
        <div className="flex items-center justify-between">
          {/* Last capture thumbnail */}
          <div className="w-12 h-12 rounded-xl border-2 border-white/20 bg-[#141414] overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-[#1a2a3a] to-[#0a1020]" />
          </div>

          {/* Shutter button */}
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full flex items-center justify-center relative"
          >
            <div className={`absolute inset-0 rounded-full border-4 ${mode === "video" ? "border-[#A259FF]" : "border-white"}`} />
            {mode === "photo" ? (
              <div className="w-14 h-14 rounded-full bg-white" />
            ) : (
              <div className={`rounded-full transition-all ${recording ? "w-8 h-8 rounded-xl bg-red-500" : "w-14 h-14 bg-red-500"}`} />
            )}
          </button>

          {/* Flip camera */}
          <button className="w-12 h-12 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 7a7 7 0 0114 0v1" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M18 15a7 7 0 01-14 0v-1" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M16 5l2 2-2 2M6 17l-2-2 2-2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
