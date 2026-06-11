import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const COUNTDOWN = 4;

export default function GoodbyeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [seconds, setSeconds] = useState(COUNTDOWN);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: COUNTDOWN * 1000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          router.replace("/login");
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function goNow() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/login");
  }

  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const bottomPad = Platform.OS === "web" ? 40 : insets.bottom + 24;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Background glow */}
      <View style={[styles.glowTop, { backgroundColor: colors.primary + "12" }]} />
      <View style={[styles.glowBottom, { backgroundColor: colors.accent + "0A" }]} />

      <Animated.View
        style={[
          styles.content,
          { paddingTop: topPad + 40, paddingBottom: bottomPad },
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Icon */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={[colors.primary + "30", colors.accent + "20"]}
            style={[styles.iconCircle, { borderColor: colors.primary + "40" }]}
          >
            <Feather name="check-circle" size={48} color={colors.primary} />
          </LinearGradient>
        </Animated.View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.foreground }]}>Signed Out</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            You've been safely signed out of Airselfy.{"\n"}See you next time!
          </Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={[styles.countdownText, { color: colors.mutedForeground }]}>
          Returning to sign in in {seconds}s…
        </Text>

        {/* Sign in button */}
        <Pressable onPress={goNow} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.signInBtn}
          >
            <Feather name="arrow-right" size={16} color="#fff" />
            <Text style={styles.signInBtnText}>Sign In Now</Text>
          </LinearGradient>
        </Pressable>

        {/* Branding */}
        <View style={styles.brandRow}>
          <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.brandText, { color: colors.mutedForeground }]}>Airselfy</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glowTop: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  glowBottom: {
    position: "absolute",
    bottom: -80,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { alignItems: "center", gap: 10 },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  progressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  countdownText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: -12,
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
  },
  signInBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  brandDot: { width: 6, height: 6, borderRadius: 3 },
  brandText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
