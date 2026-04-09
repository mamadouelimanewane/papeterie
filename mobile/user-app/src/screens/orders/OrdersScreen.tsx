import { useStore } from "../../store/useStore"
import { ordersAPI } from "../../services/api"
import { Ionicons } from "@expo/vector-icons"
import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"

const TABS = ["Tous", "En cours", "Livré", "Annulé"]

export default function OrdersScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState("Tous")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = useStore((s) => s.user)

  useEffect(() => {
    if (user) loadOrders()
  }, [user])

  async function loadOrders() {
    try {
      setLoading(true)
      const res = await ordersAPI.getAll()
      setOrders(res.data.orders || res.data)
    } catch (err) {
      console.error("[OrdersHistory]", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered": case "Livré": return COLORS.success
      case "Pending": case "En attente": return COLORS.info
      case "PickedUp": case "En cours": return COLORS.warning
      case "Cancelled": case "Annulé": return COLORS.danger
      default: return COLORS.gray
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered": case "Livré": return "checkmark-circle"
      case "Pending": case "En attente": return "time"
      case "PickedUp": case "En cours": return "bicycle"
      case "Cancelled": case "Annulé": return "close-circle"
      default: return "help-circle"
    }
  }

  const STATUS_MAP: Record<string, string[]> = {
    "Tous": [],
    "En cours": ["Pending", "Processing", "PickedUp"],
    "Livré": ["Completed", "Delivered"],
    "Annulé": ["Cancelled"],
  }
  const filtered = orders.filter(
    (o) => STATUS_MAP[activeTab].length === 0 || STATUS_MAP[activeTab].includes(o.status)
  )

  const handleDev = () => {
    Alert.alert("En développement", "Cette fonctionnalité sera bientôt disponible !")
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Commandes</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs as any}>
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
        refreshing={loading}
        onRefresh={loadOrders}
        renderItem={({ item }) => {
          const statusColor = getStatusColor(item.status)
          const statusIcon = getStatusIcon(item.status)
          return (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => navigation.navigate("OrderDetail", { order: item })}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderIdRow}>
                  <Text style={styles.orderId}>{item.orderId || item.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      <Ionicons name={statusIcon as any} size={12} color={statusColor} /> {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderDate}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.orderBody}>
                <Text style={styles.storeName}><Ionicons name="business" size={14} /> {item.store?.name || "Boutique"}</Text>
                <Text style={styles.orderItems}>{(item.items as any[])?.length || 0} article(s)</Text>
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>{item.total.toLocaleString()} FCFA</Text>
                {item.status === "Delivered" && (
                  <TouchableOpacity style={styles.reorderBtn} onPress={handleDev}>
                    <Text style={styles.reorderText}><Ionicons name="refresh" size={12} /> Recommander</Text>
                  </TouchableOpacity>
                )}
                {(item.status === "PickedUp" || item.status === "En cours") && (
                  <TouchableOpacity style={styles.trackBtn} onPress={handleDev}>
                    <Text style={styles.trackText}><Ionicons name="location" size={12} /> Suivre</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={60} color={COLORS.grayMedium} />
              <Text style={styles.emptyText}>Aucune commande</Text>
              <Text style={styles.emptySubtext}>Vos commandes apparaîtront ici</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          )
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
  emptyText: { fontSize: FONTS.sizes.lg, fontWeight: "700", color: COLORS.text },
  emptySubtext: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
})
