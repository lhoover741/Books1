import { Feather } from "@expo/vector-icons";
import { useGetDashboard, useGetLeads } from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
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

import { AppState } from "@/components/AppState";
import { useAuthSession } from "@/contexts/AuthSessionContext";
import { useColors } from "@/hooks/useColors";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function DashboardScreen() {
  const colors = useColors();
  const auth = useAuthSession();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const dashboard = useGetDashboard();
  const leads = useGetLeads();
  const isRefreshing = dashboard.isRefetching || leads.isRefetching;
  const isLoading = dashboard.isLoading || leads.isLoading;
  const hasError = dashboard.isError || leads.isError;

  const sortedLeads = useMemo(
    () => [...(leads.data ?? [])].sort((a, b) => b.value - a.value),
    [leads.data],
  );
  const hotLeads = sortedLeads.filter((lead) => lead.priority === "High").slice(0, 3);
  const quotes = (leads.data ?? []).filter((lead) => lead.source === "Quote Request");
  const contacts = (leads.data ?? []).filter((lead) => lead.source === "Contact Inquiry");
  const activeLeads = dashboard.data?.activeLeads ?? 0;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const refresh = () => {
    Haptics.selectionAsync();
    dashboard.refetch();
    leads.refetch();
  };

  if (isLoading) {
    return <AppState title="Preparing your CRM cockpit" variant="loading" />;
  }

  if (hasError) {
    return (
      <AppState
        title="Live lead feed unavailable"
        description="We could not refresh your latest CRM data."
        variant="error"
        actionLabel="Retry"
        onAction={refresh}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}> 
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 116 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        <Animated.View style={{ opacity: fade }}>
          <LinearGradient
            colors={[colors.mocha, colors.surfaceSoft, colors.background]}
            style={[styles.hero, { borderColor: colors.border }]}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroTitleBlock}>
                <Text style={[styles.eyebrow, { color: colors.crema }]}>Books and Brews CRM</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>Admin overview</Text>
              </View>
              <Pressable
                onPress={() => auth.logout()}
                style={[styles.iconButton, { backgroundColor: colors.overlay }]}
              >
                <Feather name="log-out" size={17} color={colors.accent} />
              </Pressable>
            </View>
            <Text style={[styles.heroCopy, { color: colors.mutedForeground }]}>A dense command center for lead health, quote momentum, contact quality, and client handoff decisions.</Text>
            <View style={styles.signalRow}>
              <SignalChip label={`${activeLeads} active`} tone="primary" />
              <SignalChip label={`${quotes.length} quote requests`} tone="warning" />
              <SignalChip label={`${contacts.length} contacts`} tone="info" />
            </View>
            <View style={styles.kpiGrid}>
              <KpiCard label="Pipeline value" value={currency.format(dashboard.data?.pipelineValue ?? 0)} icon="trending-up" accent="crema" />
              <KpiCard label="Active leads" value={`${dashboard.data?.activeLeads ?? 0}`} icon="briefcase" accent="primary" />
              <KpiCard label="Quote queue" value={`${quotes.length}`} icon="file-text" accent="warning" />
              <KpiCard label="Contacts" value={`${contacts.length}`} icon="inbox" accent="info" />
            </View>
          </LinearGradient>

          <View style={styles.quickNav}>
            <QuickRoute icon="users" label="Leads" detail="Full pipeline" route="/leads" />
            <QuickRoute icon="file-text" label="Quotes" detail="Scope requests" route="/quotes" />
            <QuickRoute icon="phone-call" label="Contacts" detail="Contact forms" route="/contacts" />
            <QuickRoute icon="briefcase" label="Clients" detail="Account hub" route="/clients" />
          </View>

          <SectionHeader title="Highest-value opportunities" action="Manage" onPress={() => router.push("/leads")} />
          {hotLeads.length > 0 ? (
            hotLeads.map((lead) => (
              <Pressable
                key={lead.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: "/leads/[id]", params: { id: lead.id } });
                }}
                style={({ pressed }) => [
                  styles.leadCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.84 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  },
                ]}
              >
                <View style={styles.leadHeader}>
                  <View style={styles.leadIdentity}>
                    <Text style={[styles.leadName, { color: colors.foreground }]}>{lead.name}</Text>
                    <Text style={[styles.leadCompany, { color: colors.mutedForeground }]}>{lead.company}</Text>
                  </View>
                  <StatusPill status={lead.status} />
                </View>
                <Text style={[styles.projectType, { color: colors.cardForeground }]}>{lead.projectType}</Text>
                <View style={styles.leadFooter}>
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>{lead.followUpDate} · {lead.budget}</Text>
                  <Text style={[styles.value, { color: colors.accent }]}>{currency.format(lead.value)}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={[styles.activityCard, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}> 
              <Text style={[styles.activityLabel, { color: colors.foreground }]}>No high-priority opportunities right now</Text>
              <Text style={[styles.activityMeta, { color: colors.mutedForeground, marginTop: 6 }]}>Your high-value queue is clear. Review the full lead pipeline to triage fresh activity.</Text>
            </View>
          )}

          <SectionHeader title="Recent activity" />
          <View style={[styles.activityCard, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}> 
            {(dashboard.data?.recentActivity ?? []).map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.activityRow,
                  index > 0 ? { borderTopColor: colors.border, borderTopWidth: 1 } : null,
                ]}
              >
                <View style={[styles.activityIcon, { backgroundColor: colors.secondary }]}> 
                  <Feather name="zap" size={14} color={colors.accent} />
                </View>
                <View style={styles.activityText}>
                  <Text style={[styles.activityLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.activityMeta, { color: colors.mutedForeground }]}>{item.leadName} · {item.timestamp}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function KpiCard({ label, value, icon, accent }: { label: string; value: string; icon: keyof typeof Feather.glyphMap; accent: "crema" | "primary" | "warning" | "info" }) {
  const colors = useColors();
  return (
    <View style={[styles.kpiCard, { backgroundColor: colors.overlay, borderColor: colors.border }]}> 
      <View style={styles.kpiTop}>
        <Feather name={icon} size={17} color={colors[accent]} />
        <Text style={[styles.kpiTrend, { color: colors.success }]}>Live</Text>
      </View>
      <Text style={[styles.kpiValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function QuickRoute({ icon, label, detail, route }: { icon: keyof typeof Feather.glyphMap; label: string; detail: string; route: "/leads" | "/quotes" | "/contacts" | "/clients" }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        router.push(route);
      }}
      style={({ pressed }) => [
        styles.quickRoute,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.quickRouteTop}>
        <Feather name={icon} size={18} color={colors.accent} />
        <Feather name="arrow-up-right" size={15} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.quickLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.quickDetail, { color: colors.mutedForeground }]}>{detail}</Text>
    </Pressable>
  );
}

