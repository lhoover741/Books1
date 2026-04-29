import { Feather } from "@expo/vector-icons";
import {
  useGetClientProject,
} from "@workspace/api-client-react";
import React from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  placeholderProjectPayload,
} from "@/constants/client-portal-placeholders";
import { AppState } from "@/components/AppState";
import { useColors } from "@/hooks/useColors";
import { formatDate } from "@/utils/client-portal";

export default function ClientProjectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const projectQuery = useGetClientProject();

  const payload = projectQuery.data ?? (projectQuery.isError ? placeholderProjectPayload : null);
  const project = payload?.project ?? null;
  const timelineData = payload?.timeline ?? [];
  const isUsingFallback = projectQuery.isError;
  const isRefreshing = projectQuery.isRefetching;

  const refresh = () => {
    Haptics.selectionAsync();
    projectQuery.refetch();
  };

  if (!payload && projectQuery.isLoading) {
    return <AppState title="Loading project workspace" variant="loading" />;
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
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <Text style={[styles.eyebrow, { color: colors.crema }]}>Project center</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Project</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Track delivery progress, timeline milestones, and launch readiness in one focused view.</Text>

        <View style={styles.chipsRow}>
          <View style={[styles.chip, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
            <Text style={[styles.chipText, { color: colors.crema }]}>Milestones</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
            <Text style={[styles.chipText, { color: colors.crema }]}>Timeline</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
            <Text style={[styles.chipText, { color: colors.crema }]}>Delivery status</Text>
          </View>
        </View>

        {isUsingFallback ? (
          <View style={[styles.notice, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}> 
            <Feather name="wifi-off" size={16} color={colors.warning} />
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>Showing trusted placeholder project data while live sync reconnects.</Text>
          </View>
        ) : null}

        {project ? (
          <View style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.cardTop}>
              <Text style={[styles.projectName, { color: colors.foreground }]}>{project.projectName}</Text>
              <View style={[styles.statusPill, { backgroundColor: colors.secondary }]}> 
                <Text style={[styles.statusText, { color: colors.accent }]}>{project.status}</Text>
              </View>
            </View>
            <Text style={[styles.phaseText, { color: colors.mutedForeground }]}>{project.phase}</Text>

            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSoft }]}> 
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
            <Text style={[styles.progressMeta, { color: colors.crema }]}>{project.progressPercent}% complete</Text>

            <View style={styles.metaRow}>
              <InfoRow icon="flag" label="Next milestone" value={project.nextMilestone} />
              <InfoRow icon="calendar" label="Target date" value={formatDate(project.targetDate)} />
            </View>
          </View>
        ) : (
          <View style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.projectName, { color: colors.foreground }]}>Project details coming soon</Text>
            <Text style={[styles.phaseText, { color: colors.mutedForeground }]}>As soon as your project kickoff is finalized, status, milestones, and timeline updates will appear here.</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Timeline</Text>
        {timelineData.length > 0 ? (
          timelineData.map((item, index) => (
            <View key={item.id} style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: index === 0 ? 0 : 10 }]}> 
              <View style={styles.timelineTop}>
                <Text style={[styles.timelineTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.timelineDate, { color: colors.crema }]}>{formatDate(item.occurredAt)}</Text>
              </View>
              <Text style={[styles.timelineDescription, { color: colors.mutedForeground }]}>{item.description}</Text>
              <Text style={[styles.timelineType, { color: colors.secondaryForeground }]}>{item.type}</Text>
            </View>
          ))
        ) : (
          <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.timelineDescription, { color: colors.mutedForeground }]}>No timeline updates have been posted yet. Your milestones will appear here as work progresses.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.surfaceSoft }]}> 
        <Feather name={icon} size={14} color={colors.accent} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18 },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  title: { fontFamily: "Inter_700Bold", fontSize: 35, letterSpacing: -1.2, marginTop: 5 },
  copy: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, marginTop: 12 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  chipText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  notice: { borderWidth: 1, borderRadius: 16, padding: 11, marginTop: 14, flexDirection: "row", gap: 8, alignItems: "center" },
  noticeText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12 },
  projectCard: { borderWidth: 1, borderRadius: 24, padding: 15, marginTop: 14 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "center" },
  projectName: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 17 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  phaseText: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 4 },
  progressTrack: { height: 9, borderRadius: 999, marginTop: 12, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  progressMeta: { fontFamily: "Inter_700Bold", fontSize: 11, marginTop: 7 },
  metaRow: { marginTop: 14, gap: 10 },
  infoRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  infoIcon: { width: 30, height: 30, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  infoCopy: { flex: 1 },
  infoLabel: { fontFamily: "Inter_500Medium", fontSize: 11 },
  infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 1 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 24, marginBottom: 12, letterSpacing: -0.4 },
  timelineCard: { borderWidth: 1, borderRadius: 22, padding: 14 },
  timelineTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  timelineTitle: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 15 },
  timelineDate: { fontFamily: "Inter_700Bold", fontSize: 11 },
  timelineDescription: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 5 },
  timelineType: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginTop: 7 },
});
