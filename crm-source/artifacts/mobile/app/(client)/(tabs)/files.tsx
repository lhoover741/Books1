import { Feather } from "@expo/vector-icons";
import { useGetClientFiles } from "@workspace/api-client-react";
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

import { AppState } from "@/components/AppState";
import { placeholderFiles } from "@/constants/client-portal-placeholders";
import { useColors } from "@/hooks/useColors";
import { formatDate, formatFileSize } from "@/utils/client-portal";

export default function ClientFilesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const filesQuery = useGetClientFiles();

  const files = filesQuery.data ?? (filesQuery.isError ? placeholderFiles : []);

  const refresh = () => {
    Haptics.selectionAsync();
    filesQuery.refetch();
  };

  if (!filesQuery.data && filesQuery.isLoading) {
    return <AppState title="Loading shared files" variant="loading" />;
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
            refreshing={filesQuery.isRefetching}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.eyebrow, { color: colors.crema }]}>Document vault</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Files</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Access your signed documents, deliverables, and shared assets in one secure archive.</Text>

        {filesQuery.isError ? (
          <View style={[styles.fileCard, { backgroundColor: colors.surfaceSoft, borderColor: colors.border, marginTop: 12 }]}> 
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>File sync is temporarily unavailable. Showing preview file records.</Text>
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shared files</Text>
        {files.length > 0 ? (
          files.map((item, index) => (
            <View key={item.id} style={[styles.fileCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: index === 0 ? 0 : 10 }]}> 
              <View style={styles.fileTop}>
                <Text style={[styles.fileName, { color: colors.foreground }]}>{item.name}</Text>
                <Feather name="download" size={16} color={colors.accent} />
              </View>
              <View style={styles.badgeRow}>
                <Badge label={item.category} />
                <Badge label={formatFileSize(item.sizeBytes)} />
              </View>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Uploaded {formatDate(item.uploadedAt)}</Text>
            </View>
          ))
        ) : (
          <View style={[styles.fileCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>No files have been shared yet. Deliverables and assets will appear here as they are published.</Text>
          </View>
        )}
      </ScrollView>
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18 },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  title: { fontFamily: "Inter_700Bold", fontSize: 35, letterSpacing: -1.2, marginTop: 5 },
  copy: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, marginTop: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 24, marginBottom: 12, letterSpacing: -0.4 },
  fileCard: { borderWidth: 1, borderRadius: 22, padding: 14 },
  fileTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  fileName: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 15 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  meta: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 8 },
});