function SignalChip({ label, tone }: { label: string; tone: "primary" | "warning" | "info" }) {
  const colors = useColors();
  return (
    <View style={[styles.signalChip, { backgroundColor: colors.overlay, borderColor: colors.border }]}> 
      <Text style={[styles.signalText, { color: colors[tone] }]}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onPress} hitSlop={12}>
          <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statusPill, { backgroundColor: colors.secondary }]}> 
      <Text style={[styles.statusText, { color: colors.accent }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 18 },
  hero: { borderWidth: 1, borderRadius: 32, padding: 20 },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
  heroTitleBlock: { flex: 1 },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  title: { fontFamily: "Inter_700Bold", fontSize: 34, letterSpacing: -1.2, marginTop: 5 },
  iconButton: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  heroCopy: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 23, marginTop: 16 },
  signalRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  signalChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  signalText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 },
  kpiCard: { width: "48%", borderWidth: 1, borderRadius: 22, padding: 14 },
  kpiTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kpiTrend: { fontFamily: "Inter_700Bold", fontSize: 10, textTransform: "uppercase" },
  kpiValue: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 12, letterSpacing: -0.5 },
  kpiLabel: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4 },
  quickNav: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 14 },
  quickRoute: { width: "48%", borderWidth: 1, borderRadius: 22, padding: 12, minHeight: 98 },
  quickRouteTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  quickLabel: { fontFamily: "Inter_700Bold", fontSize: 14, marginTop: 10 },
  quickDetail: { fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 3 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: -0.4 },
  sectionAction: { fontFamily: "Inter_700Bold", fontSize: 13 },
  leadCard: { borderWidth: 1, borderRadius: 24, padding: 16, marginBottom: 12 },
  leadHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  leadIdentity: { flex: 1 },
  leadName: { fontFamily: "Inter_700Bold", fontSize: 17 },
  leadCompany: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 3 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, alignSelf: "flex-start" },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  projectType: { fontFamily: "Inter_600SemiBold", fontSize: 15, lineHeight: 21, marginTop: 15 },
  leadFooter: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 16 },
  meta: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12 },
  value: { fontFamily: "Inter_700Bold", fontSize: 13 },
  activityCard: { borderWidth: 1, borderRadius: 24, paddingHorizontal: 16, overflow: "hidden" },
  activityRow: { flexDirection: "row", gap: 12, paddingVertical: 15 },
  activityIcon: { width: 32, height: 32, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  activityText: { flex: 1 },
  activityLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  activityMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
});
