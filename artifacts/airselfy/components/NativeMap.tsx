import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NearbyUser, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function NativeMap() {
  const colors = useColors();
  const { nearbyUsers } = useApp();
  const [selected, setSelected] = useState<NearbyUser | null>(null);
  const [mediaType, setMediaType] = useState<"photo" | "video" | null>(null);
  const [duration, setDuration] = useState<number>(10);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  function openSheet(user: NearbyUser) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(user);
    setMediaType(null);
    setDuration(10);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }

  function closeSheet() {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSelected(null);
      setMediaType(null);
    });
  }

  function handleSendRequest() {
    if (!selected || !mediaType) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeSheet();
    router.push({
      pathname: "/compass",
      params: { userId: selected.id, userName: selected.name, type: mediaType, duration: String(duration) },
    });
  }

  const sheetTranslateY = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {nearbyUsers.map((u) => (
          <Pressable
            key={u.id}
            onPress={() => openSheet(u)}
            style={({ pressed }) => [styles.userCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient colors={[u.color + "10", "transparent"]} style={StyleSheet.absoluteFillObject} />
            <View style={[styles.avatar, { backgroundColor: u.color + "20", borderColor: u.color + "50" }]}>
              <Text style={[styles.avatarText, { color: u.color }]}>{u.initials}</Text>
            </View>
            <Text style={[styles.userName, { color: colors.foreground }]}>{u.name}</Text>
            <View style={styles.distRow}>
              <Feather name="navigation" size={10} color={colors.mutedForeground} />
              <Text style={[styles.distText, { color: colors.mutedForeground }]}>{u.distanceM}m</Text>
            </View>
            <View style={styles.actionRow}>
              <View style={[styles.actionIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="camera" size={12} color={colors.primary} />
              </View>
              <View style={[styles.actionIcon, { backgroundColor: colors.accent + "15" }]}>
                <Feather name="video" size={12} color={colors.accent} />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {selected && (
        <>
          <Pressable style={styles.overlay} onPress={closeSheet} />
          <Animated.View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateY: sheetTranslateY }] }]}>
            <View style={[styles.handle, { backgroundColor: colors.muted }]} />
            <View style={styles.userRow}>
              <View style={[styles.sheetAvatar, { backgroundColor: selected.color + "25", borderColor: selected.color + "50" }]}>
                <Text style={[styles.sheetAvatarText, { color: selected.color }]}>{selected.initials}</Text>
              </View>
              <View>
                <Text style={[styles.sheetUserName, { color: colors.foreground }]}>{selected.name}</Text>
                <Text style={[styles.sheetDist, { color: colors.mutedForeground }]}>{selected.distanceM}m away</Text>
              </View>
            </View>

            {!mediaType ? (
              <>
                <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>
                  REQUEST FROM {selected.name.split(" ")[0].toUpperCase()}
                </Text>
                <View style={styles.mediaRow}>
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMediaType("photo"); }} style={[styles.mediaBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
                    <Feather name="camera" size={20} color={colors.primary} />
                    <Text style={[styles.mediaBtnText, { color: colors.primary }]}>Photo</Text>
                  </Pressable>
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMediaType("video"); }} style={[styles.mediaBtn, { backgroundColor: colors.accent + "18", borderColor: colors.accent + "40" }]}>
                    <Feather name="video" size={20} color={colors.accent} />
                    <Text style={[styles.mediaBtnText, { color: colors.accent }]}>Video</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.backRow}>
                  <Pressable onPress={() => setMediaType(null)}>
                    <Feather name="arrow-left" size={20} color={colors.foreground} />
                  </Pressable>
                  <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                    {mediaType === "photo" ? "Photo" : "Video"} Duration
                  </Text>
                </View>
                <View style={styles.durationRow}>
                  {[5, 10, 20, 30].map((d) => (
                    <Pressable key={d} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDuration(d); }} style={[styles.durationBtn, { backgroundColor: duration === d ? (mediaType === "photo" ? colors.primary : colors.accent) : colors.muted, borderColor: duration === d ? (mediaType === "photo" ? colors.primary : colors.accent) : colors.border }]}>
                      <Text style={[styles.durationText, { color: duration === d ? "#fff" : colors.mutedForeground }]}>{d}s</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={handleSendRequest}>
                  <LinearGradient colors={mediaType === "photo" ? [colors.primary, colors.accent] : [colors.accent, "#FF6B6B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendBtn}>
                    <Feather name="send" size={16} color="#fff" />
                    <Text style={styles.sendBtnText}>Send Request</Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  userCard: { width: "47%", borderRadius: 18, borderWidth: 1, padding: 16, alignItems: "center", gap: 8, overflow: "hidden" },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  avatarText: { fontWeight: "700" as const, fontSize: 16 },
  userName: { fontSize: 14, fontWeight: "600" as const, textAlign: "center" },
  distRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  distText: { fontSize: 12 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 16 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sheetAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  sheetAvatarText: { fontWeight: "700" as const, fontSize: 14 },
  sheetUserName: { fontSize: 16, fontWeight: "600" as const },
  sheetDist: { fontSize: 13, marginTop: 2 },
  sheetLabel: { fontSize: 11, letterSpacing: 1.2, fontWeight: "600" as const },
  mediaRow: { flexDirection: "row", gap: 12 },
  mediaBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, borderWidth: 1 },
  mediaBtnText: { fontSize: 15, fontWeight: "600" as const },
  backRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sheetTitle: { fontSize: 16, fontWeight: "600" as const },
  durationRow: { flexDirection: "row", gap: 8 },
  durationBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  durationText: { fontSize: 14, fontWeight: "600" as const },
  sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16 },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" as const },
});
