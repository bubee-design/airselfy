import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { type Transaction, type TransactionType, useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(
  txs: Transaction[]
): Array<{ date: string; items: Transaction[] }> {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const label = formatDate(tx.date);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(tx);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

const TX_META: Record<
  TransactionType,
  { bg: string; icon: keyof typeof Feather.glyphMap; color: string; sign: string }
> = {
  topup:    { bg: "#DCFCE7", icon: "arrow-up-circle",  color: "#16A34A", sign: "+" },
  earn:     { bg: "#DBEAFE", icon: "check-circle",     color: "#2563EB", sign: "+" },
  spend:    { bg: "#FEE2E2", icon: "minus-circle",     color: "#DC2626", sign: "-" },
  withdraw: { bg: "#FEF3C7", icon: "arrow-down-circle", color: "#D97706", sign: "-" },
};

function TxRow({ tx }: { tx: Transaction }) {
  const colors = useColors();
  const meta = TX_META[tx.type];
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: meta.bg }]}>
        <Feather name={meta.icon} size={18} color={meta.color} />
      </View>
      <View style={styles.txInfo}>
        <Text style={[styles.txLabel, { color: colors.foreground }]} numberOfLines={1}>
          {tx.label}
        </Text>
        <Text style={[styles.txTime, { color: colors.mutedForeground }]}>
          {formatTime(tx.date)}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: meta.color }]}>
        {meta.sign}{usd(tx.amount)}
      </Text>
    </View>
  );
}

// ── Top-up sheet ──────────────────────────────────────────────────────────────

const TOP_UP_OPTIONS = [
  { cents: 2000,  label: "$20" },
  { cents: 5000,  label: "$50" },
  { cents: 10000, label: "$100" },
];

