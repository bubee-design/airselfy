import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSocket } from "@/context/SocketContext";
import { useColors } from "@/hooks/useColors";

export function IncomingRequestModal() {
  const { pendingRequest, acceptRequest, declineRequest } = useSocket();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pendingRequest) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 120, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [pendingRequest]);

  if (!pendingRequest) return null;

  const isPhoto = pendingRequest.type === "photo";
  const accentColor = isPhoto ? colors.primary : colors.accent;

  function handleAccept() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    acceptRequest();
  }

  function handleDecline() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    declineRequest();
  }

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
      <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.muted }]} />

          {/* Icon */}
          <View style={[styles.iconRing, { borderColor: accentColor + "40", backgroundColor: accentColor + "12" }]}>
            <View style={[styles.iconInner, { backgroundColor: accentColor + "25", borderColor: accentColor + "50" }]}>
              <Feather name={isPhoto ? "camera" : "video"} size={28} color={accentColor} />
            </View>
          </View>

          {/* Copy */}
          <Text style={[styles.headline, { color: colors.foreground }]}>
            {pendingRequest.requesterName} wants a {isPhoto ? "photo" : "video"}
          </Text>
          <Text style={[styles.subline, { color: colors.mutedForeground }]}>
            Navigate to their location{!isPhoto ? ` · ${pendingRequest.duration}s clip` : ""} and capture it for them
          </Text>

          {/* Badge */}
          <View style={[styles.badge, { backgroundColor: accentColor + "15", borderColor: accentColor + "35" }]}>
            <Feather name={isPhoto ? "camera" : "video"} size={13} color={accentColor} />
            <Text style={[styles.badgeText, { color: accentColor }]}>
              {isPhoto ? "Photo request" : `Video · ${pendingRequest.duration}s`}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <Pressable
              onPress={handleDecline}
              style={[styles.declineBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Feather name="x" size={18} color={colors.mutedForeground} />
              <Text style={[styles.declineBtnText, { color: colors.mutedForeground }]}>Decline</Text>
            </Pressable>

            <Pressable onPress={handleAccept} style={styles.acceptBtnWrap}>
              <LinearGradient
                colors={isPhoto ? [colors.primary, colors.accent] : [colors.accent, "#FF6B6B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptBtn}
              >
                <Feather name="navigation" size={18} color="#fff" />
                <Text style={styles.acceptBtnText}>Navigate & Capture</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 14,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 4,
  },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  declineBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  acceptBtnWrap: { flex: 1 },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
