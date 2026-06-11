import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const topPad = Platform.OS === "web" ? 20 : insets.top;

  function openLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLogoutModal(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }

  function closeLogout() {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() =>
      setShowLogoutModal(false)
    );
  }

  async function confirmLogout() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    setShowLogoutModal(false);
  }

  const stats = [
    { label: "Photos", value: "0", icon: "camera" as const, color: colors.primary },
    { label: "Videos", value: "0", icon: "video" as const, color: colors.accent },
    { label: "Requests", value: "0", icon: "send" as const, color: "#4ade80" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Avatar card */}
      <View style={styles.avatarSection}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarCircle}
        >
          <Text style={styles.avatarText}>{user?.initials ?? "??"}</Text>
        </LinearGradient>
        <View style={styles.onlineDot} />
        <Text style={[styles.profileName, { color: colors.foreground }]}>
          {user?.name ?? "—"}
        </Text>
        <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>
          {user?.email ?? "—"}
        </Text>
      </View>

      {/* Stats row */}
      <View style={[styles.statsRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
        {stats.map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: s.color + "18" }]}>
                <Feather name={s.icon} size={14} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Info card */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: colors.primary + "18" }]}>
            <Feather name="user" size={15} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Full Name</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.name ?? "—"}</Text>
          </View>
        </View>
        <View style={[styles.infoSep, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: colors.accent + "18" }]}>
            <Feather name="mail" size={15} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Email</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.email ?? "—"}</Text>
          </View>
        </View>
        <View style={[styles.infoSep, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: "#4ade8018" }]}>
            <Feather name="shield" size={15} color="#4ade80" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Account Status</Text>
            <Text style={[styles.infoValue, { color: "#4ade80" }]}>Active</Text>
          </View>
        </View>
      </View>

      {/* Log out button */}
      <Pressable
        onPress={openLogout}
        style={({ pressed }) => [
          styles.logoutBtn,
          { backgroundColor: "#ff4d4d12", borderColor: "#ff4d4d40", opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <Feather name="log-out" size={18} color="#ff4d4d" />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <Modal transparent animationType="none" visible onRequestClose={closeLogout}>
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeLogout} />
            <Animated.View
              style={[
                styles.modalCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                {
                  transform: [
                    {
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.92, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Icon */}
              <View style={[styles.modalIcon, { backgroundColor: "#ff4d4d15" }]}>
                <Feather name="log-out" size={26} color="#ff4d4d" />
              </View>

              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Log Out?</Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
                You'll need to sign back in to access your account.
              </Text>

              {/* Actions */}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={closeLogout}
                  style={({ pressed }) => [
                    styles.modalCancelBtn,
                    { backgroundColor: colors.muted, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.modalCancelText, { color: colors.foreground }]}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={confirmLogout}
                  disabled={loggingOut}
                  style={({ pressed }) => [
                    styles.modalConfirmBtn,
                    { backgroundColor: "#ff4d4d", opacity: pressed || loggingOut ? 0.7 : 1 },
                  ]}
                >
                  <Feather name={loggingOut ? "loader" : "log-out"} size={15} color="#fff" />
                  <Text style={styles.modalConfirmText}>
                    {loggingOut ? "Signing out…" : "Yes, log out"}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
        </Modal>
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
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  avatarSection: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 28,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  onlineDot: {
    position: "absolute",
    top: 20 + 64,
    right: "50%",
    marginRight: -52,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4ade80",
    borderWidth: 2.5,
    borderColor: "#0A0A0F",
  },
  profileName: { marginTop: 14, fontSize: 22, fontWeight: "700" as const, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  profileEmail: { marginTop: 4, fontSize: 14, fontFamily: "Inter_400Regular" },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  statDivider: { width: 1, marginVertical: 4 },
  statItem: { flex: 1, alignItems: "center", gap: 6 },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 18, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  infoRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  infoSep: { height: 1, marginHorizontal: 14 },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "500" as const, fontFamily: "Inter_500Medium" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 15,
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", color: "#ff4d4d" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  modalActions: { flexDirection: "row", gap: 10, width: "100%", marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  modalConfirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  modalConfirmText: { color: "#fff", fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
});
