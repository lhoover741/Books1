import { Redirect, Stack } from "expo-router";
import React from "react";

import { AppState } from "@/components/AppState";
import { useAuthSession } from "@/contexts/AuthSessionContext";

export default function AuthLayout() {
  const auth = useAuthSession();

  if (auth.isLoading) {
    return <AppState title="Restoring your session" variant="loading" />;
  }

  if (auth.status === "authenticated") {
    if (auth.requiresPasswordReset) {
      return <Redirect href="/change-password" />;
    }

    return <Redirect href={auth.role === "admin" ? "/(admin)" : "/home"} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#15110E" } }}>
      <Stack.Screen name="change-password" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
