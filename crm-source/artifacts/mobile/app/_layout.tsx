import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthSessionProvider } from "@/contexts/AuthSessionContext";

SplashScreen.preventAutoHideAsync();

function resolveApiBaseUrl(): string | null {
  const explicitApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicitApiUrl) {
    return explicitApiUrl.replace(/\/+$/, "");
  }

  const domain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  if (!domain) {
    return null;
  }

  return `https://${domain}`.replace(/\/+$/, "");
}

setBaseUrl(resolveApiBaseUrl());

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      initialRouteName="(auth)"
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: "#15110E" },
        headerTintColor: "#F8EFE3",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#15110E" },
      }}
    >
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(client)" options={{ headerShown: false }} />
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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider style={styles.root}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthSessionProvider>
            <GestureHandlerRootView style={styles.root}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthSessionProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
