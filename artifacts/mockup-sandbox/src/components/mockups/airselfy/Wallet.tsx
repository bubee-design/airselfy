export function Wallet() {
  const primary = "#4A7DE2";
  const accent = "#7C3AED";

  const transactions = [
    { id: 1, type: "earn", description: "Photo Fulfilled · Alex M.", amount: 8, date: "Today", time: "2:34 PM" },
    { id: 2, type: "spend", description: "Photo Requested · Jamie R.", amount: -10, date: "Today", time: "11:12 AM" },
    { id: 3, type: "earn", description: "Video Fulfilled · Sam K.", amount: 16, date: "Yesterday", time: "5:48 PM" },
    { id: 4, type: "topup", description: "Credits Added", amount: 50, date: "Yesterday", time: "9:20 AM" },
    { id: 5, type: "spend", description: "Video Requested · Chris L.", amount: -20, date: "Jun 24", time: "3:15 PM" },
    { id: 6, type: "earn", description: "Photo Fulfilled · Morgan T.", amount: 8, date: "Jun 24", time: "1:30 PM" },
    { id: 7, type: "spend", description: "Photo Requested · Taylor B.", amount: -10, date: "Jun 23", time: "7:05 PM" },
    { id: 8, type: "earn", description: "Photo Fulfilled · Jordan P.", amount: 8, date: "Jun 23", time: "4:22 PM" },
  ];

  const grouped = transactions.reduce<Record<string, typeof transactions>>((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {});

  const balance = 124;
  const totalEarned = 560;
  const totalSpent = 436;

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Status bar */}
      <div className="h-12 flex items-center justify-between px-6 pt-3">
        <span className="text-sm font-semibold text-gray-900">9:41</span>
        <div className="flex items-center gap-1">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><rect x="0" y="3" width="3" height="9" rx="1" fill="#0F0F1A"/><rect x="4.5" y="2" width="3" height="10" rx="1" fill="#0F0F1A"/><rect x="9" y="0" width="3" height="12" rx="1" fill="#0F0F1A"/><rect x="13.5" y="0" width="3" height="12" rx="1" fill="#0F0F1A" opacity="0.3"/></svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M8 2.4C10.5 2.4 12.7 3.5 14.2 5.2L15.5 3.8C13.6 1.8 11 0.6 8 0.6C5 0.6 2.4 1.8 0.5 3.8L1.8 5.2C3.3 3.5 5.5 2.4 8 2.4Z" fill="#0F0F1A"/><path d="M8 5.6C9.8 5.6 11.4 6.4 12.5 7.6L13.8 6.2C12.3 4.7 10.3 3.8 8 3.8C5.7 3.8 3.7 4.7 2.2 6.2L3.5 7.6C4.6 6.4 6.2 5.6 8 5.6Z" fill="#0F0F1A"/><circle cx="8" cy="10" r="2" fill="#0F0F1A"/></svg>
          <div className="flex items-center gap-0.5">
            <div className="w-6 h-3 border border-gray-900 rounded-sm flex items-center px-0.5">
              <div className="h-2 rounded-xs bg-gray-900" style={{ width: "75%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <h1 className="text-2xl font-bold" style={{ color: "#0F0F1A" }}>Wallet</h1>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
        >
          AJ
        </div>
      </div>

      {/* Balance card */}
      <div className="mx-4 rounded-3xl overflow-hidden mb-4" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)` }}>
        <div className="p-6">
          <p className="text-white/70 text-sm font-medium mb-1">Available Credits</p>
          <div className="flex items-end gap-2 mb-5">
            <span className="text-5xl font-bold text-white">{balance}</span>
            <span className="text-white/80 text-lg mb-1.5">credits</span>
          </div>
          {/* Stats row */}
          <div className="flex gap-3">
            <div className="flex-1 bg-white/15 rounded-2xl p-3">
              <p className="text-white/70 text-xs mb-0.5">Total Earned</p>
              <p className="text-white font-semibold text-base">+{totalEarned}</p>
            </div>
            <div className="flex-1 bg-white/15 rounded-2xl p-3">
              <p className="text-white/70 text-xs mb-0.5">Total Spent</p>
              <p className="text-white font-semibold text-base">-{totalSpent}</p>
            </div>
          </div>
        </div>
        {/* Add credits button */}
        <div className="bg-white/10 px-6 py-3.5 flex items-center justify-between">
          <span className="text-white font-semibold text-sm">Add Credits</span>
          <div className="flex gap-2">
            {[50, 100, 200].map((amt) => (
              <div key={amt} className="bg-white/20 rounded-full px-3 py-1">
                <span className="text-white text-xs font-semibold">{amt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Credit cost info */}
      <div className="mx-4 mb-4 rounded-2xl p-3.5 flex items-start gap-3" style={{ backgroundColor: "#EEF0F8" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}20` }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: "#0F0F1A" }}>How credits work</p>
          <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>Request photo: 10 cr · Request video: 20 cr · Fulfil photo: earn 8 cr · Fulfil video: earn 16 cr</p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="px-4">
        <h2 className="text-base font-semibold mb-3" style={{ color: "#0F0F1A" }}>Transactions</h2>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-4">
            <p className="text-xs font-medium mb-2" style={{ color: "#6B7280" }}>{date}</p>
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#F5F5FA" }}>
              {items.map((tx, i) => {
                const isEarn = tx.type === "earn";
                const isTopup = tx.type === "topup";
                const iconColor = isEarn || isTopup ? "#16A34A" : "#DC2626";
                const amtColor = isEarn || isTopup ? "#16A34A" : "#DC2626";
                const bgColor = isEarn || isTopup ? "#DCFCE7" : "#FEE2E2";
                const icon = isTopup
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 5 5 12"/></svg>
                  : isEarn
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>;
                return (
                  <div key={tx.id}>
                    {i > 0 && <div className="mx-4" style={{ height: 1, backgroundColor: "#E2E4EC" }} />}
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bgColor }}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#0F0F1A" }}>{tx.description}</p>
                        <p className="text-xs" style={{ color: "#6B7280" }}>{tx.time}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: amtColor }}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom padding for tab bar */}
      <div className="h-28" />
    </div>
  );
}
