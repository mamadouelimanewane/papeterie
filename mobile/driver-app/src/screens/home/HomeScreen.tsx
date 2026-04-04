import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Switch,
} from "react-native"
import { useDriverStore } from "../../store/useDriverStore"
import { Ionicons } from "@expo/vector-icons"

export default function HomeScreen({ navigation }: any) {
  const {
    driver,
    isOnline,
    toggleOnline,
    pendingOrders,
    currentOrder,
    todayEarnings,
    todayOrders,
    acceptOrder,
    fetchOrders,
  } = useDriverStore()

  useEffect(() => {
    if (isOnline) {
      fetchOrders()
      const interval = setInterval(fetchOrders, 3000) // Poll every 3 seconds
      return () => clearInterval(interval)
    }
  }, [isOnline])

  const handleAccept = async (order: any) => {
    // Optionally alert the database too, but the store handles mock state for now.
    // If you want to sync ACCEPT with backend:
    // await ordersAPI.accept(order.id)
    acceptOrder(order)
    navigation.navigate("ActiveDelivery")
  }

  const handleDecline = (orderId: string) => {
    Alert.alert("Décliner", "Voulez-vous décliner cette commande ?", [
      { text: "Non", style: "cancel" },
      { text: "Oui", style: "destructive", onPress: () => {} },
    ])
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {driver?.name?.split(" ")[0]} <Ionicons name="hand-right" size={18} color="#FFD600" /></Text>
          <Text style={styles.subGreeting}>{driver?.vehicleType} · <Ionicons name="star" size={12} color="#FFD600" /> {driver?.rating}</Text>
        </View>
        <View style={styles.onlineToggle}>
          <Text style={[styles.onlineLabel, { color: isOnline ? "#4CAF50" : "#999" }]}>
            {isOnline ? "En ligne" : "Hors ligne"}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: "#ccc", true: "#4CAF5066" }}
            thumbColor={isOnline ? "#4CAF50" : "#999"}
          />
        </View>
      </View>

      {/* Online status banner */}
      <View style={[styles.statusBanner, { backgroundColor: isOnline ? "#E8F5E9" : "#F5F5F5" }]}>
        <Ionicons name="ellipse" size={12} color={isOnline ? "#4CAF50" : "#999"} />
        <Text style={[styles.statusText, { color: isOnline ? "#2E7D32" : "#777" }]}>
          {isOnline
            ? "Vous êtes en ligne — les commandes vous seront attribuées"
            : "Vous êtes hors ligne — activez pour recevoir des commandes"}
        </Text>
      </View>

      {/* Today stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todayEarnings.toLocaleString()} FCFA</Text>
          <Text style={styles.statLabel}>Gains du jour</Text>
        </View>
        <View style={[styles.statCard, styles.statCardMiddle]}>
          <Text style={styles.statValue}>{todayOrders}</Text>
          <Text style={styles.statLabel}>Livraisons</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{driver?.rating}</Text>
          <Text style={styles.statLabel}>Note <Ionicons name="star" size={10} color="#FFD600" /></Text>
        </View>
      </View>

      {/* Current active order */}
      {currentOrder && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commande en cours</Text>
          <TouchableOpacity
            style={styles.activeOrderCard}
            onPress={() => navigation.navigate("ActiveDelivery")}
          >
            <View style={styles.activeOrderHeader}>
              <Text style={styles.activeOrderId}>{currentOrder.id}</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>
                  {currentOrder.status === "accepted" ? "Récupération" : "En livraison"}
                </Text>
              </View>
            </View>
            <View style={styles.routeRow}>
              <Ionicons name="cube" size={16} color="#fff" />
              <Text style={styles.routeAddress} numberOfLines={1}>
                {currentOrder.storeAddress}
              </Text>
            </View>
            <View style={styles.routeRow}>
              <Ionicons name="location" size={16} color="#fff" />
              <Text style={styles.routeAddress} numberOfLines={1}>
                {currentOrder.deliveryAddress}
              </Text>
            </View>
            <Text style={styles.viewDelivery}>Voir la livraison →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pending order requests */}
      {isOnline && pendingOrders.length > 0 && !currentOrder && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nouvelles commandes ({pendingOrders.length})</Text>
          {pendingOrders.map((order) => (
            <View key={order.id} style={styles.orderRequestCard}>
              <View style={styles.orderRequestHeader}>
                <Text style={styles.orderRequestId}>{order.id}</Text>
                <Text style={styles.orderRequestEarning}>+{order.earnings} FCFA</Text>
              </View>
              <View style={styles.routeRow}>
                <Ionicons name="business" size={16} color="#1A237E" />
                <Text style={styles.routeText}>{order.storeAddress}</Text>
              </View>
              <View style={styles.routeRow}>
                <Ionicons name="home" size={16} color="#1A237E" />
                <Text style={styles.routeText}>{order.deliveryAddress}</Text>
              </View>
              <View style={styles.orderMeta}>
                <Text style={styles.metaItem}><Ionicons name="person" size={12} /> {order.customerName}</Text>
                <Text style={styles.metaItem}><Ionicons name="cube" size={12} /> {order.items} articles</Text>
                <Text style={styles.metaItem}><Ionicons name="navigate" size={12} /> {order.distance}</Text>
              </View>
              <View style={styles.orderActions}>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={() => handleDecline(order.id)}
                >
                  <Text style={styles.declineBtnText}>Décliner</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAccept(order)}
                >
                  <Text style={styles.acceptBtnText}>Accepter</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {isOnline && pendingOrders.length === 0 && !currentOrder && (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color="#ccc" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>En attente de commandes...</Text>
          <Text style={styles.emptySubtitle}>Vous recevrez une notification dès qu'une commande est disponible</Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5FA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A237E",
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  greeting: { fontSize: 20, fontWeight: "700", color: "#fff" },
  subGreeting: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 3 },
  onlineToggle: { alignItems: "center" },
  onlineLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  statusIcon: { fontSize: 16 },
  statusText: { fontSize: 13, flex: 1 },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#F0F0F0",
  },
  statValue: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 4 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 12 },
  activeOrderCard: {
    backgroundColor: "#1A237E",
    borderRadius: 14,
    padding: 16,
  },
  activeOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  activeOrderId: { fontSize: 15, fontWeight: "700", color: "#fff" },
  activeBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  routeIcon: { fontSize: 14 },
  routeAddress: { fontSize: 13, color: "rgba(255,255,255,0.9)", flex: 1 },
  routeText: { fontSize: 13, color: "#444", flex: 1 },
  viewDelivery: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    marginTop: 8,
  },
  orderRequestCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#1A237E",
  },
  orderRequestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderRequestId: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  orderRequestEarning: { fontSize: 16, fontWeight: "700", color: "#4CAF50" },
  orderMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
    marginBottom: 14,
  },
  metaItem: { fontSize: 12, color: "#666" },
  orderActions: { flexDirection: "row", gap: 10 },
  declineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  declineBtnText: { color: "#666", fontWeight: "600", fontSize: 14 },
  acceptBtn: {
    flex: 2,
    backgroundColor: "#1A237E",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  acceptBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20 },
})
