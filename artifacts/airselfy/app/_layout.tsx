import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StripeProvider } from "@stripe/stripe-react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { IncomingRequestModal } from "@/components/IncomingRequestModal";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { SocketProvider } from "@/context/SocketContext";
import { WalletProvider } from "@/context/WalletContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function getApiBase(): string {
  if (Platform.OS === "web") return "/api";
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return "/api";
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const currentScreen = segments[0] as string | undefined;
    const isPublicScreen = currentScreen === "login" || currentScreen === "signup" || currentScreen === "goodbye";
    if (!user && !isPublicScreen) {
      router.replace("/login");
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="goodbye" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="compass" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [stripePublishableKey, setStripePublishableKey] = useState("");

  useEffect(() => {
    fetch(`${getApiBase()}/stripe/config`)
      .then((r) => r.json())
      .then((data: { publishableKey?: string }) => {
        if (data.publishableKey) setStripePublishableKey(data.publishableKey);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <StripeProvider
                publishableKey={stripePublishableKey}
                merchantIdentifier="merchant.com.airselfy.app"
              >
                <AuthProvider>
                  <AppProvider>
                    <WalletProvider>
                      <SocketProvider>
                        <RootLayoutNav />
                        <IncomingRequestModal />
                      </SocketProvider>
                    </WalletProvider>
                  </AppProvider>
                </AuthProvider>
              </StripeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
