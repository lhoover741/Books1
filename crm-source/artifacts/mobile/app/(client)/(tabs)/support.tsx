import { Feather } from "@expo/vector-icons";
import {
  type ClientSupportPriority,
  useGetClientProject,
  usePostClientSupport,
} from "@workspace/api-client-react";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  placeholderSupportTickets,
} from "@/constants/client-portal-placeholders";
import { useAuthSession } from "@/contexts/AuthSessionContext";
import { useColors } from "@/hooks/useColors";
import { formatDate } from "@/utils/client-portal";

export default function ClientSupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const auth = useAuthSession();
  const projectQuery = useGetClientProject();

  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [priority, setPriority] = React.useState<ClientSupportPriority>("normal");
  const [formError, setFormError] = React.useState("");
  const [submittedTickets, setSubmittedTickets] = React.useState(
    placeholderSupportTickets,
  );

  const supportMutation = usePostClientSupport({
    mutation: {
      onSuccess(ticket) {
        setSubmittedTickets((current) => [ticket, ...current]);
        setSubject("");
        setMessage("");
        setFormError("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      onError(error) {
        const errorMessage =
          error && typeof error === "object" && "data" in error
            ? String(
                (error as { data?: { message?: string } }).data?.message ??
                  "Unable to submit support request right now.",
              )
            : "Unable to submit support request right now.";
        setFormError(errorMessage);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    },
  });

  const activeProjectId = projectQuery.data?.project?.id ?? null;

  const submitRequest = () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (trimmedSubject.length < 3) {
      setFormError("Please add a subject with at least 3 characters.");
      return;
    }

    if (trimmedMessage.length < 10) {
      setFormError("Please add a message with at least 10 characters.");
      return;
    }

    setFormError("");
    supportMutation.mutate({
      data: {
        subject: trimmedSubject,
        message: trimmedMessage,
        priority,
        projectId: activeProjectId,
      },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}> 
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 106 },
        ]}
      >
        <Text style={[styles.eyebrow, { color: colors.crema }]}>Service desk</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Support</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Need help, clarification, or a change request? Our support lane keeps communication clear and accountable.</Text>

        <View style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.requestTitle, { color: colors.foreground }]}>Open a support request</Text>
          <TextInput
            value={subject}
            onChangeText={(value) => {
              setSubject(value);
              if (formError) setFormError("");
            }}
            placeholder="Subject"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              { backgroundColor: colors.surfaceSoft, borderColor: colors.border, color: colors.foreground },
            ]}
          />
          <TextInput
            value={message}
            onChangeText={(value) => {
              setMessage(value);
              if (formError) setFormError("");
            }}
            multiline
            placeholder="Share details so our team can help quickly"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.messageInput,
              { backgroundColor: colors.surfaceSoft, borderColor: colors.border, color: colors.foreground },
            ]}
          />

          <View style={styles.priorityRow}>
            {(["low", "normal", "high"] as const).map((item) => {
              const active = item === priority;
              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPriority(item);
                  }}
                  style={[
                    styles.priorityChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceSoft,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityChipText,
                      { color: active ? colors.primaryForeground : colors.secondaryForeground },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {formError ? <Text style={[styles.errorText, { color: colors.destructive }]}>{formError}</Text> : null}

          <Pressable
            onPress={submitRequest}
            disabled={supportMutation.isPending}
            style={[
              styles.submitButton,
              {
                backgroundColor: colors.primary,
                opacity: supportMutation.isPending ? 0.74 : 1,
              },
            ]}
          >
            {supportMutation.isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>Submit request</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.channelsCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.channelTitle, { color: colors.foreground }]}>Contact options</Text>
          <Channel icon="mail" title="Email support" detail="support@booksandbrews.app" />
          <Channel icon="message-circle" title="Priority message" detail="Average response: under 1 business day" />
          <Channel icon="phone" title="Client call line" detail="Scheduled callbacks during business hours" />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Open requests</Text>
        {submittedTickets.map((ticket, index) => (
          <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: index === 0 ? 0 : 10 }]}> 
            <View style={styles.ticketTop}>
              <Text style={[styles.ticketSubject, { color: colors.foreground }]}>{ticket.subject}</Text>
              <View style={[styles.ticketStatus, { backgroundColor: ticket.status === "Resolved" ? colors.secondary : colors.surfaceSoft }]}> 
                <Text style={[styles.ticketStatusText, { color: ticket.status === "Resolved" ? colors.success : colors.warning }]}>{ticket.status}</Text>
              </View>
            </View>
            <Text style={[styles.ticketMeta, { color: colors.mutedForeground }]}>Priority: {ticket.priority}</Text>
            <Text style={[styles.ticketMeta, { color: colors.secondaryForeground }]}>Updated {formatDate(ticket.updatedAt)}</Text>
          </View>
        ))}

        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            auth.logout();
          }}
          style={[styles.signOutButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
        >
          <Feather name="log-out" size={16} color={colors.accent} />
          <Text style={[styles.signOutText, { color: colors.foreground }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Channel({
  icon,
  title,
  detail,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  detail: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.channelRow}>
      <View style={[styles.channelIcon, { backgroundColor: colors.surfaceSoft }]}> 
        <Feather name={icon} size={16} color={colors.accent} />
      </View>
      <View style={styles.channelCopy}>
        <Text style={[styles.channelName, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.channelDetail, { color: colors.mutedForeground }]}>{detail}</Text>
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
  requestCard: { borderWidth: 1, borderRadius: 24, padding: 14, marginTop: 16 },
  requestTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 14, minHeight: 46, paddingHorizontal: 12, fontFamily: "Inter_500Medium", fontSize: 13 },
  messageInput: { borderWidth: 1, borderRadius: 14, minHeight: 108, marginTop: 10, paddingHorizontal: 12, paddingTop: 10, fontFamily: "Inter_500Medium", fontSize: 13, textAlignVertical: "top" },
  priorityRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  priorityChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  priorityChipText: { fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase" },
  errorText: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 9 },
  submitButton: { minHeight: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 11 },
  submitButtonText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  channelsCard: { borderWidth: 1, borderRadius: 24, padding: 14, marginTop: 16, gap: 10 },
  channelTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 3 },
  channelRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  channelIcon: { width: 36, height: 36, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  channelCopy: { flex: 1 },
  channelName: { fontFamily: "Inter_700Bold", fontSize: 14 },
  channelDetail: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 24, marginBottom: 12, letterSpacing: -0.4 },
  ticketCard: { borderWidth: 1, borderRadius: 22, padding: 14 },
  ticketTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  ticketSubject: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 15 },
  ticketStatus: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  ticketStatusText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  ticketMeta: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 6 },
  signOutButton: { borderWidth: 1, borderRadius: 18, minHeight: 52, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, marginTop: 24 },
  signOutText: { fontFamily: "Inter_700Bold", fontSize: 13 },
});
