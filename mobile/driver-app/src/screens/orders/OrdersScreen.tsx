import React from "react"
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
} from "react-native"
import { useDriverStore } from "../../store/useDriverStore"

const COLORS = {
  primary: "#6B6BD5", bg: "#F5F5F5", white: "#FFFFFF",
  text: "#212121", sub: "#757575", border: "#E0E0E0",
  green: "#4CAF50", orange: "#FF9800", danger: "#F44336",
}

export default function OrdersScreen({ navigation }: any) {
  const { pendingOrders, isOnline, acceptOrder, currentOrder } = useDriverStore()

  const handleAccept = (order: any) => {
    acceptOrder(order)
    navigation.navigate("ActiveDelivery")
  }

  if (!isOnline) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>Commandes disponibles</Text></View>
        <View style={styles.offlineWrap}>
          <Text style={{ fontSize: 56 }}>😴</Text>
          <Text style={styles.offlineTitle}>Vous êtes hors ligne</Text>
          <Text style={styles.offlineSub}>Passez en ligne depuis l&apos;accueil pour recevoir des commandes.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Commandes disponibles</Text>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>En ligne</Text>
        </View>
      </View>

      {currentOrder && (
        <TouchableOpacity style={styles.activeOrderBanner} onPress={() => navigation.navigate("ActiveDelivery")}>
          <Text style={styles.activeOrderText}>🛵 Livraison en cours — {currentOrder.id}</Text>
          <Text style={styles.activeOrderArrow}>→</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={pendingOrders}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={styles.emptyTitle}>Pas de nouvelles commandes</Text>
            <Text style={styles.emptySub}>Restez en ligne, les commandes arrivent bientôt !</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            {/* Header */}
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>{item.id}</Text>
              <View style={styles.earningsBadge}>
                <Text style={styles.earningsText}>+{item.earnings.toLocaleString()} FCFA</Text>
              </View>
            </View>

            {/* Adresses */}
            <View style={styles.addressSection}>
              <View style={styles.addressRow}>
                <View style={styles.dotGreen} />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressType}>Ramassage</Text>
                  <Text style={styles.addressText}>{item.storeAddress}</Text>
                </View>
              </View>
              <View style={styles.addressLine} />
              <View style={styles.addressRow}>
                <View style={styles.dotOrange} />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressType}>Livraison</Text>
                  <Text style={styles.addressText}>{item.deliveryAddress}</Text>
                  <Text style={styles.customerName}>👤 {item.customerName}</Text>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statIcon}>📦</Text>
                <Text style={styles.statValue}>{item.items} article{item.items > 1 ? "s" : ""}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statIcon}>📏</Text>
                <Text style={styles.statValue}>{item.distance}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statIcon}>💵</Text>
                <Text style={styles.statValue}>{item.total.toLocaleString()} FCFA</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.rejectBtn}>
                <Text style={styles.rejectText}>Refuser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acceptBtn, currentOrder && styles.acceptBtnDisabled]}
                onPress={() => !currentOrder && handleAccept(item)}
                disabled={!!currentOrder}
              >
                <Text style={styles.acceptText}>{currentOrder ? "Livraison en cours" : "Accepter"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  onlineBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#E8F5E9", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green },
  onlineText: { fontSize: 12, color: COLORS.green, fontWeight: "700" },
  activeOrderBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12,
  },
  activeOrderText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  activeOrderArrow: { color: COLORS.white, fontSize: 18 },
  orderCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  orderId: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  earningsBadge: { backgroundColor: "#E8F5E9", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  earningsText: { color: COLORS.green, fontWeight: "800", fontSize: 13 },
  addressSection: { marginBottom: 12 },
  addressRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.green, marginTop: 3 },
  dotOrange: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.orange, marginTop: 3 },
  addressLine: { width: 2, height: 16, backgroundColor: COLORS.border, marginLeft: 5, marginVertical: 2 },
  addressInfo: { flex: 1 },
  addressType: { fontSize: 10, fontWeight: "700", color: COLORS.sub, textTransform: "uppercase" },
  addressText: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginTop: 1 },
  customerName: { fontSize: 11, color: COLORS.sub, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  stat: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F5F5F5", borderRadius: 8, padding: 8 },
  statIcon: { fontSize: 14 },
  statValue: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  actions: { flexDirection: "row", gap: 8 },
  rejectBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: "center",
  },
  rejectText: { color: COLORS.sub, fontWeight: "700", fontSize: 14 },
  acceptBtn: { flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: "center" },
  acceptBtnDisabled: { backgroundColor: "#C5C5E8" },
  acceptText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
  offlineWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  offlineTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  offlineSub: { fontSize: 14, color: COLORS.sub, textAlign: "center" },
  emptyWrap: { alignItems: "center", padding: 48, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.sub, textAlign: "center" },
})
