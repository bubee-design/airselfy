import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSocket } from "@/context/SocketContext";
import { useColors } from "@/hooks/useColors";

// Lazy import camera on native only
type CameraViewRef = {
  takePictureAsync: (opts?: { base64?: boolean; quality?: number }) => Promise<{ uri: string; base64?: string }>;
  recordAsync: (opts: { maxDuration: number }) => Promise<{ uri: string }>;
  stopRecording: () => void;
};

export default function CameraScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type: string; duration: string; byName: string; requesterId?: string }>();
  const { deliverMedia } = useSocket();

  const type = params.type === "video" ? "video" : "photo";
  const duration = parseInt(params.duration ?? "10", 10);
  const byName = params.byName ?? "Unknown";
  const requesterId = params.requesterId ?? "";

  const [permGranted, setPermGranted] = useState(false);
  const [permLoading, setPermLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [flash, setFlash] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [CameraView, setCameraView] = useState<React.ComponentType<{
    style?: object;
    facing?: "front" | "back";
    flash?: "on" | "off";
    mode?: "picture" | "video";
    ref?: React.Ref<CameraViewRef>;
  }> | null>(null);

  const cameraRef = useRef<CameraViewRef>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Thumbnail URI captured before video recording starts (shown in album grid)
  const thumbnailUriRef = useRef<string>("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    async function setup() {
      if (Platform.OS === "web") {
        setPermLoading(false);
        setPermGranted(false);
        return;
      }
      try {
        const cam = await import("expo-camera");
        const perm = await cam.Camera.requestCameraPermissionsAsync();
        if (perm.granted) {
          setPermGranted(true);
          // @ts-ignore
          setCameraView(() => cam.CameraView);
        }
      } catch {}
      setPermLoading(false);
    }
    setup();
  }, []);

  function triggerFlash() {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  async function handleCapture() {
    if (type === "photo") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      triggerFlash();
      let uri = "";
      if (Platform.OS !== "web" && cameraRef.current) {
        try {
          const result = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
          uri = result.base64 ? `data:image/jpeg;base64,${result.base64}` : result.uri;
        } catch {}
      }
      setCaptured(true);
      if (requesterId) deliverMedia(requesterId, "photo", 0, uri);
      setTimeout(() => router.replace("/(tabs)/album"), 800);
    } else {
      if (!recording) {
        // Snap a still thumbnail before recording starts (used as album grid preview)
        thumbnailUriRef.current = "";
        if (Platform.OS !== "web" && cameraRef.current) {
          try {
            const snap = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.3 });
            thumbnailUriRef.current = snap.base64 ? `data:image/jpeg;base64,${snap.base64}` : snap.uri;
          } catch {}
        }

        setRecording(true);
        setElapsed(0);
        progressAnim.setValue(0);
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: duration * 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start();

        timerRef.current = setInterval(() => {
          setElapsed((e) => {
            if (e + 1 >= duration) {
              // Defer out of the setState updater to avoid React's
              // "update a component while rendering another" warning
              setTimeout(stopRecording, 0);
              return duration;
            }
            return e + 1;
          });
        }, 1000);

        if (Platform.OS !== "web" && cameraRef.current) {
          try {
            // recordAsync resolves when stopRecording() is called (by timer or user tap)
            const result = await cameraRef.current.recordAsync({ maxDuration: duration });
            // Read video file as base64 for cross-device delivery
            let videoUri: string | undefined;
            try {
              const base64 = await readAsStringAsync(result.uri, {
                encoding: EncodingType.Base64,
              });
              videoUri = `data:video/mp4;base64,${base64}`;
            } catch {}
            if (requesterId) deliverMedia(requesterId, "video", duration, thumbnailUriRef.current, videoUri);
            setTimeout(() => router.replace("/(tabs)/album"), 600);
          } catch {}
        }
        // Web: stopRecording handles delivery + navigation
      } else {
        stopRecording();
      }
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    if (Platform.OS !== "web") {
      // Triggers recordAsync to resolve → delivery + navigation handled there
      try { cameraRef.current?.stopRecording(); } catch {}
    } else {
      // Web fallback: no recordAsync, deliver and navigate here
      if (requesterId) deliverMedia(requesterId, "video", duration, "");
      setTimeout(() => router.replace("/(tabs)/album"), 600);
    }
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (permLoading) {
    return (
      <View style={[styles.center, { backgroundColor: "#000" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!permGranted || Platform.OS === "web") {
    return (
      <View style={[styles.webFallback, { backgroundColor: "#000" }]}>
        <View style={[styles.webFallbackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="camera" size={48} color={colors.primary} />
          <Text style={[styles.webTitle, { color: colors.foreground }]}>Camera Access</Text>
          <Text style={[styles.webSub, { color: colors.mutedForeground }]}>
            {Platform.OS === "web"
              ? "Scan the QR code in Expo Go on your device to use the camera."
              : "Camera permission is required to capture media."}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.webBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: "#fff", fontWeight: "600" as const }}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const CameraComp = CameraView;
  if (!CameraComp) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Camera view */}
      <CameraComp
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash ? "on" : "off"}
        mode={type === "photo" ? "picture" : "video"}
        ref={cameraRef as any}
      />

      {/* Flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: flashAnim }]}
      />

      {/* Captured overlay */}
      {captured && (
        <View style={[StyleSheet.absoluteFill, styles.capturedOverlay]}>
          <View style={styles.capturedIcon}>
            <Feather name="check" size={40} color="#4ade80" />
          </View>
          <Text style={styles.capturedText}>Saved to Album</Text>
        </View>
      )}

      {/* Top controls */}
      <View style={[styles.topControls, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.controlBtn}>
          <Feather name="x" size={20} color="#fff" />
        </Pressable>

        <View style={styles.requestBadge}>
          <Text style={styles.requestBadgeText}>For {byName}</Text>
        </View>

        <Pressable onPress={() => setFlash((f) => !f)} style={styles.controlBtn}>
          <Feather name={flash ? "zap" : "zap-off"} size={20} color={flash ? "#FFD700" : "#fff"} />
        </Pressable>
      </View>

      {/* Recording indicator */}
      {recording && (
        <View style={styles.recordingBar}>
          <View style={styles.recDotWrap}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>{elapsed}s / {duration}s</Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>
      )}

      {/* Grid overlay */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.gridH1} />
        <View style={styles.gridH2} />
        <View style={styles.gridV1} />
        <View style={styles.gridV2} />
      </View>

      {/* Focus brackets */}
      <View pointerEvents="none" style={styles.focusBracket}>
        <View style={[styles.bracket, styles.bracketTL, { borderColor: colors.primary }]} />
        <View style={[styles.bracket, styles.bracketTR, { borderColor: colors.primary }]} />
        <View style={[styles.bracket, styles.bracketBL, { borderColor: colors.primary }]} />
        <View style={[styles.bracket, styles.bracketBR, { borderColor: colors.primary }]} />
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: bottomPad + 20 }]}>
        {/* Thumbnail placeholder */}
        <View style={styles.thumbnailWrap} />

        {/* Shutter */}
        <Pressable onPress={handleCapture} style={styles.shutterOuter}>
          {type === "photo" ? (
            <View style={styles.shutterPhoto} />
          ) : (
            <View style={[styles.shutterVideo, recording && styles.shutterVideoRecording]} />
          )}
        </Pressable>

        {/* Flip */}
        <Pressable
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          style={styles.controlBtn}
        >
          <Feather name="refresh-cw" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  webFallbackCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 16,
    maxWidth: 320,
    width: "100%",
  },
  webTitle: { fontSize: 20, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  webSub: { fontSize: 14, textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 20 },
  webBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  requestBadge: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  requestBadgeText: { color: "#fff", fontSize: 13, fontFamily: "Inter_500Medium" },
  recordingBar: {
    position: "absolute",
    top: 90,
    left: 20,
    right: 20,
    gap: 8,
  },
  recDotWrap: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF6B6B" },
  recText: { color: "#fff", fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#FF6B6B", borderRadius: 2 },
  gridH1: { position: "absolute", top: "33.33%", left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  gridH2: { position: "absolute", top: "66.67%", left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  gridV1: { position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  gridV2: { position: "absolute", left: "66.67%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  focusBracket: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 80,
    height: 80,
    marginLeft: -40,
    marginTop: -40,
  },
  bracket: { position: "absolute", width: 20, height: 20, borderWidth: 2 },
  bracketTL: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  bracketTR: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bracketBL: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  bracketBR: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingTop: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  thumbnailWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterPhoto: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff" },
  shutterVideo: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#FF6B6B" },
  shutterVideoRecording: { width: 32, height: 32, borderRadius: 6 },
  capturedOverlay: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    gap: 16,
  },
  capturedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(74, 222, 128, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  capturedText: { color: "#fff", fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
});
