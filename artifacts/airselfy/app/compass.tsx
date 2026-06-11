import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function CompassScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    userId: string;
    userName: string;
    type: string;
    duration: string;
  }>();

  const { userName = "User", type = "photo", duration = "10" } = params;

  const [distance, setDistance] = useState(280);
  const [heading, setHeading] = useState(45);
  const [arrived, setArrived] = useState(false);
  const rotateAnim = useRef(new Animated.Value(45)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const arrivedAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Use native magnetometer on mobile, simulate on web
  useEffect(() => {
    let sub: { remove: () => void } | null = null;

    async function startCompass() {
      if (Platform.OS !== "web") {
        try {
          const { Magnetometer } = await import("expo-sensors");
          Magnetometer.setUpdateInterval(200);
          sub = Magnetometer.addListener(({ x, y }) => {
            let angle = Math.atan2(y, x) * (180 / Math.PI);
            if (angle < 0) angle += 360;
            setHeading(Math.round(angle));
            Animated.timing(rotateAnim, {
              toValue: angle,
              duration: 300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }).start();
          });
        } catch {}
      } else {
        // Simulate heading change on web
        let angle = 45;
        const interval = setInterval(() => {
          angle = (angle + (Math.random() - 0.3) * 15 + 360) % 360;
          setHeading(Math.round(angle));
          Animated.timing(rotateAnim, {
            toValue: angle,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start();
        }, 600);
        return () => clearInterval(interval);
      }
    }

    const cleanup = startCompass();

    // Simulate distance closing in
    const distInterval = setInterval(() => {
      setDistance((d) => {
        const next = Math.max(0, d - Math.floor(Math.random() * 8 + 2));
        if (next <= 10 && !arrived) {
          setArrived(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.spring(arrivedAnim, { toValue: 1, useNativeDriver: true }).start();
        }
        return next;
      });
    }, 800);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      sub?.remove();
      clearInterval(distInterval);
      cleanup?.then?.((fn) => fn?.());
    };
  }, []);

  const compassRotate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  function handleContinue() {
    router.replace({
      pathname: "/camera",
      params: { type, duration, byName: userName },
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Back button */}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.topTitle, { color: colors.foreground }]}>Navigate to</Text>
          <Text style={[styles.topSub, { color: colors.mutedForeground }]}>
            {userName} · {type} request
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Compass */}
      <View style={styles.compassWrap}>
        {/* Outer ring */}
        <View style={[styles.outerRing, { borderColor: colors.border }]}>
          {/* Cardinal labels */}
          {["N", "E", "S", "W"].map((label, i) => {
            const angle = i * 90;
            const rad = (angle * Math.PI) / 180;
            const r = 128;
            return (
              <View
                key={label}
                style={{
                  position: "absolute",
                  left: 140 + r * Math.sin(rad) - 10,
                  top: 140 - r * Math.cos(rad) - 10,
                  width: 20,
                  height: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={[styles.cardinal, { color: label === "N" ? colors.destructive : colors.muted }]}>
                  {label}
                </Text>
              </View>
            );
          })}

          {/* Glow circle */}
          <Animated.View style={[styles.glowCircle, { borderColor: colors.primary + "30", transform: [{ scale: pulseAnim }] }]} />

          {/* Arrow */}
          <Animated.View style={[styles.arrowWrap, { transform: [{ rotate: compassRotate }] }]}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              style={styles.arrowNorth}
            />
            <View style={[styles.arrowSouth, { backgroundColor: colors.muted }]} />
          </Animated.View>

          {/* Center dot */}
          <View style={[styles.centerDot, { backgroundColor: colors.card, borderColor: colors.primary }]} />
        </View>

        {/* Arrived overlay */}
        {arrived && (
          <Animated.View
            style={[
              styles.arrivedOverlay,
              { backgroundColor: colors.background + "F0", opacity: arrivedAnim },
            ]}
          >
            <View style={[styles.arrivedIconWrap, { backgroundColor: "#4ade8020", borderColor: "#4ade8040" }]}>
              <Feather name="check" size={36} color="#4ade80" />
            </View>
            <Text style={[styles.arrivedText, { color: colors.foreground }]}>Arrived!</Text>
          </Animated.View>
        )}
      </View>

      {/* Distance */}
      <View style={styles.distanceWrap}>
        <Text style={[styles.distanceNum, { color: colors.foreground }]}>
          {distance}
          <Text style={[styles.distanceUnit, { color: colors.mutedForeground }]}>m</Text>
        </Text>
        <Text style={[styles.distanceTo, { color: colors.mutedForeground }]}>to {userName}</Text>
      </View>

      {/* Status card */}
      <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.statusIcon, { backgroundColor: (type === "photo" ? colors.primary : colors.accent) + "18" }]}>
          <Feather name={type === "photo" ? "camera" : "video"} size={18} color={type === "photo" ? colors.primary : colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>
            {type === "photo" ? "Photo" : `Video · ${duration}s`} Request
          </Text>
          <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
            Navigate to {userName}'s location
          </Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={[styles.liveText, { color: colors.primary }]}>Live</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: "Heading", value: `${heading}°` },
          { label: "Bearing", value: heading < 45 || heading > 315 ? "N" : heading < 135 ? "E" : heading < 225 ? "S" : "W" },
          { label: "Distance", value: `${distance}m` },
        ].map(({ label, value }) => (
          <View key={label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Continue button (shows when arrived) */}
      {arrived && (
        <Pressable onPress={handleContinue} style={{ paddingHorizontal: 20 }}>
          <LinearGradient
            colors={type === "photo" ? [colors.primary, colors.accent] : [colors.accent, "#FF6B6B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueBtn}
          >
            <Feather name={type === "photo" ? "camera" : "video"} size={18} color="#fff" />
            <Text style={styles.continueBtnText}>
              Open {type === "photo" ? "Camera" : "Video"}
            </Text>
          </LinearGradient>
        </Pressable>
      )}

      <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  topSub: { fontSize: 12, marginTop: 2, fontFamily: "Inter_400Regular" },
  compassWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  outerRing: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  glowCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
  },
  arrowWrap: {
    position: "absolute",
    alignItems: "center",
    height: 160,
  },
  arrowNorth: {
    width: 18,
    height: 72,
    borderRadius: 9,
  },
  arrowSouth: {
    width: 12,
    height: 60,
    borderRadius: 6,
    marginTop: 4,
    opacity: 0.5,
  },
  centerDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  cardinal: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  arrivedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  arrivedIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  arrivedText: {
    fontSize: 22,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  distanceWrap: { alignItems: "center", marginBottom: 20 },
  distanceNum: {
    fontSize: 56,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
    lineHeight: 60,
  },
  distanceUnit: { fontSize: 24, fontWeight: "400" as const },
  distanceTo: { fontSize: 14, marginTop: 4, fontFamily: "Inter_400Regular" },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  statusSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ade80" },
  liveText: { fontSize: 12, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
