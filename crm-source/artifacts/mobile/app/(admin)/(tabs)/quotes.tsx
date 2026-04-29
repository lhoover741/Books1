import { Feather } from "@expo/vector-icons";
import { useGetLeads } from "@workspace/api-client-react";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function QuotesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const leads = useGetLeads();
  const quotes = useMemo(() => (leads.data ?? []).filter((lead) => lead.source === "Quote Request" || lead.status === "Quote Sent").sort((a, b) => b.value - a.value), [leads.data]);
  const total = quotes.reduce((sum, lead) => sum + lead.value, 0);

  if (leads.isLoading) return <State label="Loading quote requests" />;
  if (leads.isError) return <State label="Quote requests are unavailable." actionLabel="Retry" onAction={() => leads.refetch()} />;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 18 }]}> 
        <Text style={[styles.eyebrow, { color: colors.crema }]}>Revenue queue</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Quote requests</Text>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Open quote value</Text><Text style={[styles.summaryValue, { color: colors.foreground }]}>{currency.format(total)}</Text></View>
          <View style={[styles.summaryIcon, { backgroundColor: colors.secondary }]}><Feather name="file-text" size={20} color={colors.accent} /></View>
        </View>
      </View>
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 116 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={leads.isRefetching} onRefresh={() => leads.refetch()} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: "/leads/[id]", params: { id: item.id } }); }}
            style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.82 : 1 }]}
          >
            <View style={styles.cardTop}><View style={styles.identity}><Text style={[styles.name, { color: colors.foreground }]}>{item.company}</Text><Text style={[styles.person, { color: colors.mutedForeground }]}>{item.name} · {item.status}</Text></View><Text style={[styles.value, { color: colors.crema }]}>{currency.format(item.value)}</Text></View>
            <Text style={[styles.project, { color: colors.cardForeground }]}>{item.projectType}</Text>
            <View style={styles.detailRow}><Badge label={item.budget} /><Badge label={item.timeline} /><Badge label={item.followUpDate} /></View>
            <Text style={[styles.nextStep, { color: colors.mutedForeground }]}>{item.nextStep}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function Badge({ label }: { label: string }) { const colors = useColors(); return <View style={[styles.badge, { backgroundColor: colors.surfaceSoft }]}><Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>{label}</Text></View>; }
function EmptyState() { const colors = useColors(); return <View style={[styles.empty, { borderColor: colors.border }]}><Feather name="file" size={24} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No quote requests yet</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>New quote requests and sent proposals will collect here.</Text></View>; }
function State({ label, actionLabel, onAction }: { label: string; actionLabel?: string; onAction?: () => void }) { const colors = useColors(); return <View style={[styles.state, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /><Text style={[styles.stateText, { color: colors.mutedForeground }]}>{label}</Text>{actionLabel ? <Pressable onPress={onAction} style={[styles.stateButton, { backgroundColor: colors.primary }]}><Text style={[styles.stateButtonText, { color: colors.primaryForeground }]}>{actionLabel}</Text></Pressable> : null}</View>; }

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: 18 }, eyebrow: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }, title: { fontFamily: "Inter_700Bold", fontSize: 35, letterSpacing: -1.2, marginTop: 5 }, summaryCard: { borderWidth: 1, borderRadius: 28, padding: 18, marginTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, summaryLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 }, summaryValue: { fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.9, marginTop: 4 }, summaryIcon: { width: 48, height: 48, borderRadius: 18, alignItems: "center", justifyContent: "center" }, listContent: { paddingHorizontal: 18, paddingTop: 16 }, card: { borderWidth: 1, borderRadius: 25, padding: 16, marginBottom: 12 }, cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, identity: { flex: 1 }, name: { fontFamily: "Inter_700Bold", fontSize: 18 }, person: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 4 }, value: { fontFamily: "Inter_700Bold", fontSize: 14 }, project: { fontFamily: "Inter_600SemiBold", fontSize: 15, lineHeight: 21, marginTop: 16 }, detailRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }, badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 }, badgeText: { fontFamily: "Inter_700Bold", fontSize: 11 }, nextStep: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 19, marginTop: 14 }, empty: { alignItems: "center", borderWidth: 1, borderRadius: 24, padding: 24, marginTop: 10 }, emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginTop: 12 }, emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 6 }, state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 }, stateText: { fontFamily: "Inter_600SemiBold", fontSize: 15, textAlign: "center" }, stateButton: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 }, stateButtonText: { fontFamily: "Inter_700Bold", fontSize: 14 },
});
