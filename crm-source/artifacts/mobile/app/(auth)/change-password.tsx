import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthSession } from "@/contexts/AuthSessionContext";
import { useColors } from "@/hooks/useColors";

export default function ChangePasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const auth = useAuthSession();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const helperText = useMemo(() => {
    if (!password) {
      return "Use at least 8 characters with numbers or symbols.";
    }

    if (password.length < 8) {
      return "Password is too short.";
    }

    return "Looks good.";
  }, [password]);

  if (auth.status !== "authenticated") {
    return <Redirect href="/login" />;
  }

  if (auth.role !== "admin") {
    return <Redirect href="/home" />;
  }

  if (!auth.requiresPasswordReset) {
    return <Redirect href="/(admin)" />;
  }

  const submit = async () => {
    if (isSubmitting) {
      return;
    }

    if (password.trim().length < 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Use at least 8 characters for your new password.");
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await auth.completeFirstLoginPasswordChange(password);

    if (!result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(false);
    await auth.refreshSession();
  };

  return (
    <LinearGradient
      colors={[colors.mocha, colors.background]}
      style={[styles.screen, { paddingTop: insets.top + 26, paddingBottom: insets.bottom + 24 }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View>
          <View style={styles.brandMark}>
            <Feather name="shield" size={22} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.eyebrow, { color: colors.crema }]}>Studio Security</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Create your private admin password.</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>Your temporary password is active only once. Save a new password now to continue.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.label, { color: colors.secondaryForeground }]}>New password</Text>
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError("");
            }}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Choose a secure password"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          />

          <Text style={[styles.label, { color: colors.secondaryForeground }]}>Confirm password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setError("");
            }}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Re-enter password"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            onSubmitEditing={submit}
          />

          <Text style={[styles.helperText, { color: colors.mutedForeground }]}>{helperText}</Text>
          {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={isSubmitting}
            style={[styles.actionButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.72 : 1 }]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.actionText, { color: colors.primaryForeground }]}>Save new password</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: "space-between" },
  screen: { flex: 1, paddingHorizontal: 22 },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C47A3C",
  },
  eyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginTop: 18,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.4,
    marginTop: 8,
  },
  copy: { fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24, marginTop: 14 },
  card: { borderWidth: 1, borderRadius: 28, padding: 20, gap: 10 },
  label: { fontFamily: "Inter_700Bold", fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 52,
    paddingHorizontal: 14,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  helperText: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 18 },
  errorText: { fontFamily: "Inter_600SemiBold", fontSize: 12, lineHeight: 18 },
  actionButton: {
    minHeight: 56,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 4,
  },
  actionText: { fontFamily: "Inter_700Bold", fontSize: 15 },
});
