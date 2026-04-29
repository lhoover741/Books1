import { Feather } from "@expo/vector-icons";
import {
  type ClientNotification,
  useGetClientNotifications,
} from "@workspace/api-client-react";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppState } from "@/components/AppState";
import { placeholderNotifications } from "@/constants/client-portal-placeholders";
import { useColors } from "@/hooks/useColors";
import { formatDate } from "@/utils/client-portal";

const notificationIcons: Record<ClientNotification["type"], keyof typeof Feather.glyphMap> = {
  project: "briefcase",
  message: "message-square",
  invoice: "credit-card",
  file: "folder",
  support: "life-buoy",
};

const notificationRoutes: Record<ClientNotification["type"], "/project" | "/messages" | "/invoices" | "/files" | "/support"> = {
  project: "/project",
  message: "/messages",
  invoice: "/invoices",
  file: "/files",
  support: "/support",
};

export default function ClientActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const notificationsQuery = useGetClientNotifications();
  const notifications =
    notificationsQuery.data ??
    (notificationsQuery.isError ? placeholderNotifications : []);
  const unreadCount = notifications.filter((item) => item.isUnread).length;

  const refresh = () => {
    Haptics.selectionAsync();
    notificationsQuery.refetch();
  };

  if (!notificationsQuery.data && notificationsQuery.isLoading) {
    return <AppState title="Loading activity feed" variant="loading" />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 106 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={notificationsQuery.isRefetching}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.eyebrow, { color: colors.crema }]}>Client activity</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          A single feed for project updates, messages, invoices, files, and support progress.
        </Text>

        {notificationsQuery.isError ? (
          <View style={[styles.notice, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
            <Feather name="wifi-off" size={16} color={colors.warning} />
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
              Live notifications are temporarily unavailable. Showing trusted preview activity.
            </Text>
          </View>
        ) : null}

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="bell" size={19} color={colors.accent} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
              {unreadCount} new {unreadCount === 1 ? "item" : "items"}
            </Text>
            <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
              Pull down to refresh the latest client portal events.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent activity</Text>
        {notifications.length > 0 ? (
          notifications.map((item, index) => (
            <ActivityCard key={item.id} item={item} isFirst={index === 0} />
          ))
        ) : (
          <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.activityDescription, { color: colors.mutedForeground }]}>
              No activity yet. Notifications will appear here as your project workspace changes.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ActivityCard({
  item,
  isFirst,
}: {
  item: ClientNotification;
  isFirst: boolean;
}) {
  const colors = useColors();
  const icon = notificationIcons[item.type];

  const openRelatedSection = () => {
    Haptics.selectionAsync();
    router.push(notificationRoutes[item.type]);
  };

  return (
    <Pressable
      onPress={openRelatedSection}
      style={({ pressed }) => [
        styles.activityCard,
        {
          backgroundColor: colors.card,
          borderColor: item.isUnread ? colors.primary : colors.border,
          marginTop: isFirst ? 0 : 10,
          opacity: pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.activityTop}>
        <View style={[styles.activityIcon, { backgroundColor: colors.secondary }]}>
          <Feather name={icon} size={16} color={colors.accent} />
        </View>
        <View style={styles.activityCopy}>
          <View style={styles.activityTitleRow}>
            <Text style={[styles.activityTitle, { color: colors.foreground }]}>{item.title}</Text>
            {item.isUnread ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
          </View>
          <Text style={[styles.activityDescription, { color: colors.mutedForeground }]}>
            {item.description}
          </Text>
          <View style={styles.activityFooter}>
            <Text style={[styles.activityMeta, { color: colors.secondaryForeground }]}>
              {formatDate(item.occurredAt)}
            </Text>
            <Text style={[styles.activityAction, { color: colors.crema }]}>{item.actionLabel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18 },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  title: { fontFamily: "Inter_700Bold", fontSize: 35, letterSpacing: -1.2, marginTop: 5 },
  copy: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, marginTop: 12 },
  notice: { borderWidth: 1, borderRadius: 16, padding: 11, marginTop: 14, flexDirection: "row", gap: 8, alignItems: "center" },
  noticeText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12 },
  summaryCard: { borderWidth: 1, borderRadius: 24, padding: 14, marginTop: 16, flexDirection: "row", gap: 10 },
  summaryIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  summaryCopy: { flex: 1 },
  summaryTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  summaryText: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4, lineHeight: 18 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 24, marginBottom: 12, letterSpacing: -0.4 },
  activityCard: { borderWidth: 1, borderRadius: 22, padding: 14 },
  activityTop: { flexDirection: "row", gap: 11, alignItems: "flex-start" },
  activityIcon: { width: 34, height: 34, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  activityCopy: { flex: 1 },
  activityTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  activityTitle: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 15 },
  unreadDot: { width: 9, height: 9, borderRadius: 999 },
  activityDescription: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 5 },
  activityFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 9 },
  activityMeta: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  activityAction: { fontFamily: "Inter_700Bold", fontSize: 11 },
});