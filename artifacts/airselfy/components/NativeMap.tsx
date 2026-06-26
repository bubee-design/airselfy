import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import L from "leaflet";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { NearbyUser, useSocket } from "@/context/SocketContext";
import { useColors } from "@/hooks/useColors";

const DEFAULT_LAT = 37.7749;
const DEFAULT_LNG = -122.4194;
const PHOTO_COST = 100;
const VIDEO_COST = 200;

function makeBalloonHtml(color: string, initials: string, isYou: boolean) {
  const size = isYou ? 50 : 44;
  const border = isYou ? "2.5px solid #fff" : "2px solid rgba(255,255,255,0.4)";
  const shadow = isYou ? "0 2px 10px rgba(0,0,0,0.35)" : "0 2px 8px rgba(0,0,0,0.28)";
  const fontSize = isYou ? 14 : 12;
  const youLabel = isYou
    ? `<div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.93);border-radius:5px;padding:1px 5px;font-size:9px;font-weight:700;color:${color};white-space:nowrap;letter-spacing:0.4px;">You</div>`
    : "";
  return `<div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:none;">
    ${youLabel}
    <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-weight:700;color:#fff;font-size:${fontSize}px;">${initials}</div>
    <div style="width:2px;height:10px;background:${color};opacity:0.7;"></div>
    <div style="width:6px;height:6px;border-radius:50%;background:${color};opacity:0.5;"></div>
  </div>`;
}

function makeIcon(color: string, initials: string, isYou: boolean) {
  const size = isYou ? 50 : 44;
  return L.divIcon({
    html: makeBalloonHtml(color, initials, isYou),
    className: "",
    iconSize: [size, size + 18],
    iconAnchor: [size / 2, size + 18],
  });
}

