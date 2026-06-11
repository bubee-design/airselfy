import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const topPad =
    Platform.OS === "web" ? 67 : insets.top > 0 ? insets.top : 20;

  async function handleLogin() {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/");
    } else {
      setError("No account found. Please sign up first.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  const s = styles(colors);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: topPad }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.inner}>
          {/* Logo */}
          <View style={s.logoWrap}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.logoGrad}
            >
              <Feather name="users" size={28} color="#fff" />
            </LinearGradient>
            <Text style={s.logoText}>airselfy</Text>
          </View>

          {/* Headline */}
          <View style={s.headerWrap}>
            <Text style={s.title}>Welcome back</Text>
            <Text style={s.subtitle}>Sign in to see who's around you.</Text>
          </View>

          {/* Fields */}
          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>EMAIL</Text>
              <View style={s.inputWrap}>
                <Feather name="mail" size={16} color={colors.primary} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>PASSWORD</Text>
              <View style={s.inputWrap}>
                <Feather name="lock" size={16} color={colors.primary} style={s.inputIcon} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword((p) => !p)} style={s.eyeBtn}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>

            {!!error && <Text style={s.error}>{error}</Text>}

            <Pressable onPress={handleLogin} disabled={loading} style={{ marginTop: 8 }}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.btn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnText}>Sign In</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <Text style={s.footer}>
            New here?{" "}
            <Link href="/signup" style={{ color: colors.primary }}>
              Create an account
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    inner: {
      flex: 1,
      paddingHorizontal: 24,
      paddingBottom: 40,
      justifyContent: "center",
      gap: 32,
    },
    logoWrap: {
      alignItems: "center",
      gap: 8,
    },
    logoGrad: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    logoText: {
      color: colors.foreground,
      fontSize: 26,
      fontWeight: "700" as const,
      letterSpacing: -0.5,
      fontFamily: "Inter_700Bold",
    },
    headerWrap: { gap: 4 },
    title: {
      color: colors.foreground,
      fontSize: 26,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    subtitle: {
      color: colors.mutedForeground,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    form: { gap: 16 },
    field: { gap: 6 },
    label: {
      color: colors.mutedForeground,
      fontSize: 11,
      letterSpacing: 1.2,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 52,
    },
    inputIcon: { marginRight: 10 },
    input: {
      flex: 1,
      color: colors.foreground,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
    },
    eyeBtn: { padding: 4 },
    error: {
      color: colors.destructive,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    btn: {
      height: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    btnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    footer: {
      textAlign: "center",
      color: colors.mutedForeground,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
  });
