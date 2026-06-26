const primary = "#4A7DE2";
const accent = "#7C3AED";

type TxType = "topup" | "earn" | "spend" | "withdraw";

const TX_META: Record<TxType, { bg: string; color: string; sign: string; icon: string }> = {
  topup:    { bg: "#DCFCE7", color: "#16A34A", sign: "+", icon: "↑" },
  earn:     { bg: "#DBEAFE", color: "#2563EB", sign: "+", icon: "✓" },
  spend:    { bg: "#FEE2E2", color: "#DC2626", sign: "-", icon: "−" },
  withdraw: { bg: "#FEF3C7", color: "#D97706", sign: "-", icon: "↓" },
};

const transactions: { id: number; type: TxType; label: string; amount: number; time: string; date: string }[] = [
  { id: 1, type: "earn",     label: "Photo Fulfilled · Alex M.",    amount: 80,   time: "2:34 PM",  date: "Today" },
  { id: 2, type: "spend",    label: "Photo Requested · Jamie R.",   amount: 100,  time: "11:12 AM", date: "Today" },
  { id: 3, type: "earn",     label: "Video Fulfilled · Sam K.",     amount: 160,  time: "5:48 PM",  date: "Yesterday" },
  { id: 4, type: "topup",    label: "Balance Top-Up",               amount: 500,  time: "9:20 AM",  date: "Yesterday" },
  { id: 5, type: "spend",    label: "Video Requested · Chris L.",   amount: 200,  time: "3:15 PM",  date: "Jun 24" },
  { id: 6, type: "withdraw", label: "Withdrawal",                   amount: 240,  time: "1:00 PM",  date: "Jun 24" },
];

const grouped = transactions.reduce<Record<string, typeof transactions>>((acc, t) => {
  if (!acc[t.date]) acc[t.date] = [];
  acc[t.date].push(t);
  return acc;
}, {});

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const balanceCents = 500;
const earningsCents = 240;

export function Wallet() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Status bar */}
      <div className="h-12 flex items-center justify-between px-6 pt-3">
        <span className="text-sm font-semibold text-gray-900">9:41</span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-end gap-px h-3">
            {[4, 6, 8, 10].map((h, i) => (
              <div key={i} className="w-1 rounded-sm bg-gray-900" style={{ height: h, opacity: i < 3 ? 1 : 0.3 }} />
            ))}
          </div>
          <div className="w-6 h-3 border border-gray-900 rounded-sm flex items-center px-0.5">
            <div className="h-2 rounded-xs bg-gray-900" style={{ width: "75%" }} />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-2 pb-4">
        <h1 className="text-2xl font-bold" style={{ color: "#0F0F1A" }}>Wallet</h1>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
          AJ
        </div>
      </div>

      {/* Balance card */}
      <div className="mx-4 rounded-3xl overflow-hidden mb-3.5"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)` }}>

        {/* Spending balance */}
        <div className="px-6 pt-5 pb-4">
          <p className="text-white/70 text-xs font-medium mb-1">Spending Balance</p>
          <p className="text-white font-extrabold" style={{ fontSize: 46, letterSpacing: -1.5, lineHeight: 1 }}>
            {usd(balanceCents)}
          </p>
        </div>

        {/* Earnings tile */}
        <div className="mx-5 mb-4 rounded-[18px] px-4 py-3.5 flex items-center justify-between"
          style={{ background: "rgba(255,255,255,0.18)" }}>
          <div>
            <p className="text-white/72 text-xs font-medium mb-1">Your Earnings</p>
            <p className="text-white font-bold text-xl">{usd(earningsCents)}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-3.5 py-2"
            style={{ background: "rgba(255,255,255,0.22)" }}>
            <span className="text-white/90 text-sm">↓</span>
            <span className="text-white/95 text-xs font-semibold">Withdraw</span>
          </div>
        </div>

        {/* Add balance bar */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ background: "rgba(255,255,255,0.12)" }}>
          <div className="flex items-center gap-2">
            <span className="text-white/90 text-base">⊕</span>
            <span className="text-white/95 text-sm font-semibold">Add Balance</span>
          </div>
          <div className="flex gap-1.5">
            {["$20", "$50", "$100"].map((a) => (
              <div key={a} className="rounded-full px-2.5 py-1" style={{ background: "rgba(255,255,255,0.22)" }}>
                <span className="text-white text-xs font-semibold">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="mx-4 mb-5 rounded-2xl p-3.5 flex items-start gap-3" style={{ backgroundColor: "#EEF0F8" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${primary}20` }}>
          <span style={{ color: primary, fontSize: 14 }}>ℹ</span>
        </div>
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: "#0F0F1A" }}>How it works</p>
          <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
            Request photo: $1.00 · Request video: $2.00<br />
            Fulfil photo: earn $0.80 · Fulfil video: earn $1.60
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4">
        <h2 className="text-base font-bold mb-3" style={{ color: "#0F0F1A", letterSpacing: -0.3 }}>Transactions</h2>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-5">
            <p className="text-xs font-semibold mb-2 ml-0.5" style={{ color: "#6B7280" }}>{date}</p>
            <div className="rounded-[18px] overflow-hidden border" style={{ backgroundColor: "#F5F5FA", borderColor: "#E2E4EC" }}>
              {items.map((tx, i) => {
                const meta = TX_META[tx.type];
                return (
                  <div key={tx.id}>
                    {i > 0 && <div className="ml-14" style={{ height: 1, backgroundColor: "#E2E4EC" }} />}
                    <div className="flex items-center gap-3 px-3.5 py-3.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ backgroundColor: meta.bg, color: meta.color }}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#0F0F1A" }}>{tx.label}</p>
                        <p className="text-xs" style={{ color: "#6B7280" }}>{tx.time}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: meta.color }}>
                        {meta.sign}{usd(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="h-28" />
    </div>
  );
}
