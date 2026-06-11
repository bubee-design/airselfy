import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { albumItems } = useApp();
  const { nearbyUsers } = useSocket();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : 100;

  function handleRequest(type: "photo" | "video") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(tabs)/map");
  }

  const recentItems = albumItems.slice(0, 3);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Good day
          </Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {user?.name?.split(" ")[0] ?? "There"}
          </Text>
        </View>
        {/* Avatar */}
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/profile"); }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{user?.initials ?? "??"}</Text>
          </LinearGradient>
          <View style={styles.onlineDot} />
        </Pressable>
      </View>

      {/* Nearby count card */}
      <View style={[styles.nearbyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.nearbyIconWrap, { backgroundColor: colors.primary + "18" }]}>
          <Feather name="radio" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.nearbyCount, { color: colors.foreground }]}>
            {nearbyUsers.length} people nearby
          </Text>
          <Text style={[styles.nearbySubtext, { color: colors.mutedForeground }]}>
            within 500m · updates every 15s
          </Text>
        </View>
        <View style={styles.avatarRow}>
          {nearbyUsers.slice(0, 3).map((u) => (
            <View
              key={u.id}
              style={[styles.miniAvatar, { backgroundColor: u.color, borderColor: colors.card }]}
            >
              <Text style={styles.miniAvatarText}>{u.initials[0]}</Text>
            </View>
          ))}
          {nearbyUsers.length > 3 && (
            <View style={[styles.miniAvatar, { backgroundColor: colors.muted, borderColor: colors.card }]}>
              <Text style={[styles.miniAvatarText, { color: colors.mutedForeground }]}>
                +{nearbyUsers.length - 3}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Request section */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        REQUEST FROM NEARBY
      </Text>
      <View style={styles.requestRow}>
        {/* Photo button */}
        <Pressable
          style={({ pressed }) => [styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => handleRequest("photo")}
        >
          <LinearGradient
            colors={[colors.primary + "30", colors.primary + "08"]}
            style={[styles.requestIconWrap, { borderColor: colors.primary + "30" }]}
          >
            <Feather name="camera" size={26} color={colors.primary} />
          </LinearGradient>
          <Text style={[styles.requestTitle, { color: colors.foreground }]}>Photo</Text>
          <Text style={[styles.requestSubtitle, { color: colors.mutedForeground }]}>
            Request a shot
          </Text>
        </Pressable>

        {/* Video button */}
        <Pressable
          style={({ pressed }) => [styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => handleRequest("video")}
        >
          <LinearGradient
            colors={[colors.accent + "30", colors.accent + "08"]}
            style={[styles.requestIconWrap, { borderColor: colors.accent + "30" }]}
          >
            <Feather name="video" size={26} color={colors.accent} />
          </LinearGradient>
          <Text style={[styles.requestTitle, { color: colors.foreground }]}>Video</Text>
          <Text style={[styles.requestSubtitle, { color: colors.mutedForeground }]}>
            Request a clip
          </Text>
        </Pressable>
      </View>

      {/* Recent album */}
      {recentItems.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 24 }]}>
            RECENT CAPTURES
          </Text>
          <View style={styles.recentList}>
            {recentItems.map((item) => {
              const date = new Date(item.createdAt);
              const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              return (
                <View key={item.id} style={[styles.recentItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.recentIcon, { backgroundColor: (item.type === "photo" ? colors.primary : colors.accent) + "18" }]}>
                    <Feather name={item.type === "photo" ? "camera" : "video"} size={16} color={item.type === "photo" ? colors.primary : colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recentName, { color: colors.foreground }]}>
                      {item.type === "photo" ? "Photo" : `Video · ${item.duration ?? ""}s`}
                    </Text>
                    <Text style={[styles.recentBy, { color: colors.mutedForeground }]}>
                      By: {item.byName} · {timeStr}
                    </Text>
                  </View>
                  <View style={[styles.completedDot, { backgroundColor: "#4ade80" + "20" }]}>
                    <Feather name="check" size={12} color="#4ade80" />
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {recentItems.length === 0 && (
        <View style={[styles.emptyWrap]}>
          <Feather name="camera" size={32} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No captures yet. Tap Photo or Video to get started.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontWeight: "700" as const, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700" as const, fontSize: 14, fontFamily: "Inter_700Bold" },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4ade80",
    borderWidth: 2,
    borderColor: "#0A0A0F",
  },
  nearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  nearbyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nearbyCount: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  nearbySubtext: { fontSize: 12, marginTop: 2, fontFamily: "Inter_400Regular" },
  avatarRow: { flexDirection: "row" },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -6,
    borderWidth: 2,
  },
  miniAvatarText: { color: "#fff", fontSize: 9, fontWeight: "700" as const },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  requestRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  requestCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  requestIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  requestTitle: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  requestSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  recentList: { paddingHorizontal: 20, gap: 8 },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  recentName: { fontSize: 14, fontWeight: "500" as const, fontFamily: "Inter_500Medium" },
  recentBy: { fontSize: 12, marginTop: 2, fontFamily: "Inter_400Regular" },
  completedDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
