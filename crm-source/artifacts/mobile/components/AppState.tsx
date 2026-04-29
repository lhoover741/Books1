import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type AppStateVariant = "loading" | "empty" | "error" | "info";

type AppStateProps = {
  title: string;
  description?: string;
  variant?: AppStateVariant;
  actionLabel?: string;
  onAction?: () => void;
};

const ICON_BY_VARIANT: Record<AppStateVariant, keyof typeof Feather.glyphMap> = {
  loading: "coffee",
  empty: "inbox",
  error: "alert-triangle",
  info: "sparkles",
};

const EYEBROW_BY_VARIANT: Record<AppStateVariant, string> = {
  loading: "Preparing your workspace",
  empty: "Nothing missing, just not posted yet",
  error: "Connection interrupted",
  info: "Books and Brews",
};

export function AppState({
  title,
  description,
  variant = "info",
  actionLabel,
  onAction,
}: AppStateProps) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (variant !== "loading") {
      pulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.95,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [pulse, variant]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            transform: [{ scale: pulse }],
          },
        ]}
      >
        <LinearGradient
          colors={[colors.mocha, colors.surfaceSoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBand, { borderColor: colors.border }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}> 
            {variant === "loading" ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Feather name={ICON_BY_VARIANT[variant]} size={17} color={colors.accent} />
            )}
          </View>
          <Text style={[styles.eyebrow, { color: colors.crema }]}>{EYEBROW_BY_VARIANT[variant]}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          {description ? (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
          ) : null}
        </LinearGradient>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            style={({ pressed }) => [
              styles.action,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <Text style={[styles.actionText, { color: colors.primaryForeground }]}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: "center",
  },
  heroBand: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 24,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 16,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    textAlign: "center",
    marginTop: 10,
  },
  description: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 320,
  },
  action: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 18,
  },
  actionText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
});
