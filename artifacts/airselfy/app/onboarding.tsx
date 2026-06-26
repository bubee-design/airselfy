import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
import { type StudentProfile, useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUserType } = useAuth();

  const [selectedType, setSelectedType] = useState<"regular" | "student" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [gender, setGender] = useState("");
  const [degree, setDegree] = useState("");
  const [university, setUniversity] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top > 0 ? insets.top : 20;

  async function handleContinue() {
    if (!selectedType) return;

    if (selectedType === "student") {
      if (!fullName.trim() || !studentEmail.trim() || !gender.trim() || !degree.trim() || !university.trim()) {
        setError("Please fill in all student fields.");
        return;
      }
    }

    setError("");
    setLoading(true);

    const profile: StudentProfile | undefined =
      selectedType === "student"
        ? {
            fullName: fullName.trim(),
            email: studentEmail.trim(),
            gender: gender.trim(),
            degree: degree.trim(),
            university: university.trim(),
          }
        : undefined;

    const result = await setUserType(selectedType, profile);
    setLoading(false);

    if (result === true) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } else {
      setError(typeof result === "string" ? result : "Something went wrong. Please try again.");
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
        contentContainerStyle={{ flexGrow: 1, paddingTop: topPad, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
            <Text style={s.title}>You're in! 🎉</Text>
            <Text style={s.subtitle}>
              Tell us who you are so we can tailor your experience.
            </Text>
          </View>

          {/* Type cards */}
          <View style={s.cardsRow}>
            <Pressable
              style={[
                s.typeCard,
                {
                  borderColor:
                    selectedType === "regular" ? colors.primary : colors.border,
                  backgroundColor:
                    selectedType === "regular"
                      ? colors.primary + "10"
                      : colors.card,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedType("regular");
                setError("");
              }}
            >
              <View
                style={[
                  s.typeIconWrap,
                  {
                    backgroundColor:
                      selectedType === "regular"
                        ? colors.primary + "20"
                        : colors.secondary,
                  },
                ]}
              >
                <Feather
                  name="user"
                  size={22}
                  color={
                    selectedType === "regular"
                      ? colors.primary
                      : colors.mutedForeground
                  }
                />
              </View>
              <Text
                style={[
                  s.typeTitle,
                  {
                    color:
                      selectedType === "regular"
                        ? colors.primary
                        : colors.foreground,
                  },
                ]}
              >
                Regular User
              </Text>
              <Text style={[s.typeDesc, { color: colors.mutedForeground }]}>
                Photo $1.00{"\n"}Video $2.00
              </Text>
              {selectedType === "regular" && (
                <View style={[s.checkBadge, { backgroundColor: colors.primary }]}>
                  <Feather name="check" size={10} color="#fff" />
                </View>
              )}
            </Pressable>

            <Pressable
              style={[
                s.typeCard,
                {
                  borderColor:
                    selectedType === "student" ? colors.accent : colors.border,
                  backgroundColor:
                    selectedType === "student"
                      ? colors.accent + "10"
                      : colors.card,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedType("student");
                setError("");
              }}
            >
              <View
                style={[
                  s.typeIconWrap,
                  {
                    backgroundColor:
                      selectedType === "student"
                        ? colors.accent + "20"
                        : colors.secondary,
                  },
                ]}
              >
                <Feather
                  name="book-open"
                  size={22}
                  color={
                    selectedType === "student"
                      ? colors.accent
                      : colors.mutedForeground
                  }
                />
              </View>
              <Text
                style={[
                  s.typeTitle,
                  {
                    color:
                      selectedType === "student"
                        ? colors.accent
                        : colors.foreground,
                  },
                ]}
              >
                College Student
              </Text>
              <Text style={[s.typeDesc, { color: colors.mutedForeground }]}>
                Completely free{"\n"}requests
              </Text>
              {selectedType === "student" && (
                <View style={[s.checkBadge, { backgroundColor: colors.accent }]}>
                  <Feather name="check" size={10} color="#fff" />
                </View>
              )}
            </Pressable>
          </View>

          {/* Student form */}
          {selectedType === "student" && (
            <View style={s.form}>
              <Text style={[s.formTitle, { color: colors.foreground }]}>
                Student Profile
              </Text>

              <View style={s.field}>
                <Text style={[s.label, { color: colors.mutedForeground }]}>
                  FULL NAME
                </Text>
                <View
                  style={[
                    s.inputWrap,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather
                    name="user"
                    size={16}
                    color={colors.accent}
                    style={s.inputIcon}
                  />
                  <TextInput
                    style={[s.input, { color: colors.foreground }]}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Alex Johnson"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={s.field}>
                <Text style={[s.label, { color: colors.mutedForeground }]}>
                  STUDENT EMAIL
                </Text>
                <View
                  style={[
                    s.inputWrap,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather
                    name="mail"
                    size={16}
                    color={colors.accent}
                    style={s.inputIcon}
                  />
                  <TextInput
                    style={[s.input, { color: colors.foreground }]}
                    value={studentEmail}
                    onChangeText={setStudentEmail}
                    placeholder="alex@university.edu"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={s.field}>
                <Text style={[s.label, { color: colors.mutedForeground }]}>
                  GENDER
                </Text>
                <View
                  style={[
                    s.inputWrap,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather
                    name="smile"
                    size={16}
                    color={colors.accent}
                    style={s.inputIcon}
                  />
                  <TextInput
                    style={[s.input, { color: colors.foreground }]}
                    value={gender}
                    onChangeText={setGender}
                    placeholder="Male / Female / Non-binary / …"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={s.field}>
                <Text style={[s.label, { color: colors.mutedForeground }]}>
                  DEGREE
                </Text>
                <View
                  style={[
                    s.inputWrap,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather
                    name="award"
                    size={16}
                    color={colors.accent}
                    style={s.inputIcon}
                  />
                  <TextInput
                    style={[s.input, { color: colors.foreground }]}
                    value={degree}
                    onChangeText={setDegree}
                    placeholder="BSc Computer Science"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={s.field}>
                <Text style={[s.label, { color: colors.mutedForeground }]}>
                  COLLEGE / UNIVERSITY
                </Text>
                <View
                  style={[
                    s.inputWrap,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather
                    name="home"
                    size={16}
                    color={colors.accent}
                    style={s.inputIcon}
                  />
                  <TextInput
                    style={[s.input, { color: colors.foreground }]}
                    value={university}
                    onChangeText={setUniversity}
                    placeholder="MIT, Stanford, …"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>
          )}

          {!!error && (
            <Text style={[s.error, { color: colors.destructive }]}>{error}</Text>
          )}

          {selectedType && (
            <Pressable
              onPress={handleContinue}
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              <LinearGradient
                colors={
                  selectedType === "student"
                    ? [colors.accent, "#FF6B6B"]
                    : [colors.primary, colors.accent]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.btn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnText}>
                    {selectedType === "student"
                      ? "Verify & Continue for Free"
                      : "Continue"}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          )}
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
      gap: 24,
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
    headerWrap: { gap: 6 },
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
      lineHeight: 20,
    },
    cardsRow: {
      flexDirection: "row",
      gap: 12,
    },
    typeCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1.5,
      padding: 16,
      gap: 8,
      alignItems: "flex-start",
    },
    typeIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    typeTitle: {
      fontSize: 15,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    typeDesc: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
    },
    checkBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    form: {
      gap: 14,
      backgroundColor: colors.secondary,
      borderRadius: 16,
      padding: 16,
    },
    formTitle: {
      fontSize: 15,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 2,
    },
    field: { gap: 6 },
    label: {
      fontSize: 11,
      letterSpacing: 1.2,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 52,
    },
    inputIcon: { marginRight: 10 },
    input: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
    },
    error: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
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
  });
