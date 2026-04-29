import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
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

const CLIENT_LOGIN = {
  email: "client@booksandbrews.app",
  password: "brew-client-2026",
};

const ADMIN_LOGIN = {
  email: "admin@booksandbrews.app",
  password: "admin123",
};

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const auth = useAuthSession();
  const [email, setEmail] = useState(CLIENT_LOGIN.email);
  const [password, setPassword] = useState(CLIENT_LOGIN.password);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStudioAccess, setShowStudioAccess] = useState(false);
  const studioPanelFade = React.useRef(new Animated.Value(0)).current;
  const isStudioCredential = email.trim().toLowerCase() === ADMIN_LOGIN.email;
  const actionLabel = isStudioCredential ? "Continue to studio access" : "Continue to client portal";

  React.useEffect(() => {
    Animated.timing(studioPanelFade, {
      toValue: showStudioAccess ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [showStudioAccess, studioPanelFade]);

  const submit = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await auth.login({ email, password });

    if (!result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(false);
  };

  const applyPreset = (preset: typeof CLIENT_LOGIN) => {
    Haptics.selectionAsync();
    setError("");
    setEmail(preset.email);
    setPassword(preset.password);
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
            <Feather name="coffee" size={22} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.eyebrow, { color: colors.crema }]}>Books and Brews</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Welcome to your portal.</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>A calm, premium client workspace for project visibility, billing, shared files, and direct support.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Client portal access</Text>
            {isStudioCredential ? (
              <View style={[styles.roleChip, { backgroundColor: colors.secondary }]}> 
                <Text style={[styles.roleChipText, { color: colors.crema }]}>Studio access</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.cardIntro, { color: colors.mutedForeground }]}>Use your email credentials to enter the client portal. Studio access stays discreet and separate.</Text>
          <Text style={[styles.label, { color: colors.secondaryForeground }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError("");
            }}
            autoFocus
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@booksandbrews.app"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          />
          <Text style={[styles.label, { color: colors.secondaryForeground }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError("");
            }}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Enter password"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            onSubmitEditing={submit}
          />
          {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
          <Pressable
            onPress={submit}
            disabled={isSubmitting}
            style={[styles.signInButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.72 : 1 }]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.signInText, { color: colors.primaryForeground }]}>
                {actionLabel}
              </Text>
            )}
          </Pressable>

          <Text style={[styles.trustText, { color: colors.mutedForeground }]}>Need help signing in? Contact support@booksandbrews.app for client access assistance.</Text>
        </View>

        <View style={styles.footerAccess}>
          <Pressable
            onPress={() => applyPreset(CLIENT_LOGIN)}
            style={[styles.quickButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
          >
            <Text style={[styles.quickButtonText, { color: colors.foreground }]}>Use client demo</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setShowStudioAccess((current) => !current);
            }}
            style={styles.studioToggle}
          >
            <Text style={[styles.studioToggleText, { color: colors.mutedForeground }]}>Studio team access</Text>
            <Feather
              name={showStudioAccess ? "chevron-up" : "chevron-down"}
              size={14}
              color={colors.mutedForeground}
            />
          </Pressable>

          {showStudioAccess ? (
            <Animated.View
              style={[
                styles.studioPanel,
                {
                  backgroundColor: colors.surfaceSoft,
                  borderColor: colors.border,
                  opacity: studioPanelFade,
                  transform: [
                    {
                      translateY: studioPanelFade.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-6, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={[styles.studioPanelEyebrow, { color: colors.crema }]}>Private studio workspace</Text>
              <Text style={[styles.studioPanelCopy, { color: colors.mutedForeground }]}>This hidden workspace is reserved for the internal CRM, lead follow-up, and management operations.</Text>
              <Pressable
                onPress={() => applyPreset(ADMIN_LOGIN)}
                style={[
                  styles.studioPresetButton,
                  { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.studioPresetText, { color: colors.foreground }]}>Use studio demo credentials</Text>
              </Pressable>
            </Animated.View>
          ) : null}
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
    fontSize: 42,
    lineHeight: 45,
    letterSpacing: -1.7,
    marginTop: 8,
  },
  copy: { fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24, marginTop: 14 },
  card: { borderWidth: 1, borderRadius: 28, padding: 20, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 2 },
  cardIntro: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 19, marginBottom: 4 },
  roleChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  roleChipText: { fontFamily: "Inter_700Bold", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 },
  label: { fontFamily: "Inter_700Bold", fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 52,
    paddingHorizontal: 14,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  errorText: { fontFamily: "Inter_600SemiBold", fontSize: 12, lineHeight: 18 },
  signInButton: {
    minHeight: 56,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 4,
  },
  signInText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  trustText: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 18, marginTop: 2 },
  footerAccess: { gap: 10 },
  quickButton: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  quickButtonText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  studioToggle: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  studioToggleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  studioPanel: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  studioPanelEyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  studioPanelCopy: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 18,
  },
  studioPresetButton: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  studioPresetText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
});
