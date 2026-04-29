import { Feather } from "@expo/vector-icons";
import { useGetClientMessages } from "@workspace/api-client-react";
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
import {
  placeholderMessages,
} from "@/constants/client-portal-placeholders";
import { useColors } from "@/hooks/useColors";
import { formatDate } from "@/utils/client-portal";

export default function ClientMessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const messagesQuery = useGetClientMessages();
  const messages = messagesQuery.data ?? (messagesQuery.isError ? placeholderMessages : []);
  const unread = messages.filter((item) => !item.isRead).length;

  const refresh = () => {
    Haptics.selectionAsync();
    messagesQuery.refetch();
  };

  if (!messagesQuery.data && messagesQuery.isLoading) {
    return <AppState title="Loading messages" variant="loading" />;
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
            refreshing={messagesQuery.isRefetching}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.eyebrow, { color: colors.crema }]}>Client communication</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Messages</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>A focused message feed for project questions, approvals, and studio updates.</Text>

        <View style={styles.chipsRow}>
          <View style={[styles.chip, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
            <Text style={[styles.chipText, { color: colors.crema }]}>Studio updates</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
            <Text style={[styles.chipText, { color: colors.crema }]}>Approvals</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
            <Text style={[styles.chipText, { color: colors.crema }]}>Response history</Text>
          </View>
        </View>

        {messagesQuery.isError ? (
          <View style={[styles.summaryCard, { backgroundColor: colors.surfaceSoft, borderColor: colors.border, marginTop: 12 }]}> 
            <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>Live messages are temporarily unavailable. Showing preview conversation samples.</Text>
          </View>
        ) : null}

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={[styles.summaryIcon, { backgroundColor: colors.secondary }]}> 
            <Feather name="message-square" size={19} color={colors.accent} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>{unread} unread {unread === 1 ? "message" : "messages"}</Text>
            <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>Expect a response within one business day for standard requests.</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Conversation feed</Text>
        {messages.length > 0 ? (
          messages.map((item, index) => (
            <View key={item.id} style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: index === 0 ? 0 : 10 }]}> 
              <View style={styles.messageTop}>
                <Text style={[styles.subject, { color: colors.foreground }]}>{item.subject}</Text>
                {!item.isRead ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
              </View>
              <Text style={[styles.preview, { color: colors.mutedForeground }]}>{item.preview}</Text>
              <Text style={[styles.meta, { color: colors.secondaryForeground }]}>{item.senderRole === "studio" ? "Studio" : "You"} · {formatDate(item.sentAt)}</Text>
            </View>
          ))
        ) : (
          <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.preview, { color: colors.mutedForeground }]}>No messages yet. When your studio team sends updates, they will appear here.</Text>
          </View>
        )}
      </ScrollView>
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
  summaryCard: { borderWidth: 1, borderRadius: 24, padding: 14, marginTop: 16, flexDirection: "row", gap: 10 },
  summaryIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  summaryCopy: { flex: 1 },
  summaryTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  summaryText: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4, lineHeight: 18 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 24, marginBottom: 12, letterSpacing: -0.4 },
  messageCard: { borderWidth: 1, borderRadius: 22, padding: 14 },
  messageTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  subject: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 15 },
  unreadDot: { width: 9, height: 9, borderRadius: 999 },
  preview: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 5 },
  meta: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginTop: 8 },
});
