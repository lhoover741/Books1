import { Feather } from "@expo/vector-icons";
import { LeadStatus, useGetLeads } from "@workspace/api-client-react";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const statuses: Array<LeadStatus | "All"> = [
  "All",
  "New",
  "Contacted",
  "Qualified",
  "Quote Sent",
  "Won",
  "Nurture",
];
const budgets = ["All", "Under $8k", "$8k-$14k", "$15k+"] as const;
const sortOptions = ["Value", "Follow-up", "Newest"] as const;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function LeadsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const leads = useGetLeads();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | "All">("All");
  const [budget, setBudget] = useState<(typeof budgets)[number]>("All");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]>("Value");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = (leads.data ?? []).filter((lead) => {
      const matchesStatus = status === "All" || lead.status === status;
      const matchesQuery =
        normalized.length === 0 ||
        lead.name.toLowerCase().includes(normalized) ||
        lead.company.toLowerCase().includes(normalized) ||
        lead.projectType.toLowerCase().includes(normalized) ||
        lead.source.toLowerCase().includes(normalized);
      const matchesBudget =
        budget === "All" ||
        (budget === "Under $8k" && lead.value < 8000) ||
        (budget === "$8k-$14k" && lead.value >= 8000 && lead.value < 15000) ||
        (budget === "$15k+" && lead.value >= 15000);
      return matchesStatus && matchesQuery && matchesBudget;
    });

    return rows.sort((a, b) => {
      if (sortBy === "Value") return b.value - a.value;
      if (sortBy === "Newest") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      return a.followUpDate.localeCompare(b.followUpDate);
    });
  }, [budget, leads.data, query, sortBy, status]);

  const openLead = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/leads/[id]", params: { id } });
  };

  if (leads.isLoading) return <State label="Loading lead pipeline" />;

  if (leads.isError) {
    return <State label="Lead data is unavailable." actionLabel="Retry" onAction={() => leads.refetch()} />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 18 }]}> 
        <Text style={[styles.eyebrow, { color: colors.crema }]}>Advanced CRM</Text>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Leads</Text>
          <View style={[styles.countPill, { backgroundColor: colors.secondary }]}> 
            <Text style={[styles.countText, { color: colors.accent }]}>{filtered.length} shown</Text>
          </View>
        </View>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}> 
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search client, company, source, or project"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 116 }]}
        refreshControl={<RefreshControl refreshing={leads.isRefetching} onRefresh={() => leads.refetch()} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            <FilterRail title="Status" data={statuses} value={status} onChange={setStatus} />
            <FilterRail title="Budget" data={[...budgets]} value={budget} onChange={setBudget} />
            <FilterRail title="Sort" data={[...sortOptions]} value={sortBy} onChange={setSortBy} />
          </View>
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openLead(item.id)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.82 : 1,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              },
            ]}
          >
            <View style={styles.cardTop}>
              <View style={styles.cardIdentity}>
                <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.company, { color: colors.mutedForeground }]}>{item.company}</Text>
              </View>
              <View style={[styles.priority, { borderColor: colors.border, backgroundColor: item.priority === "High" ? colors.secondary : "transparent" }]}> 
                <Text style={[styles.priorityText, { color: item.priority === "High" ? colors.crema : colors.mutedForeground }]}>{item.priority}</Text>
              </View>
            </View>
            <Text style={[styles.project, { color: colors.cardForeground }]}>{item.projectType}</Text>
            <View style={styles.pipelineRow}>
              <MiniBadge label={item.status} />
              <MiniBadge label={item.source} />
              <MiniBadge label={item.budget} />
            </View>
            <View style={styles.cardMeta}>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Follow up {item.followUpDate}</Text>
              <Text style={[styles.value, { color: colors.crema }]}>{currency.format(item.value)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function FilterRail<T extends string>({ title, data, value, onChange }: { title: string; data: T[]; value: T; onChange: (value: T) => void }) {
  const colors = useColors();
  return (
    <View style={styles.filterBlock}>
      <Text style={[styles.filterTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const active = item === value;
          return (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                onChange(item);
              }}
              style={[styles.filterChip, { backgroundColor: active ? colors.primary : colors.surfaceRaised, borderColor: active ? colors.primary : colors.border }]}
            >
              <Text style={[styles.filterText, { color: active ? colors.primaryForeground : colors.secondaryForeground }]}>{item}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function MiniBadge({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.miniBadge, { backgroundColor: colors.surfaceSoft }]}> 
      <Text style={[styles.miniBadgeText, { color: colors.secondaryForeground }]}>{label}</Text>
    </View>
  );
}

function EmptyState() {
  const colors = useColors();
  return (
    <View style={[styles.empty, { borderColor: colors.border }]}> 
      <Feather name="filter" size={24} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matching leads</Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Adjust search, status, budget, or sorting to broaden the pipeline view.</Text>
    </View>
  );
}

function State({ label, actionLabel, onAction }: { label: string; actionLabel?: string; onAction?: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.state, { backgroundColor: colors.background }]}> 
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.stateText, { color: colors.mutedForeground }]}>{label}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} style={[styles.stateButton, { backgroundColor: colors.primary }]}> 
          <Text style={[styles.stateButtonText, { color: colors.primaryForeground }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 18 },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 5 },
  title: { fontFamily: "Inter_700Bold", fontSize: 36, letterSpacing: -1.2 },
  countPill: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  countText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  searchBox: { borderWidth: 1, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, height: 50, marginTop: 16 },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14 },
  listContent: { paddingHorizontal: 18, paddingTop: 14 },
  filterBlock: { marginBottom: 11 },
  filterTitle: { fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 8 },
  filterRow: { gap: 9, paddingRight: 18 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8 },
  filterText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  card: { borderWidth: 1, borderRadius: 25, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 14 },
  cardIdentity: { flex: 1 },
  name: { fontFamily: "Inter_700Bold", fontSize: 18 },
  company: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 4 },
  priority: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, alignSelf: "flex-start" },
  priorityText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  project: { fontFamily: "Inter_600SemiBold", fontSize: 15, lineHeight: 21, marginTop: 16 },
  pipelineRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  miniBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  miniBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  cardMeta: { flexDirection: "row", justifyContent: "space-between", gap: 16, marginTop: 16 },
  meta: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12 },
  value: { fontFamily: "Inter_700Bold", fontSize: 13 },
  empty: { alignItems: "center", borderWidth: 1, borderRadius: 24, padding: 24, marginTop: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginTop: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 6 },
  state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  stateText: { fontFamily: "Inter_600SemiBold", fontSize: 15, textAlign: "center" },
  stateButton: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  stateButtonText: { fontFamily: "Inter_700Bold", fontSize: 14 },
});
