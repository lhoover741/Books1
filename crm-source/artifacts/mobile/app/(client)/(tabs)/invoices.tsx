import { Feather } from "@expo/vector-icons";
import { useGetClientInvoices } from "@workspace/api-client-react";
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
import { placeholderInvoices } from "@/constants/client-portal-placeholders";
import { useColors } from "@/hooks/useColors";
import { currency, formatDate } from "@/utils/client-portal";

export default function ClientInvoicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const invoicesQuery = useGetClientInvoices();

  const invoices = invoicesQuery.data ?? (invoicesQuery.isError ? placeholderInvoices : []);
  const outstanding = invoices.filter((item) => item.status !== "Paid");
  const outstandingAmount = outstanding.reduce((sum, item) => sum + item.amountCents, 0);

  const refresh = () => {
    Haptics.selectionAsync();
    invoicesQuery.refetch();
  };

  if (!invoicesQuery.data && invoicesQuery.isLoading) {
    return <AppState title="Loading invoice details" variant="loading" />;
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
            refreshing={invoicesQuery.isRefetching}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.eyebrow, { color: colors.crema }]}>Billing center</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Invoices</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>View issued invoices, payment status, and upcoming due dates with complete clarity.</Text>

        {invoicesQuery.isError ? (
          <View style={[styles.invoiceCard, { backgroundColor: colors.surfaceSoft, borderColor: colors.border, marginTop: 12 }]}> 
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>Live billing sync is unavailable. Showing preview invoice records.</Text>
          </View>
        ) : null}

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.summaryBlock}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Outstanding</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{currency.format(outstandingAmount / 100)}</Text>
          </View>
          <View style={[styles.summaryIcon, { backgroundColor: colors.secondary }]}> 
            <Feather name="credit-card" size={20} color={colors.accent} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Invoice history</Text>
        {invoices.length > 0 ? (
          invoices.map((item, index) => (
            <View key={item.id} style={[styles.invoiceCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: index === 0 ? 0 : 10 }]}> 
              <View style={styles.invoiceTop}>
                <Text style={[styles.invoiceNumber, { color: colors.foreground }]}>{item.invoiceNumber}</Text>
                <View style={[styles.statusPill, { backgroundColor: item.status === "Paid" ? colors.secondary : colors.surfaceSoft }]}> 
                  <Text style={[styles.statusText, { color: item.status === "Paid" ? colors.success : colors.warning }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={[styles.amount, { color: colors.foreground }]}>{currency.format(item.amountCents / 100)}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Issued {formatDate(item.issuedAt)} · Due {formatDate(item.dueDate)}</Text>
            </View>
          ))
        ) : (
          <View style={[styles.invoiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>No invoices are available yet. Billing records will appear here once your first milestone is issued.</Text>
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
  summaryCard: { borderWidth: 1, borderRadius: 24, padding: 15, marginTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryBlock: { flex: 1 },
  summaryLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  summaryValue: { fontFamily: "Inter_700Bold", fontSize: 24, marginTop: 5 },
  summaryIcon: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 24, marginBottom: 12, letterSpacing: -0.4 },
  invoiceCard: { borderWidth: 1, borderRadius: 22, padding: 14 },
  invoiceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  invoiceNumber: { fontFamily: "Inter_700Bold", fontSize: 15 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  amount: { fontFamily: "Inter_700Bold", fontSize: 19, marginTop: 8 },
  meta: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 6 },
});
