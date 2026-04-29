import { Redirect, Stack } from "expo-router";
import React from "react";

import { AppState } from "@/components/AppState";
import { useAuthSession } from "@/contexts/AuthSessionContext";

export default function ClientLayout() {
  const auth = useAuthSession();

  if (auth.isLoading) {
    return <AppState title="Opening your client portal" variant="loading" />;
  }

  if (auth.status !== "authenticated") {
    return <Redirect href="/login" />;
  }

  if (auth.role !== "client") {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      initialRouteName="(tabs)"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#15110E" } }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="portal" />
    </Stack>
  );
}
