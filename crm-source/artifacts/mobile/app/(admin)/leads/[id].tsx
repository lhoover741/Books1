import { Feather } from "@expo/vector-icons";
import {
  getGetDashboardQueryKey,
  getGetLeadQueryKey,
  getGetLeadsQueryKey,
  LeadStatus,
  useGetLead,
  useUpdateLead,
} from "@workspace/api-client-react";
import { useLocalSearchParams, router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const statuses: LeadStatus[] = ["New", "Contacted", "Qualified", "Quote Sent", "Won", "Nurture"];
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function LeadDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const leadQuery = useGetLead(id);
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const updateLead = useUpdateLead({
    mutation: {
      onSuccess: (lead) => {
        queryClient.setQueryData(getGetLeadQueryKey(lead.id), lead);
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      },
    },
  });

  useEffect(() => {
    if (leadQuery.data) {
      setNotes(leadQuery.data.notes);
      setNextStep(leadQuery.data.nextStep);
      setFollowUpDate(leadQuery.data.followUpDate);
    }
  }, [leadQuery.data]);

  const selectedStatus = leadQuery.data?.status;
  const canSave = useMemo(() => {
    if (!leadQuery.data) return false;
    return notes.trim() !== leadQuery.data.notes || nextStep.trim() !== leadQuery.data.nextStep || followUpDate.trim() !== leadQuery.data.followUpDate;
  }, [followUpDate, leadQuery.data, nextStep, notes]);

  const changeStatus = (status: LeadStatus) => {
    if (!id || status === selectedStatus) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateLead.mutate({ leadId: id, data: { status } });
  };

  const saveNotes = () => {
    if (!id || !canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateLead.mutate({ leadId: id, data: { notes: notes.trim(), nextStep: nextStep.trim(), followUpDate: followUpDate.trim() } });
  };

  if (leadQuery.isLoading) return <State label="Opening lead dossier" />;

  if (leadQuery.isError || !leadQuery.data) {
    return <State label="This lead could not be loaded." actionLabel="Back to leads" onAction={() => router.back()} />;
  }

  const lead = leadQuery.data;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}> 
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: 18, paddingBottom: insets.bottom + 34 }]}> 
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.profileTop}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}> 
              <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{lead.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</Text>
            </View>
            <View style={styles.profileIdentity}>
              <Text style={[styles.name, { color: colors.foreground }]}>{lead.name}</Text>
              <Text style={[styles.company, { color: colors.mutedForeground }]}>{lead.company}</Text>
            </View>
          </View>
          <Text style={[styles.project, { color: colors.cardForeground }]}>{lead.projectType}</Text>
          <View style={styles.valueRow}>
            <InfoPill icon="coffee" label={lead.source} />
            <InfoPill icon="dollar-sign" label={currency.format(lead.value)} />
            <InfoPill icon="calendar" label={lead.followUpDate} />
          </View>
          <View style={styles.quickActions}>
            <QuickAction icon="mail" label="Email" onPress={() => Linking.openURL(`mailto:${lead.email}`)} />
            <QuickAction icon="phone" label="Call" onPress={() => Linking.openURL(`tel:${lead.phone}`)} />
            <QuickAction icon="file-text" label="Quote" onPress={() => changeStatus("Quote Sent")} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Status flow</Text>
          <View style={[styles.statusPanel, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}> 
            {statuses.map((status, index) => {
              const active = status === selectedStatus;
              return (
                <Pressable key={status} onPress={() => changeStatus(status)} disabled={updateLead.isPending} style={styles.statusStep}>
                  <View style={[styles.statusNode, { backgroundColor: active ? colors.primary : colors.surfaceRaised, borderColor: active ? colors.primary : colors.border }]}> 
                    <Text style={[styles.statusNodeText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.statusStepText, { color: active ? colors.accent : colors.secondaryForeground }]}>{status}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.detailCard, { borderColor: colors.border }]}> 
          <DetailRow icon="mail" label="Email" value={lead.email} />
          <DetailRow icon="phone" label="Phone" value={lead.phone} />
          <DetailRow icon="clock" label="Timeline" value={lead.timeline} />
          <DetailRow icon="calendar" label="Last contact" value={lead.lastContact} />
          <DetailRow icon="briefcase" label="Budget" value={lead.budget} />
        </View>

        <EditableBlock title="Follow-up date" value={followUpDate} onChangeText={setFollowUpDate} placeholder="Set the next follow-up date" compact />
        <EditableBlock title="Next action" value={nextStep} onChangeText={setNextStep} placeholder="Define the next best step" />
        <EditableBlock title="Internal notes" value={notes} onChangeText={setNotes} placeholder="Add client context, scope details, or quote notes" large />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Timeline</Text>
          <View style={[styles.timelineCard, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}> 
            {lead.activityTimeline.map((item, index) => (
              <View key={item.id} style={[styles.timelineRow, index > 0 ? { borderTopColor: colors.border, borderTopWidth: 1 } : null]}>
                <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                <View style={styles.timelineCopy}>
                  <Text style={[styles.timelineTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.timelineDescription, { color: colors.mutedForeground }]}>{item.description}</Text>
                  <Text style={[styles.timelineTime, { color: colors.crema }]}>{item.timestamp}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Pressable onPress={saveNotes} disabled={!canSave || updateLead.isPending} style={[styles.saveButton, { backgroundColor: canSave ? colors.primary : colors.secondary, opacity: updateLead.isPending ? 0.74 : 1 }]}> 
          {updateLead.isPending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.saveButtonText, { color: canSave ? colors.primaryForeground : colors.mutedForeground }]}>Save dossier updates</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InfoPill({ icon, label }: { icon: keyof typeof Feather.glyphMap; label: string }) {
  const colors = useColors();
  return <View style={[styles.infoPill, { backgroundColor: colors.surfaceSoft }]}><Feather name={icon} size={15} color={colors.crema} /><Text style={[styles.infoPillText, { color: colors.secondaryForeground }]}>{label}</Text></View>;
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, { backgroundColor: colors.surfaceRaised, opacity: pressed ? 0.78 : 1 }]}><Feather name={icon} size={17} color={colors.accent} /><Text style={[styles.quickActionText, { color: colors.foreground }]}>{label}</Text></Pressable>;
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  const colors = useColors();
  return <View style={styles.detailRow}><View style={[styles.detailIcon, { backgroundColor: colors.surfaceRaised }]}><Feather name={icon} size={16} color={colors.accent} /></View><View style={styles.detailCopy}><Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text></View></View>;
}

function EditableBlock({ title, value, onChangeText, placeholder, compact, large }: { title: string; value: string; onChangeText: (value: string) => void; placeholder: string; compact?: boolean; large?: boolean }) {
  const colors = useColors();
  return <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text><TextInput value={value} onChangeText={onChangeText} multiline={!compact} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} style={[styles.textArea, compact ? styles.compactArea : null, large ? styles.notesArea : null, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, color: colors.foreground }]} /></View>;
}

function State({ label, actionLabel, onAction }: { label: string; actionLabel?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={[styles.state, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /><Text style={[styles.stateText, { color: colors.mutedForeground }]}>{label}</Text>{actionLabel ? <Pressable onPress={onAction} style={[styles.stateButton, { backgroundColor: colors.primary }]}><Text style={[styles.stateButtonText, { color: colors.primaryForeground }]}>{actionLabel}</Text></Pressable> : null}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 18 }, profileCard: { borderWidth: 1, borderRadius: 30, padding: 18 }, profileTop: { flexDirection: "row", alignItems: "center", gap: 13 }, avatar: { width: 58, height: 58, borderRadius: 22, alignItems: "center", justifyContent: "center" }, avatarText: { fontFamily: "Inter_700Bold", fontSize: 18 }, profileIdentity: { flex: 1 }, name: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.7 }, company: { fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 4 }, project: { fontFamily: "Inter_600SemiBold", fontSize: 16, lineHeight: 23, marginTop: 18 }, valueRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 }, infoPill: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 }, infoPillText: { fontFamily: "Inter_700Bold", fontSize: 12 }, quickActions: { flexDirection: "row", gap: 10, marginTop: 16 }, quickAction: { flex: 1, minHeight: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 5 }, quickActionText: { fontFamily: "Inter_700Bold", fontSize: 12 }, section: { marginTop: 24 }, sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 19, letterSpacing: -0.4, marginBottom: 12 }, statusPanel: { borderWidth: 1, borderRadius: 26, padding: 12, gap: 8 }, statusStep: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 }, statusNode: { width: 30, height: 30, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" }, statusNodeText: { fontFamily: "Inter_700Bold", fontSize: 12 }, statusStepText: { fontFamily: "Inter_700Bold", fontSize: 14 }, detailCard: { borderWidth: 1, borderRadius: 26, padding: 16, marginTop: 24, gap: 15 }, detailRow: { flexDirection: "row", alignItems: "center", gap: 12 }, detailIcon: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center" }, detailCopy: { flex: 1 }, detailLabel: { fontFamily: "Inter_500Medium", fontSize: 12 }, detailValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginTop: 2 }, textArea: { borderWidth: 1, borderRadius: 22, minHeight: 96, padding: 15, fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20, textAlignVertical: "top" }, compactArea: { minHeight: 52, textAlignVertical: "center" }, notesArea: { minHeight: 132 }, timelineCard: { borderWidth: 1, borderRadius: 26, paddingHorizontal: 16, overflow: "hidden" }, timelineRow: { flexDirection: "row", gap: 12, paddingVertical: 15 }, timelineDot: { width: 10, height: 10, borderRadius: 999, marginTop: 4 }, timelineCopy: { flex: 1 }, timelineTitle: { fontFamily: "Inter_700Bold", fontSize: 14 }, timelineDescription: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 4 }, timelineTime: { fontFamily: "Inter_700Bold", fontSize: 11, marginTop: 6 }, saveButton: { alignItems: "center", justifyContent: "center", borderRadius: 22, minHeight: 56, marginTop: 22 }, saveButtonText: { fontFamily: "Inter_700Bold", fontSize: 15 }, state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 }, stateText: { fontFamily: "Inter_600SemiBold", fontSize: 15, textAlign: "center" }, stateButton: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 }, stateButtonText: { fontFamily: "Inter_700Bold", fontSize: 14 },
});
