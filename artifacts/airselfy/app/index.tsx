import { Redirect } from "expo-router";
import { useContext } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function Index() {
  const ctx = useContext(AuthContext);
  const colors = useColors();

  if (!ctx || ctx.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (ctx.user) return <Redirect href="/(tabs)" />;
  return <Redirect href="/login" />;
}
