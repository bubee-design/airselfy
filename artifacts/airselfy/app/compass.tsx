import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
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
import { useSocket } from "@/context/SocketContext";

const BASE_LAT = 37.7749;
const BASE_LON = -122.4194;

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

function getDistanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Compute shortest rotation delta so we always spin the short way */
function shortestDelta(from: number, to: number): number {
  let delta = (to - (from % 360) + 360) % 360;
  if (delta > 180) delta -= 360;
  return delta;
}

export default function CompassScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    userId: string;
    userName: string;
    type: string;
    duration: string;
    targetLat: string;
    targetLon: string;
    requesterId: string;
    mode: string;
  }>();

  const { userName = "User", type = "photo", duration = "10" } = params;
  const targetLat = parseFloat(params.targetLat ?? String(BASE_LAT + 0.0012));
  const targetLon = parseFloat(params.targetLon ?? String(BASE_LON + 0.0008));
  const isRequester = params.mode === "requester";

  const { lastReceivedAt, requestDeclinedBy } = useSocket();
  // Snapshot values at mount — only react to changes that happen after
  const initialReceivedAtRef = useRef(lastReceivedAt);
  const initialDeclinedByRef = useRef(requestDeclinedBy);
  const [declinedBy, setDeclinedBy] = useState<string | null>(null);

  useEffect(() => {
    if (isRequester && lastReceivedAt !== null && lastReceivedAt !== initialReceivedAtRef.current) {
      router.replace("/(tabs)/album");
    }
  }, [lastReceivedAt]);

  useEffect(() => {
    if (isRequester && requestDeclinedBy !== null && requestDeclinedBy !== initialDeclinedByRef.current) {
      setDeclinedBy(requestDeclinedBy);
      const t = setTimeout(() => router.replace("/(tabs)"), 2500);
      return () => clearTimeout(t);
    }
  }, [requestDeclinedBy]);

  const initialDist = Math.round(getDistanceM(BASE_LAT, BASE_LON, targetLat, targetLon));

  const [distance, setDistance] = useState(initialDist || 280);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [targetBearing, setTargetBearing] = useState(
    getBearing(BASE_LAT, BASE_LON, targetLat, targetLon)
  );
  const [arrived, setArrived] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rawRotRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const arrivedAnim = useRef(new Animated.Value(0)).current;
  const ownPosRef = useRef({ lat: BASE_LAT, lon: BASE_LON });
  const arrivedRef = useRef(false);
  const headingSubRef = useRef<Location.LocationSubscription | null>(null);
  const posSubRef = useRef<Location.LocationSubscription | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function animateNeedle(toAngle: number) {
    const delta = shortestDelta(rawRotRef.current, toAngle);
    rawRotRef.current = rawRotRef.current + delta;
    Animated.timing(rotateAnim, {
      toValue: rawRotRef.current,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

  function markArrived() {
    if (arrivedRef.current) return;
    arrivedRef.current = true;
    setArrived(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(arrivedAnim, { toValue: 1, useNativeDriver: true }).start();
  }

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    if (Platform.OS === "web") {
      // Web: simulate heading drift, use real bearing math from base position
      const bearing = getBearing(BASE_LAT, BASE_LON, targetLat, targetLon);
      let simHeading = Math.random() * 360;
      let simDist = initialDist || 280;

      const headingInterval = setInterval(() => {
        simHeading = (simHeading + (Math.random() - 0.3) * 15 + 360) % 360;
        setDeviceHeading(Math.round(simHeading));
        setTargetBearing(bearing);
        const needle = (bearing - simHeading + 360) % 360;
        animateNeedle(needle);
      }, 600);

      const distInterval = setInterval(() => {
        simDist = Math.max(0, simDist - Math.floor(Math.random() * 8 + 2));
        setDistance(simDist);
        if (simDist <= 100) markArrived();
      }, 800);

      return () => {
        clearInterval(headingInterval);
        clearInterval(distInterval);
      };
    }

    // Native: real GPS heading + position
    async function startNative() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      // Snapshot initial position
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = loc.coords;
        ownPosRef.current = { lat: latitude, lon: longitude };
        const dist = Math.round(getDistanceM(latitude, longitude, targetLat, targetLon));
        const bearing = getBearing(latitude, longitude, targetLat, targetLon);
        setDistance(dist);
        setTargetBearing(bearing);
        if (dist <= 100) markArrived();
      } catch {}

      // Watch heading (fast, ~5Hz)
      headingSubRef.current = await Location.watchHeadingAsync((h) => {
        const dh = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
        setDeviceHeading(Math.round(dh));

        const bearing = getBearing(
          ownPosRef.current.lat,
          ownPosRef.current.lon,
          targetLat,
          targetLon
        );
        setTargetBearing(bearing);
        const needle = (bearing - dh + 360) % 360;
        animateNeedle(needle);
      });

      // Watch position (slower, for distance updates)
      posSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 3 },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          ownPosRef.current = { lat: latitude, lon: longitude };
          const dist = Math.round(getDistanceM(latitude, longitude, targetLat, targetLon));
          setDistance(dist);
          if (dist <= 100) markArrived();
        }
      );
    }

    startNative();

    return () => {
      headingSubRef.current?.remove();
      posSubRef.current?.remove();
    };
  }, []);

  const compassRotate = rotateAnim.interpolate({
    inputRange: [-3600, 3600],
    outputRange: ["-3600deg", "3600deg"],
  });

  function handleContinue() {
    router.replace({
      pathname: "/camera",
      params: {
        type,
        duration,
        byName: userName,
        requesterId: params.requesterId ?? "",
      },
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

          {/* Arrow — rotates to point at target */}
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

        {/* In-range overlay */}
        {arrived && (
          <Animated.View
            style={[
              styles.arrivedOverlay,
              { backgroundColor: colors.background + "F0", opacity: arrivedAnim },
            ]}
          >
            <View
              style={[
                styles.arrivedIconWrap,
                {
                  backgroundColor: (isRequester ? colors.accent : colors.primary) + "22",
                  borderColor: (isRequester ? colors.accent : colors.primary) + "44",
                },
              ]}
            >
              <Feather
                name={isRequester ? "user-check" : (type === "photo" ? "camera" : "video")}
                size={36}
                color={isRequester ? colors.accent : colors.primary}
              />
            </View>
            <Text style={[styles.arrivedText, { color: colors.foreground }]}>
              {isRequester ? "In Position" : "Camera Unlocked"}
            </Text>
            {isRequester && (
              <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2, fontFamily: "Inter_400Regular" }}>
                Waiting for capture…
              </Text>
            )}
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
          <Text style={[styles.statusSub, { color: arrived ? (isRequester ? colors.accent : colors.primary) : colors.mutedForeground }]}>
            {arrived
              ? (isRequester ? "In range · waiting for capture" : "In range · open camera below")
              : `Navigate to ${userName}'s location`}
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
          { label: "Heading", value: `${deviceHeading}°` },
          { label: "Bearing", value: `${Math.round(targetBearing)}°` },
          { label: "Distance", value: `${distance}m` },
        ].map(({ label, value }) => (
          <View key={label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Continue button (fulfiller only — opens camera) */}
      {arrived && !isRequester && (
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

      {/* Declined overlay (requester only) */}
      {declinedBy && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.background + "F4",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              paddingHorizontal: 40,
            },
          ]}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#FF4D4D18",
              borderWidth: 1,
              borderColor: "#FF4D4D44",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="x" size={38} color="#FF4D4D" />
          </View>
          <Text style={[styles.arrivedText, { color: colors.foreground }]}>Request Declined</Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 14,
              textAlign: "center",
              fontFamily: "Inter_400Regular",
              lineHeight: 20,
            }}
          >
            {declinedBy.split(" ")[0]} isn't available right now.{"\n"}Returning to map…
          </Text>
        </View>
      )}
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
    ...StyleSheet.absoluteFill,
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
