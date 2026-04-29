import { Feather } from "@expo/vector-icons";
import { useGetLeads } from "@workspace/api-client-react";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppState } from "@/components/AppState";
import { useColors } from "@/hooks/useColors";

type ClientSnapshot = {
  company: string;
  primaryContact: string;
  primaryEmail: string;
  pipelineValue: number;
  openOpportunities: number;
  wonProjects: number;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function ClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const leads = useGetLeads();

  const clients = useMemo(() => {
    const byCompany = new Map<string, ClientSnapshot>();

    for (const lead of leads.data ?? []) {
      const current = byCompany.get(lead.company) ?? {
        company: lead.company,
        primaryContact: lead.name,
        primaryEmail: lead.email,
        pipelineValue: 0,
        openOpportunities: 0,
        wonProjects: 0,
      };

      current.pipelineValue += lead.value;
      if (lead.status === "Won") {
        current.wonProjects += 1;
      } else {
        current.openOpportunities += 1;
      }

      byCompany.set(lead.company, current);
    }

    return [...byCompany.values()].sort((a, b) => b.pipelineValue - a.pipelineValue);
  }, [leads.data]);

  const wonProjects = clients.reduce((sum, item) => sum + item.wonProjects, 0);
  const openOpportunities = clients.reduce(
    (sum, item) => sum + item.openOpportunities,
    0,
  );

  if (leads.isLoading) {
    return <AppState title="Loading client accounts" variant="loading" />;
  }

  if (leads.isError) {
    return (
      <AppState
        title="Client account data unavailable"
        description="We could not sync account records right now."
        variant="error"
        actionLabel="Retry"
        onAction={() => leads.refetch()}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}> 
      <FlatList
        data={clients}
        keyExtractor={(item) => item.company}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 116 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={leads.isRefetching}
            onRefresh={() => leads.refetch()}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={[styles.eyebrow, { color: colors.crema }]}>Admin account desk</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Clients</Text>

            <View
              style={[
                styles.hero,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.heroTop}>
                <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}> 
                  <Feather name="briefcase" size={20} color={colors.accent} />
                </View>
                <Text style={[styles.heroBadge, { color: colors.crema }]}>Management preview</Text>
              </View>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>Client workspace registry</Text>
              <Text style={[styles.heroCopy, { color: colors.mutedForeground }]}>A live operational preview of account momentum based on active CRM records and won opportunities.</Text>

              <View style={styles.metricsRow}>
                <Metric label="Companies" value={`${clients.length}`} />
                <Metric label="Open" value={`${openOpportunities}`} />
                <Metric label="Won" value={`${wonProjects}`} />
              </View>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push("/leads");
                }}
                style={[styles.heroButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.heroButtonText, { color: colors.primaryForeground }]}>Manage in Leads</Text>
              </Pressable>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Directory preview</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <View
            style={[
              styles.clientCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.clientTop}>
              <View style={styles.clientIdentity}>
                <Text style={[styles.company, { color: colors.foreground }]}>{item.company}</Text>
                <Text style={[styles.contact, { color: colors.mutedForeground }]}>{item.primaryContact} · {item.primaryEmail}</Text>
              </View>
              <Text style={[styles.pipelineValue, { color: colors.crema }]}>{currency.format(item.pipelineValue)}</Text>
            </View>

            <View style={styles.badgeRow}>
              <Badge label={`${item.openOpportunities} open`} />
              <Badge label={`${item.wonProjects} won`} />
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={[styles.footerCard, { borderColor: colors.border }]}> 
            <Text style={[styles.footerTitle, { color: colors.foreground }]}>Next up</Text>
            <Text style={[styles.footerCopy, { color: colors.mutedForeground }]}>Dedicated client profiles, active projects, invoice health, and portal access controls will live here in a future release.</Text>
          </View>
        }
      />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.surfaceSoft }]}> 
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function Badge({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.badge, { backgroundColor: colors.surfaceSoft }]}> 
      <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>{label}</Text>
    </View>
  );
}

function EmptyState() {
  const colors = useColors();
  return (
    <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}> 
      <Feather name="users" size={24} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No client accounts yet</Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>As new leads arrive, this screen will map companies into your client directory preview.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingHorizontal: 18 },
  eyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    letterSpacing: -1.2,
    marginTop: 5,
  },
  hero: { borderWidth: 1, borderRadius: 28, padding: 18, marginTop: 16 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroIcon: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  heroBadge: { fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase" },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.7, marginTop: 14 },
  heroCopy: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, marginTop: 8 },
  metricsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  metricCard: { flex: 1, borderRadius: 18, paddingVertical: 11, paddingHorizontal: 10 },
  metricValue: { fontFamily: "Inter_700Bold", fontSize: 19 },
  metricLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginTop: 3 },
  heroButton: { minHeight: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 16 },
  heroButtonText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginTop: 24, marginBottom: 12, letterSpacing: -0.4 },
  clientCard: { borderWidth: 1, borderRadius: 24, padding: 16, marginBottom: 11 },
  clientTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  clientIdentity: { flex: 1 },
  company: { fontFamily: "Inter_700Bold", fontSize: 17 },
  contact: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4 },
  pipelineValue: { fontFamily: "Inter_700Bold", fontSize: 13 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  footerCard: { borderWidth: 1, borderRadius: 22, padding: 16, marginTop: 6 },
  footerTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  footerCopy: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 6 },
  empty: { alignItems: "center", borderWidth: 1, borderRadius: 24, padding: 24, marginTop: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginTop: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 6 },
});
