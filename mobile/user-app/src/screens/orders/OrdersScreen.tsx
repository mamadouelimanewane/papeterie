import React, { useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"

const MOCK_ORDERS = [
  { id: "ORD-3253", store: "Mon École - Plateau", items: 3, total: 12500, status: "Livré", date: "15 mars 2026, 10:30", statusColor: COLORS.success, emoji: "✅" },
  { id: "ORD-3252", store: "Librairie Papeterie", items: 2, total: 8750, status: "En cours", date: "15 mars 2026, 09:45", statusColor: COLORS.warning, emoji: "🚴" },
  { id: "ORD-3251", store: "Buro-Center", items: 1, total: 5200, status: "En attente", date: "15 mars 2026, 09:00", statusColor: COLORS.info, emoji: "⏳" },
  { id: "ORD-3244", store: "Mon École - Plateau", items: 5, total: 22000, status: "Livré", date: "14 mars 2026, 18:15", statusColor: COLORS.success, emoji: "✅" },
  { id: "ORD-3240", store: "Art & Bureau", items: 2, total: 9800, status: "Annulé", date: "13 mars 2026, 12:00", statusColor: COLORS.danger, emoji: "❌" },
]

const TABS = ["Tous", "En cours", "Livré", "Annulé"]

export default function OrdersScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState("Tous")

  const filtered = MOCK_ORDERS.filter(
    (o) => activeTab === "Tous" || o.status.includes(activeTab.replace("En cours", "En"))
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Commandes</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.md }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate("OrderDetail", { order: item })}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderIdRow}>
                <Text style={styles.orderId}>{item.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.statusColor + "20" }]}>
                  <Text style={[styles.statusText, { color: item.statusColor }]}>
                    {item.emoji} {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.orderDate}>{item.date}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderBody}>
              <Text style={styles.storeName}>🏪 {item.store}</Text>
              <Text style={styles.orderItems}>{item.items} article{item.items > 1 ? "s" : ""}</Text>
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>{item.total.toLocaleString()} FCFA</Text>
              {item.status === "Livré" && (
                <TouchableOpacity style={styles.reorderBtn}>
                  <Text style={styles.reorderText}>↺ Recommander</Text>
                </TouchableOpacity>
              )}
              {item.status === "En cours" && (
                <TouchableOpacity style={styles.trackBtn}>
                  <Text style={styles.trackText}>📍 Suivre</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyText}>Aucune commande</Text>
            <Text style={styles.emptySubtext}>Vos commandes apparaîtront ici</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium,
  },
  title: { fontSize: FONTS.sizes.xl, fontWeight: "800", color: COLORS.text },
  tabs: {
    flexDirection: "row", backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    borderRadius: RADIUS.round, backgroundColor: COLORS.grayLight,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  orderCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  orderHeader: { gap: 4 },
  orderIdRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.round },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: "700" },
  orderDate: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.grayMedium, marginVertical: SPACING.sm },
  orderBody: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  storeName: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.text },
  orderItems: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: SPACING.sm },
  orderTotal: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.primary },
  reorderBtn: {
    backgroundColor: COLORS.primaryLight + "20", borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
  },
  reorderText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: "700" },
  trackBtn: {
    backgroundColor: COLORS.warning + "20", borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
  },
  trackText: { color: COLORS.warning, fontSize: FONTS.sizes.xs, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 80, gap: SPACING.sm },
  emptyEmoji: { fontSize: 60 },
  emptyText: { fontSize: FONTS.sizes.lg, fontWeight: "700", color: COLORS.text },
  emptySubtext: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
})