function TopUpSheet({
  onConfirm,
  onClose,
  bottomInset,
}: {
  onConfirm: (cents: number) => Promise<void>;
  onClose: () => void;
  bottomInset: number;
}) {
  const colors = useColors();
  const [selected, setSelected] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const slideAnim = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, []);

  async function handleConfirm() {
    if (!selected || paying) return;
    setPaying(true);
    try {
      await onConfirm(selected);
    } finally {
      setPaying(false);
    }
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={paying ? undefined : onClose} />
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.background, transform: [{ translateY: slideAnim }], paddingBottom: 24 + bottomInset },
        ]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: colors.muted }]} />
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add Balance</Text>
        <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
          Choose an amount to top up your spending balance
        </Text>

        <View style={styles.optionsRow}>
          {TOP_UP_OPTIONS.map((opt) => (
            <Pressable
              key={opt.cents}
              style={[
                styles.option,
                {
                  borderColor: selected === opt.cents ? colors.primary : colors.border,
                  backgroundColor:
                    selected === opt.cents ? colors.primary + "14" : colors.card,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelected(opt.cents);
              }}
            >
              <Text
                style={[
                  styles.optionMain,
                  { color: selected === opt.cents ? colors.primary : colors.foreground },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleConfirm}
          disabled={!selected || paying}
          style={({ pressed }) => [
            styles.confirmBtn,
            {
              backgroundColor: selected ? colors.primary : colors.muted,
              opacity: pressed || paying ? 0.85 : 1,
            },
          ]}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmText}>
              {selected ? `Pay ${usd(selected)} with Card` : "Select an amount"}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Withdraw sheet ────────────────────────────────────────────────────────────

function WithdrawSheet({
  earningsCents,
  onConfirm,
  onClose,
  bottomInset,
}: {
  earningsCents: number;
  onConfirm: (cents: number) => void;
  onClose: () => void;
  bottomInset: number;
}) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, []);

  function handleAll() {
    if (earningsCents <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(earningsCents);
    onClose();
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.background, transform: [{ translateY: slideAnim }], paddingBottom: 24 + bottomInset },
        ]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: colors.muted }]} />
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Withdraw Earnings</Text>
        <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
          Transfer your fulfillment earnings to your bank account
        </Text>

        <View style={[styles.earningsPreview, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.earningsPreviewLabel, { color: colors.mutedForeground }]}>
            Available to withdraw
          </Text>
          <Text style={[styles.earningsPreviewAmt, { color: colors.foreground }]}>
            {usd(earningsCents)}
          </Text>
        </View>

        <Pressable
          onPress={handleAll}
          disabled={earningsCents <= 0}
          style={({ pressed }) => [
            styles.confirmBtn,
            {
              backgroundColor: earningsCents > 0 ? "#16A34A" : colors.muted,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={styles.confirmText}>
            {earningsCents > 0 ? `Withdraw ${usd(earningsCents)}` : "Nothing to withdraw"}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { balanceCents, earningsCents, transactions, topUpWithStripe, withdrawEarnings } =
    useWallet();

  const [sheet, setSheet] = useState<"topup" | "withdraw" | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : 100;
  const grouped = groupByDate(transactions);

  async function handleTopUp(cents: number) {
    const result = await topUpWithStripe(cents, "Balance Top-Up");
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSheet(null);
    } else if (result.error && result.error !== "canceled") {
      Alert.alert("Payment failed", result.error);
    } else {
      // User canceled — keep sheet open or close silently
      setSheet(null);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Wallet</Text>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{user?.initials ?? "??"}</Text>
          </LinearGradient>
        </View>

        {/* Balance card */}
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          {/* Spending balance */}
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>Spending Balance</Text>
            <Text style={styles.balanceAmt}>{usd(balanceCents)}</Text>
          </View>

          {/* Earnings tile */}
          <View style={styles.earningsTile}>
            <View>
              <Text style={styles.earningsLabel}>Your Earnings</Text>
              <Text style={styles.earningsAmt}>{usd(earningsCents)}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.withdrawBtn, { opacity: pressed ? 0.75 : 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSheet("withdraw");
              }}
            >
              <Feather name="arrow-down-circle" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            </Pressable>
          </View>

          {/* Add balance bar */}
          <Pressable
            style={({ pressed }) => [styles.addBar, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSheet("topup");
            }}
          >
            <View style={styles.addBarLeft}>
              <Feather name="plus-circle" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.addBarText}>Add Balance</Text>
            </View>
            <View style={styles.pillsRow}>
              {TOP_UP_OPTIONS.map((o) => (
                <View key={o.cents} style={styles.pill}>
                  <Text style={styles.pillText}>{o.label}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        </LinearGradient>

        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.secondary }]}>
          <View style={[styles.infoIcon, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="info" size={15} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>
              How it works
            </Text>
            <Text style={[styles.infoBody, { color: colors.mutedForeground }]}>
              Request photo: $1.00 · Request video: $2.00{"\n"}
              Fulfil photo: earn $0.80 · Fulfil video: earn $1.60
            </Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Transactions
          </Text>

          {transactions.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No transactions yet
              </Text>
            </View>
          ) : (
            grouped.map(({ date, items }) => (
              <View key={date} style={{ marginBottom: 20 }}>
                <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
                  {date}
                </Text>
                <View
                  style={[
                    styles.txGroup,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  {items.map((tx, i) => (
                    <View key={tx.id}>
                      {i > 0 && (
                        <View
                          style={[styles.txDivider, { backgroundColor: colors.border }]}
                        />
                      )}
                      <TxRow tx={tx} />
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {sheet === "topup" && (
        <TopUpSheet
          onConfirm={handleTopUp}
          onClose={() => setSheet(null)}
          bottomInset={insets.bottom}
        />
      )}
      {sheet === "withdraw" && (
        <WithdrawSheet
          earningsCents={earningsCents}
          onConfirm={(cents) => withdrawEarnings(cents, "Withdrawal")}
          onClose={() => setSheet(null)}
          bottomInset={insets.bottom}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Balance card
  balanceCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 14,
  },
  balanceTop: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 16 },
  balanceLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  balanceAmt: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1.5,
  },

  earningsTile: {
    marginHorizontal: 22,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  earningsLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 3,
  },
  earningsAmt: { color: "#fff", fontSize: 22, fontWeight: "700" },
  withdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  withdrawBtnText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
    fontWeight: "600",
  },

  addBar: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addBarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  addBarText: { color: "rgba(255,255,255,0.95)", fontSize: 14, fontWeight: "600" },
  pillsRow: { flexDirection: "row", gap: 6 },
  pill: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // Info
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 22,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoTitle: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  infoBody: { fontSize: 12, lineHeight: 18 },

  // Transactions
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12, letterSpacing: -0.3 },
  dateLabel: { fontSize: 12, fontWeight: "600", marginBottom: 8, marginLeft: 2 },
  txGroup: { borderRadius: 18, overflow: "hidden", borderWidth: 1 },
  txDivider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  txInfo: { flex: 1, minWidth: 0 },
  txLabel: { fontSize: 14, fontWeight: "500", marginBottom: 2 },
  txTime: { fontSize: 12 },
  txAmount: { fontSize: 15, fontWeight: "700" },

  empty: { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500" },

  // Sheets
  overlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    zIndex: 100,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: "700", marginBottom: 6, letterSpacing: -0.4 },
  sheetSub: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  optionsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  option: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  optionMain: { fontSize: 18, fontWeight: "700" },
  confirmBtn: { borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  earningsPreview: {
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
  },
  earningsPreviewLabel: { fontSize: 13, marginBottom: 6 },
  earningsPreviewAmt: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
});
