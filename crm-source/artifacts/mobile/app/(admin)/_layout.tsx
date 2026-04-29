import { Redirect, Stack } from "expo-router";
import React from "react";

import { AppState } from "@/components/AppState";
import { useAuthSession } from "@/contexts/AuthSessionContext";

export default function AdminLayout() {
  const auth = useAuthSession();

  if (auth.isLoading) {
    return <AppState title="Opening studio workspace" variant="loading" />;
  }

  if (auth.status !== "authenticated") {
    return <Redirect href="/login" />;
  }

  if (auth.requiresPasswordReset) {
    return <Redirect href="/change-password" />;
  }

  if (auth.role !== "admin") {
    return <Redirect href="/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: "#15110E" },
        headerTintColor: "#F8EFE3",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#15110E" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="leads/[id]"
        options={{
          title: "Lead dossier",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
