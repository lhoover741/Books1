import { Feather } from "@expo/vector-icons";
import { useGetLeads } from "@workspace/api-client-react";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppState } from "@/components/AppState";
import { useColors } from "@/hooks/useColors";

export default function ContactsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const leads = useGetLeads();
  const contacts = useMemo(() => (leads.data ?? []).filter((lead) => lead.source === "Contact Inquiry").sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)), [leads.data]);
  const urgent = contacts.filter((lead) => lead.priority !== "Low").length;

  if (leads.isLoading) return <AppState title="Loading contact inquiries" variant="loading" />;
  if (leads.isError) return <AppState title="Contact inquiries unavailable" description="Live inquiry records could not be loaded." variant="error" actionLabel="Retry" onAction={() => leads.refetch()} />;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 18 }]}> 
        <Text style={[styles.eyebrow, { color: colors.crema }]}>Lead capture</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Contact inquiries</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Review fresh inbound inquiries, respond quickly, and route qualified contacts into the lead pipeline.</Text>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.summaryItem}><Text style={[styles.summaryValue, { color: colors.foreground }]}>{contacts.length}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Open inquiries</Text></View>
          <View style={styles.summaryItem}><Text style={[styles.summaryValue, { color: colors.foreground }]}>{urgent}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Need response</Text></View>
        </View>
      </View>
      <FlatList
        data={contacts}
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
            <View style={styles.cardTop}><View style={styles.identity}><Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.company, { color: colors.mutedForeground }]}>{item.company}</Text></View><View style={[styles.priority, { backgroundColor: item.priority === "Low" ? colors.surfaceSoft : colors.secondary }]}><Text style={[styles.priorityText, { color: item.priority === "Low" ? colors.mutedForeground : colors.accent }]}>{item.priority}</Text></View></View>
            <Text style={[styles.project, { color: colors.cardForeground }]}>{item.projectType}</Text>
            <Text style={[styles.note, { color: colors.mutedForeground }]}>{item.notes}</Text>
            <View style={styles.actions}>
              <Pressable onPress={() => Linking.openURL(`mailto:${item.email}`)} style={[styles.actionButton, { backgroundColor: colors.surfaceRaised }]}><Feather name="mail" size={15} color={colors.accent} /><Text style={[styles.actionText, { color: colors.foreground }]}>Email</Text></Pressable>
              <Pressable onPress={() => Linking.openURL(`tel:${item.phone}`)} style={[styles.actionButton, { backgroundColor: colors.surfaceRaised }]}><Feather name="phone" size={15} color={colors.accent} /><Text style={[styles.actionText, { color: colors.foreground }]}>Call</Text></Pressable>
              <View style={[styles.actionButton, { backgroundColor: colors.surfaceSoft }]}><Feather name="calendar" size={15} color={colors.crema} /><Text style={[styles.actionText, { color: colors.secondaryForeground }]}>{item.followUpDate}</Text></View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function EmptyState() { const colors = useColors(); return <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="inbox" size={24} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No contact inquiries</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>New website inquiries and warm intro requests will collect here.</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: 18 }, eyebrow: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }, title: { fontFamily: "Inter_700Bold", fontSize: 34, letterSpacing: -1.2, marginTop: 5 }, copy: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, marginTop: 12 }, summaryCard: { borderWidth: 1, borderRadius: 28, padding: 18, marginTop: 16, flexDirection: "row", gap: 12 }, summaryItem: { flex: 1 }, summaryValue: { fontFamily: "Inter_700Bold", fontSize: 30, letterSpacing: -1 }, summaryLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 3 }, listContent: { paddingHorizontal: 18, paddingTop: 16 }, card: { borderWidth: 1, borderRadius: 25, padding: 16, marginBottom: 12 }, cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, identity: { flex: 1 }, name: { fontFamily: "Inter_700Bold", fontSize: 18 }, company: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 4 }, priority: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, alignSelf: "flex-start" }, priorityText: { fontFamily: "Inter_700Bold", fontSize: 11 }, project: { fontFamily: "Inter_600SemiBold", fontSize: 15, lineHeight: 21, marginTop: 16 }, note: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 10 }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 15 }, actionButton: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 9 }, actionText: { fontFamily: "Inter_700Bold", fontSize: 12 }, empty: { alignItems: "center", borderWidth: 1, borderRadius: 24, padding: 24, marginTop: 10 }, emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginTop: 12 }, emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 6 },
});
