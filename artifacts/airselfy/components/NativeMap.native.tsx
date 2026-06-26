import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NearbyUser, useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function NativeMap() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { nearbyUsers, sendRequest } = useSocket();
  const { user } = useAuth();

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [locationGranted, setLocationGranted] = useState(false);
  const [selected, setSelected] = useState<NearbyUser | null>(null);
  const [mediaType, setMediaType] = useState<"photo" | "video" | null>(null);
  const [duration, setDuration] = useState<number>(10);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
      if (status === "granted") {
        setLocationGranted(true);
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } catch {
          // Location unavailable — keep default region, map still shows nearby users
        }
      }
    });
  }, []);

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

  function handleSendRequest(type: "photo" | "video", dur?: number) {
    if (!selected) return;
    const target = selected;
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
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        region={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
      >
        <Circle
          center={{ latitude: region.latitude, longitude: region.longitude }}
          radius={500}
          strokeColor={colors.primary + "40"}
          fillColor={colors.primary + "08"}
          strokeWidth={1}
        />
        {/* "You" balloon at user's current location */}
        {locationGranted && (
          <Marker
            coordinate={{ latitude: region.latitude, longitude: region.longitude }}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerWrap}>
              <View style={[styles.youBalloon, { backgroundColor: colors.primary, borderColor: "#fff" }]}>
                <Text style={styles.balloonText}>{user?.initials ?? "ME"}</Text>
              </View>
              <View style={styles.youLabel}>
                <Text style={[styles.youLabelText, { color: colors.primary }]}>You</Text>
              </View>
              <View style={[styles.balloonTail, { backgroundColor: colors.primary }]} />
              <View style={[styles.balloonKnot, { backgroundColor: colors.primary }]} />
            </View>
          </Marker>
        )}
        {nearbyUsers.map((u) => (
          <Marker
            key={u.id}
            coordinate={{ latitude: u.lat, longitude: u.lon }}
            onPress={() => openSheet(u)}
            tracksViewChanges={false}
          >
            <View style={styles.markerWrap}>
              <View style={[styles.balloon, { backgroundColor: u.color }]}>
                <Text style={styles.balloonText}>{u.initials}</Text>
              </View>
              <View style={[styles.balloonTail, { backgroundColor: u.color }]} />
              <View style={[styles.balloonKnot, { backgroundColor: u.color }]} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}>
        <View style={[styles.headerCard, { backgroundColor: colors.background + "E8", borderColor: colors.border }]}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={[styles.liveText, { color: colors.mutedForeground }]}>
              Live · {nearbyUsers.length} nearby
            </Text>
          </View>
        </View>
      </View>

      {/* Sheet */}
      {selected && (
        <Modal transparent animationType="none" visible onRequestClose={closeSheet}>
          <Pressable style={styles.overlay} onPress={closeSheet} />
          <Animated.View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateY: sheetTranslateY }] }]}>
            <View style={[styles.handle, { backgroundColor: colors.muted }]} />
            <View style={styles.userRow}>
              <View style={[styles.userAvatar, { backgroundColor: selected.color + "25", borderColor: selected.color + "50" }]}>
                <Text style={[styles.userAvatarText, { color: selected.color }]}>{selected.initials}</Text>
              </View>
              <View>
                <Text style={[styles.userName, { color: colors.foreground }]}>{selected.name}</Text>
                <Text style={[styles.userDist, { color: colors.mutedForeground }]}>{selected.distanceM}m away</Text>
              </View>
            </View>

            {mediaType !== "video" ? (
              <>
                <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>
                  ASK {selected.name.split(" ")[0].toUpperCase()} TO CAPTURE
                </Text>
                <View style={styles.mediaRow}>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSendRequest("photo"); }}
                    style={[styles.mediaBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
                  >
                    <Feather name="camera" size={20} color={colors.primary} />
                    <Text style={[styles.mediaBtnText, { color: colors.primary }]}>Photo</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMediaType("video"); setDuration(10); }}
                    style={[styles.mediaBtn, { backgroundColor: colors.accent + "18", borderColor: colors.accent + "40" }]}
                  >
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
                  <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Video Duration</Text>
                </View>
                <View style={styles.durationRow}>
                  {[5, 10, 20, 30].map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDuration(d); }}
                      style={[styles.durationBtn, { backgroundColor: duration === d ? colors.accent : colors.muted, borderColor: duration === d ? colors.accent : colors.border }]}
                    >
                      <Text style={[styles.durationText, { color: duration === d ? "#fff" : colors.mutedForeground }]}>{d}s</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={() => handleSendRequest("video", duration)}>
                  <LinearGradient colors={[colors.accent, "#FF6B6B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendBtn}>
                    <Feather name="send" size={16} color="#fff" />
                    <Text style={styles.sendBtnText}>Send Request</Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  markerWrap: { alignItems: "center" },
  balloon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  youBalloon: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", borderWidth: 2.5 },
  youLabel: { position: "absolute", top: -18, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  youLabelText: { fontSize: 9, fontWeight: "700" as const, letterSpacing: 0.5 },
  balloonText: { color: "#fff", fontWeight: "700" as const, fontSize: 12 },
  balloonTail: { width: 2, height: 10, opacity: 0.7 },
  balloonKnot: { width: 6, height: 6, borderRadius: 3, opacity: 0.5 },
  headerOverlay: { position: "absolute", top: 0, left: 16, right: 16 },
  headerCard: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#4ade80" },
  liveText: { fontSize: 13 },
  overlay: { flex: 1 },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 16 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  userAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  userAvatarText: { fontWeight: "700" as const, fontSize: 14 },
  userName: { fontSize: 16, fontWeight: "600" as const },
  userDist: { fontSize: 13, marginTop: 2 },
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

const darkMapStyle = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
