import { Feather } from "@expo/vector-icons";
import {
  useGetClientInvoices,
  useGetClientMessages,
  useGetClientNotifications,
  useGetClientProject,
} from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  placeholderInvoices,
  placeholderMessages,
  placeholderNotifications,
  placeholderProjectPayload,
} from "@/constants/client-portal-placeholders";
import { AppState } from "@/components/AppState";
import { useAuthSession } from "@/contexts/AuthSessionContext";
import { useColors } from "@/hooks/useColors";
import { formatDate } from "@/utils/client-portal";

export default function ClientHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const auth = useAuthSession();
  const fade = React.useRef(new Animated.Value(0)).current;

  const projectQuery = useGetClientProject();
  const messagesQuery = useGetClientMessages();
  const invoicesQuery = useGetClientInvoices();
  const notificationsQuery = useGetClientNotifications();

  const projectPayload =
    projectQuery.data ?? (projectQuery.isError ? placeholderProjectPayload : null);
  const messagesData = messagesQuery.data ?? (messagesQuery.isError ? placeholderMessages : []);
  const invoicesData = invoicesQuery.data ?? (invoicesQuery.isError ? placeholderInvoices : []);
  const notificationsData =
    notificationsQuery.data ?? (notificationsQuery.isError ? placeholderNotifications : []);

  const project = projectPayload?.project ?? null;
  const timelineData = projectPayload?.timeline ?? [];
  const unreadMessages = messagesData.filter((item) => !item.isRead).length;
  const unreadNotifications = notificationsData.filter((item) => item.isUnread).length;
  const pendingInvoices = invoicesData.filter((item) => item.status !== "Paid").length;
  const latestUpdate = timelineData[0] ?? null;
  const hasPortalContent =
    Boolean(project) ||
    messagesData.length > 0 ||
    invoicesData.length > 0 ||
    notificationsData.length > 0;
  const firstName = auth.user?.name.split(" ")[0] ?? "friend";

  const isRefreshing =
    projectQuery.isRefetching ||
    messagesQuery.isRefetching ||
    invoicesQuery.isRefetching ||
    notificationsQuery.isRefetching;

  const refresh = () => {
    Haptics.selectionAsync();
    projectQuery.refetch();
    messagesQuery.refetch();
    invoicesQuery.refetch();
    notificationsQuery.refetch();
  };

  React.useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  if (!projectPayload && projectQuery.isLoading) {
    return <AppState title="Preparing your client workspace" variant="loading" />;
  }

  if (!hasPortalContent && !projectQuery.isLoading) {
    return (
      <AppState
        title="Your portal is ready"
        description="Project details and shared records will appear once your studio publishes kickoff updates."
        variant="empty"
        actionLabel="Refresh"
        onAction={refresh}
      />
    );
  }

  const goto = (route: "/project" | "/messages" | "/activity" | "/invoices" | "/files" | "/support") => {
    Haptics.selectionAsync();
    router.push(route);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}> 
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ opacity: fade }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 106 },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <LinearGradient
          colors={[colors.mocha, colors.surfaceSoft, colors.background]}
          style={[styles.hero, { borderColor: colors.border }]}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.crema }]}>Books and Brews</Text>
              <Text style={[styles.heroKicker, { color: colors.mutedForeground }]}>Client portal</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                auth.logout();
              }}
              style={[styles.heroSignOut, { backgroundColor: colors.overlay, borderColor: colors.border }]}
            >
              <Feather name="log-out" size={14} color={colors.accent} />
              <Text style={[styles.heroSignOutText, { color: colors.foreground }]}>Sign out</Text>
            </Pressable>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Welcome back, {firstName}</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>A calm workspace for staying aligned with your studio on progress, billing, files, and next steps.</Text>
          <View style={styles.heroPills}>
            <View style={[styles.heroPill, { backgroundColor: colors.overlay, borderColor: colors.border }]}>
              <Text style={[styles.heroPillText, { color: colors.crema }]}>Clear updates</Text>
            </View>
            <View style={[styles.heroPill, { backgroundColor: colors.overlay, borderColor: colors.border }]}>
              <Text style={[styles.heroPillText, { color: colors.crema }]}>Fast support</Text>
            </View>
            <View style={[styles.heroPill, { backgroundColor: colors.overlay, borderColor: colors.border }]}>
              <Text style={[styles.heroPillText, { color: colors.crema }]}>Shared files</Text>
            </View>
          </View>

          {project ? (
            <View style={[styles.projectCard, { backgroundColor: colors.overlay, borderColor: colors.border }]}> 
              <View style={styles.projectTop}>
                <Text style={[styles.projectName, { color: colors.foreground }]}>{project.projectName}</Text>
                <Text style={[styles.projectStatus, { color: colors.crema }]}>{project.status}</Text>
              </View>
              <Text style={[styles.projectMeta, { color: colors.mutedForeground }]}>{project.phase}</Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceRaised }]}> 
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.min(100, Math.max(0, project.progressPercent))}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: colors.crema }]}>{project.progressPercent}% complete · Next: {project.nextMilestone}</Text>
            </View>
          ) : (
            <View style={[styles.projectCard, { backgroundColor: colors.overlay, borderColor: colors.border }]}> 
              <Text style={[styles.projectName, { color: colors.foreground }]}>No project posted yet</Text>
              <Text style={[styles.projectMeta, { color: colors.mutedForeground }]}>Your active project timeline will appear here as soon as kickoff details are published.</Text>
            </View>
          )}
        </LinearGradient>

        {projectQuery.isError ? (
          <View style={[styles.updateCard, { backgroundColor: colors.surfaceSoft, borderColor: colors.border, marginTop: 10 }]}> 
            <Text style={[styles.updateDescription, { color: colors.mutedForeground }]}>Live project sync is temporarily unavailable. Showing trusted preview data.</Text>
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24, marginBottom: 12 }]}>At a glance</Text>
        <View style={styles.metricsRow}>
          <MetricCard label="New activity" value={`${unreadNotifications}`} icon="bell" />
          <MetricCard label="Unread messages" value={`${unreadMessages}`} icon="mail" />
          <MetricCard label="Pending invoices" value={`${pendingInvoices}`} icon="credit-card" />
          <MetricCard
            label="Target date"
            value={project ? formatDate(project.targetDate) : "TBD"}
            icon="calendar"
            wide
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest update</Text>
        {latestUpdate ? (
          <View style={[styles.updateCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.updateTop}>
              <Text style={[styles.updateTitle, { color: colors.foreground }]}>{latestUpdate.title}</Text>
              <Text style={[styles.updateDate, { color: colors.crema }]}>{formatDate(latestUpdate.occurredAt)}</Text>
            </View>
            <Text style={[styles.updateDescription, { color: colors.mutedForeground }]}>{latestUpdate.description}</Text>
          </View>
        ) : (
          <View style={[styles.updateCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.updateDescription, { color: colors.mutedForeground }]}>No project updates have been posted yet. You will see milestone activity here once work begins.</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Portal sections</Text>
        <View style={styles.grid}>
          <PortalLink icon="briefcase" title="Project" subtitle="Progress and milestones" onPress={() => goto("/project")} />
          <PortalLink icon="message-square" title="Messages" subtitle="Studio communication" onPress={() => goto("/messages")} />
          <PortalLink icon="bell" title="Activity" subtitle="Notifications and alerts" onPress={() => goto("/activity")} />
          <PortalLink icon="credit-card" title="Invoices" subtitle="Billing and payments" onPress={() => goto("/invoices")} />
          <PortalLink icon="folder" title="Files" subtitle="Assets and deliverables" onPress={() => goto("/files")} />
          <PortalLink icon="life-buoy" title="Support" subtitle="Help and service desk" onPress={() => goto("/support")} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

function MetricCard({
  label,
  value,
  icon,
  wide,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  wide?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.metricCard,
        wide ? styles.metricCardWide : null,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    > 
      <Feather name={icon} size={16} color={colors.accent} />
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function PortalLink({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.portalLink,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.portalLinkTop}>
        <Feather name={icon} size={18} color={colors.accent} />
        <Feather name="arrow-up-right" size={16} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.portalLinkTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.portalLinkSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18 },
  hero: { borderWidth: 1, borderRadius: 32, padding: 20 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  heroKicker: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 3 },
  heroSignOut: {
    borderWidth: 1,
    borderRadius: 999,
    minHeight: 30,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  heroSignOutText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  title: { fontFamily: "Inter_700Bold", fontSize: 32, letterSpacing: -1.1, marginTop: 6 },
  copy: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, marginTop: 12 },
  heroPills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  heroPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  heroPillText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  projectCard: { borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 16 },
  projectTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  projectName: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 15 },
  projectStatus: { fontFamily: "Inter_700Bold", fontSize: 11 },
  projectMeta: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4 },
  progressTrack: { height: 8, borderRadius: 999, marginTop: 10, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  progressLabel: { fontFamily: "Inter_700Bold", fontSize: 11, marginTop: 7 },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: { width: "48%", borderWidth: 1, borderRadius: 20, padding: 13, minHeight: 96 },
  metricCardWide: { width: "100%" },
  metricValue: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 10 },
  metricLabel: { fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 4 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 28, marginBottom: 12, letterSpacing: -0.4 },
  updateCard: { borderWidth: 1, borderRadius: 22, padding: 14 },
  updateTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  updateTitle: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 15 },
  updateDate: { fontFamily: "Inter_700Bold", fontSize: 11 },
  updateDescription: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  portalLink: { width: "48%", borderWidth: 1, borderRadius: 22, padding: 14, minHeight: 110 },
  portalLinkTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  portalLinkTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginTop: 10 },
  portalLinkSubtitle: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4 },
});
