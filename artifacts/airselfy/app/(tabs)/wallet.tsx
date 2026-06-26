import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useWallet, type WalletTransaction } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(txs: WalletTransaction[]): Array<{ date: string; items: WalletTransaction[] }> {
  const map = new Map<string, WalletTransaction[]>();
  for (const tx of txs) {
    const label = formatDate(tx.createdAt);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(tx);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

function TransactionIcon({ type, amount }: { type: string; amount: number }) {
  const colors = useColors();
  const isPositive = amount > 0;
  const isTopup = type === "topup";

  const bgColor = isPositive ? "#DCFCE7" : "#FEE2E2";
  const iconColor = isPositive ? "#16A34A" : "#DC2626";
  const iconName: keyof typeof Feather.glyphMap = isTopup
    ? "arrow-up-circle"
    : isPositive
    ? "check-circle"
    : "minus-circle";

  return (
    <View style={[styles.txIcon, { backgroundColor: bgColor }]}>
      <Feather name={iconName} size={18} color={iconColor} />
    </View>
  );
}

function TopUpSheet({
  onTopUp,
  onClose,
}: {
  onTopUp: (amount: number) => Promise<void>;
  onClose: () => void;
}) {
  const colors = useColors();
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }, []);

  const options = [
    { amount: 50, label: "50 Credits", price: "$0.99" },
    { amount: 100, label: "100 Credits", price: "$1.99" },
    { amount: 200, label: "200 Credits", price: "$3.49" },
  ];

  async function handleConfirm() {
    if (!selected || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await onTopUp(selected);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.background, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: colors.muted }]} />
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add Credits</Text>
        <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
          Choose how many credits to add
        </Text>
        <View style={styles.optionsRow}>
          {options.map((opt) => (
            <Pressable
              key={opt.amount}
              style={[
                styles.option,
                {
                  borderColor: selected === opt.amount ? colors.primary : colors.border,
                  backgroundColor: selected === opt.amount ? colors.primary + "12" : colors.card,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelected(opt.amount);
              }}
            >
              <Text style={[styles.optionCredits, { color: selected === opt.amount ? colors.primary : colors.foreground }]}>
                {opt.label}
              </Text>
              <Text style={[styles.optionPrice, { color: colors.mutedForeground }]}>{opt.price}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={handleConfirm}
          disabled={!selected || loading}
          style={({ pressed }) => [
            styles.confirmBtn,
            {
              backgroundColor: !selected ? colors.muted : colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>
              {selected ? `Add ${selected} Credits` : "Select an option"}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { balance, totalEarned, totalSpent, transactions, loading, topUp, refresh } = useWallet();
  const [showTopUp, setShowTopUp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : 100;

  const grouped = groupByDate(transactions);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
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
          <Text style={styles.balanceLabel}>Available Credits</Text>
          <View style={styles.balanceRow}>
            {loading && !balance ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Text style={styles.balanceAmount}>{balance}</Text>
                <Text style={styles.balanceUnit}>credits</Text>
              </>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Earned</Text>
              <Text style={styles.statValue}>+{totalEarned}</Text>
            </View>
            <View style={[styles.statBox, { marginLeft: 10 }]}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>-{totalSpent}</Text>
            </View>
          </View>

          {/* Add credits bar */}
          <Pressable
            style={({ pressed }) => [styles.addBar, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowTopUp(true);
            }}
          >
            <View style={styles.addBarLeft}>
              <Feather name="plus-circle" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.addBarText}>Add Credits</Text>
            </View>
            <View style={styles.pillsRow}>
              {[50, 100, 200].map((a) => (
                <View key={a} style={styles.pill}>
                  <Text style={styles.pillText}>{a}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        </LinearGradient>

        {/* How credits work */}
        <View style={[styles.infoCard, { backgroundColor: colors.secondary }]}>
          <View style={[styles.infoIcon, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="info" size={15} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>How credits work</Text>
            <Text style={[styles.infoBody, { color: colors.mutedForeground }]}>
              Request photo: 10 cr · Request video: 20 cr{"\n"}
              Fulfil photo: earn 8 cr · Fulfil video: earn 16 cr
            </Text>
          </View>
        </View>

        {/* Transaction history */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transactions</Text>
          {loading && transactions.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
          ) : transactions.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No transactions yet
              </Text>
            </View>
          ) : (
            grouped.map(({ date, items }) => (
              <View key={date} style={{ marginBottom: 20 }}>
                <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>{date}</Text>
                <View style={[styles.txGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {items.map((tx, i) => (
                    <View key={tx.id}>
                      {i > 0 && <View style={[styles.txDivider, { backgroundColor: colors.border }]} />}
                      <View style={styles.txRow}>
                        <TransactionIcon type={tx.type} amount={tx.amount} />
                        <View style={styles.txInfo}>
                          <Text style={[styles.txDesc, { color: colors.foreground }]} numberOfLines={1}>
                            {tx.description}
                          </Text>
                          <Text style={[styles.txTime, { color: colors.mutedForeground }]}>
                            {formatTime(tx.createdAt)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.txAmount,
                            { color: tx.amount > 0 ? "#16A34A" : "#DC2626" },
                          ]}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {showTopUp && (
        <TopUpSheet onTopUp={topUp} onClose={() => setShowTopUp(false)} />
      )}
    </View>
  );
}

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
  balanceLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 22,
    marginHorizontal: 22,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginHorizontal: 22,
    marginTop: 4,
    marginBottom: 16,
    gap: 6,
  },
  balanceAmount: { color: "#fff", fontSize: 52, fontWeight: "800", letterSpacing: -2 },
  balanceUnit: { color: "rgba(255,255,255,0.8)", fontSize: 18, marginBottom: 8 },
  statsRow: { flexDirection: "row", marginHorizontal: 22, marginBottom: 16, gap: 0 },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 16,
    padding: 12,
  },
  statLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "500", marginBottom: 2 },
  statValue: { color: "#fff", fontSize: 17, fontWeight: "700" },
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

  // Info card
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
  txDesc: { fontSize: 14, fontWeight: "500", marginBottom: 2 },
  txTime: { fontSize: 12 },
  txAmount: { fontSize: 15, fontWeight: "700" },

  // Empty state
  empty: { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500" },

  // Top-up sheet
  sheetOverlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    zIndex: 100,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: "700", marginBottom: 6, letterSpacing: -0.4 },
  sheetSubtitle: { fontSize: 14, marginBottom: 20 },
  optionsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  option: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  optionCredits: { fontSize: 13, fontWeight: "700" },
  optionPrice: { fontSize: 12 },
  confirmBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