export default function NativeMap() {
  const colors = useColors();
  const { nearbyUsers, sendRequest } = useSocket();
  const { user } = useAuth();
  const { deductCents } = useWallet();
  const isStudent = user?.userType === "student";
  const { height: screenHeight } = useWindowDimensions();

  const [selected, setSelected] = useState<NearbyUser | null>(null);
  const [mediaType, setMediaType] = useState<"photo" | "video" | null>(null);
  const [duration, setDuration] = useState<number>(10);
  const [userLat, setUserLat] = useState<number>(DEFAULT_LAT);
  const [userLng, setUserLng] = useState<number>(DEFAULT_LNG);

  const mapContainerRef = useRef<View>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const youMarkerRef = useRef<LeafletMarker | null>(null);
  const nearbyMarkersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // Inject Leaflet CSS once
  useEffect(() => {
    if (typeof document !== "undefined" && !document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // Init map
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = mapContainerRef.current as unknown as HTMLElement;
    if (!el) return;

    const waitForSize = setInterval(() => {
      if (el.offsetHeight > 0) {
        clearInterval(waitForSize);

        const map = L.map(el, { zoomControl: false, attributionControl: false });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
        map.setView([DEFAULT_LAT, DEFAULT_LNG], 16);
        mapRef.current = map;
      }
    }, 50);

    return () => {
      clearInterval(waitForSize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Get user location and pan map
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
      if (status !== "granted") return;
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        mapRef.current?.setView([lat, lng], 16, { animate: true });
      } catch {
        // keep default
      }
    });
  }, []);

  // Update "You" marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !user) return;
    const icon = makeIcon(colors.primary, user.initials ?? "ME", true);
    if (youMarkerRef.current) {
      youMarkerRef.current.setLatLng([userLat, userLng]).setIcon(icon);
    } else {
      youMarkerRef.current = L.marker([userLat, userLng], { icon, zIndexOffset: 100 }).addTo(map);
    }
  }, [userLat, userLng, user?.initials, colors.primary]);

  // Sync nearby user markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(nearbyUsers.map((u) => u.id));

    // Remove stale markers
    nearbyMarkersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        nearbyMarkersRef.current.delete(id);
      }
    });

    // Add/update markers
    nearbyUsers.forEach((u) => {
      const icon = makeIcon(u.color, u.initials, false);
      const existing = nearbyMarkersRef.current.get(u.id);
      if (existing) {
        existing.setLatLng([u.lat, u.lon]).setIcon(icon);
      } else {
        const marker = L.marker([u.lat, u.lon], { icon })
          .addTo(map)
          .on("click", () => openSheet(u));
        nearbyMarkersRef.current.set(u.id, marker);
      }
    });
  }, [nearbyUsers]);

  function openSheet(u: NearbyUser) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(u);
    setMediaType(null);
    setDuration(10);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  }

  function closeSheet() {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
      setSelected(null);
      setMediaType(null);
    });
  }

  function handleSendRequest(type: "photo" | "video", dur?: number) {
    if (!selected) return;
    const target = selected;

    if (!isStudent) {
      const costCents = type === "photo" ? PHOTO_COST : VIDEO_COST;
      const ok = deductCents(costCents, type === "photo" ? "Photo Request" : "Video Request");
      if (!ok) {
        alert(`Insufficient balance to send a ${type} request ($${(costCents / 100).toFixed(2)}).`);
        return;
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sendRequest(target.id, type, dur ?? duration);
    closeSheet();
    router.push({
      pathname: "/compass",
      params: {
        userId: target.id,
        userName: target.name,
        type,
        duration: String(dur ?? duration),
        targetLat: String(target.lat),
        targetLon: String(target.lon),
        mode: "requester",
      },
    });
  }

  const sheetTranslateY = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });

  return (
    <View style={{ flex: 1 }}>
      {/* Leaflet map container — View ref gives us the underlying DOM div */}
      <View
        ref={mapContainerRef}
        style={{ width: "100%", height: screenHeight - 84 }}
      />

      {/* Live header overlay */}
      <View style={styles.headerOverlay}>
        <View
          style={[
            styles.headerCard,
            { backgroundColor: colors.background + "E8", borderColor: colors.border },
          ]}
        >
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={[styles.liveText, { color: colors.mutedForeground }]}>
              Live · {nearbyUsers.length} nearby
            </Text>
          </View>
        </View>
      </View>

      {/* Request sheet */}
      {selected && (
        <>
          <Pressable style={styles.overlay} onPress={closeSheet} />
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.muted }]} />
            <View style={styles.userRow}>
              <View
                style={[
                  styles.userAvatar,
                  {
                    backgroundColor: selected.color + "25",
                    borderColor: selected.color + "50",
                  },
                ]}
              >
                <Text style={[styles.userAvatarText, { color: selected.color }]}>
                  {selected.initials}
                </Text>
              </View>
              <View>
                <Text style={[styles.userName, { color: colors.foreground }]}>
                  {selected.name}
                </Text>
                <Text style={[styles.userDist, { color: colors.mutedForeground }]}>
                  {selected.distanceM}m away
                </Text>
              </View>
            </View>

            {mediaType !== "video" ? (
              <>
                <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>
                  ASK {selected.name.split(" ")[0].toUpperCase()} TO CAPTURE
                </Text>
                <View style={styles.mediaRow}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleSendRequest("photo");
                    }}
                    style={[
                      styles.mediaBtn,
                      {
                        backgroundColor: colors.primary + "18",
                        borderColor: colors.primary + "40",
                      },
                    ]}
                  >
                    <Feather name="camera" size={20} color={colors.primary} />
                    <View style={{ alignItems: "center" }}>
                      <Text style={[styles.mediaBtnText, { color: colors.primary }]}>Photo</Text>
                      <Text style={[styles.mediaBtnPrice, { color: colors.primary + "99" }]}>
                        {isStudent ? "Free" : "$1.00"}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMediaType("video");
                      setDuration(10);
                    }}
                    style={[
                      styles.mediaBtn,
                      {
                        backgroundColor: colors.accent + "18",
                        borderColor: colors.accent + "40",
                      },
                    ]}
                  >
                    <Feather name="video" size={20} color={colors.accent} />
                    <View style={{ alignItems: "center" }}>
                      <Text style={[styles.mediaBtnText, { color: colors.accent }]}>Video</Text>
                      <Text style={[styles.mediaBtnPrice, { color: colors.accent + "99" }]}>
                        {isStudent ? "Free" : "$2.00"}
                      </Text>
                    </View>
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
                    Video Duration
                  </Text>
                </View>
                <View style={styles.durationRow}>
                  {[5, 10, 20, 30].map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDuration(d);
                      }}
                      style={[
                        styles.durationBtn,
                        {
                          backgroundColor: duration === d ? colors.accent : colors.muted,
                          borderColor: duration === d ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.durationText,
                          { color: duration === d ? "#fff" : colors.mutedForeground },
                        ]}
                      >
                        {d}s
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={() => handleSendRequest("video", duration)}>
                  <LinearGradient
                    colors={[colors.accent, "#FF6B6B"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sendBtn}
                  >
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
  headerOverlay: { position: "absolute", top: 16, left: 16, right: 16 },
  headerCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#4ade80" },
  liveText: { fontSize: 13 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  userAvatarText: { fontWeight: "700" as const, fontSize: 14 },
  userName: { fontSize: 16, fontWeight: "600" as const },
  userDist: { fontSize: 13, marginTop: 2 },
  sheetLabel: { fontSize: 11, letterSpacing: 1.2, fontWeight: "600" as const },
  mediaRow: { flexDirection: "row", gap: 12 },
  mediaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  mediaBtnText: { fontSize: 15, fontWeight: "600" as const },
  mediaBtnPrice: { fontSize: 11, fontWeight: "500" as const, marginTop: 1 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sheetTitle: { fontSize: 16, fontWeight: "600" as const },
  durationRow: { flexDirection: "row", gap: 8 },
  durationBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  durationText: { fontSize: 14, fontWeight: "600" as const },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" as const },
});
