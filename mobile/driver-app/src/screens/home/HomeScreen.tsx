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
  SafeAreaView,
} from "react-native"
import { useDriverStore } from "../../store/useDriverStore"
import { Ionicons } from "@expo/vector-icons"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"

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
      const interval = setInterval(fetchOrders, 3000)
      return () => clearInterval(interval)
    }
  }, [isOnline])

  const handleAccept = async (order: any) => {
    acceptOrder(order)
    navigation.navigate("ActiveDelivery")
  }

  const handleDecline = (orderId: string) => {
    Alert.alert("Décliner", "Voulez-vous décliner cette commande ?", [
      { text: "Non", style: "cancel" },
      { text: "Oui", style: "destructive" },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Salut, {driver?.name?.split(" ")[0]} 👋</Text>
            <Text style={styles.subGreeting}>{driver?.vehicleType} · <Ionicons name="star" size={12} color={COLORS.secondary} /> {driver?.rating}</Text>
          </View>
          <View style={styles.onlineToggle}>
            <Text style={[styles.onlineLabel, { color: isOnline ? COLORS.success : COLORS.gray }]}>
              {isOnline ? "EN LIGNE" : "HORS LIGNE"}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={toggleOnline}
              trackColor={{ false: COLORS.grayMedium, true: COLORS.success + "66" }}
              thumbColor={isOnline ? COLORS.success : COLORS.white}
            />
          </View>
        </View>

        {/* Today stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayEarnings.toLocaleString()}</Text>
            <Text style={styles.statCurrency}>FCFA</Text>
            <Text style={styles.statLabel}>Gains du jour</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayOrders}</Text>
            <Text style={styles.statCurrency}>COURSE(S)</Text>
            <Text style={styles.statLabel}>Livraisons</Text>
          </View>
        </View>

        {/* Status banner */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="notifications-off-outline" size={24} color={COLORS.textSecondary} />
            <Text style={styles.offlineText}>
              Passez en ligne pour commencer à recevoir des courses à proximité.
            </Text>
          </View>
        )}

        {/* Current active order */}
        {currentOrder && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course en cours</Text>
            <TouchableOpacity
              style={styles.activeOrderCard}
              onPress={() => navigation.navigate("ActiveDelivery")}
            >
              <View style={styles.activeOrderHeader}>
                <View style={styles.orderIdBadge}>
                  <Text style={styles.activeOrderId}>{currentOrder.id}</Text>
                </View>
                <View style={[styles.activeBadge, { backgroundColor: COLORS.secondary }]}>
                  <Text style={styles.activeBadgeText}>
                    {currentOrder.status === "accepted" ? "En route vers magasin" : "En route vers client"}
                  </Text>
                </View>
              </View>
              <View style={styles.routeRow}>
                <Ionicons name="storefront" size={16} color={COLORS.white} />
                <Text style={styles.routeAddress} numberOfLines={1}>{currentOrder.storeAddress}</Text>
              </View>
              <View style={styles.routeRow}>
                <Ionicons name="location" size={16} color={COLORS.white} />
                <Text style={styles.routeAddress} numberOfLines={1}>{currentOrder.deliveryAddress}</Text>
              </View>
              <View style={styles.activeFooter}>
                 <Text style={styles.viewDelivery}>Accéder au suivi →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Pending order requests */}
        {isOnline && pendingOrders.length > 0 && !currentOrder && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nouvelles demandes</Text>
              <View style={styles.countBadge}><Text style={styles.countBadgeText}>{pendingOrders.length}</Text></View>
            </View>
            {pendingOrders.map((order) => (
              <View key={order.id} style={styles.orderRequestCard}>
                <View style={styles.orderRequestHeader}>
                  <Text style={styles.orderRequestId}>{order.id}</Text>
                  <Text style={styles.orderRequestEarning}>{order.earnings.toLocaleString()} F</Text>
                </View>
                <View style={styles.routeRowDark}>
                  <Ionicons name="business" size={16} color={COLORS.primary} />
                  <Text style={styles.routeText}>{order.storeAddress}</Text>
                </View>
                <View style={[styles.routeRowDark, { marginTop: 4 }]}>
                  <Ionicons name="location" size={16} color={COLORS.primary} />
                  <Text style={styles.routeText}>{order.deliveryAddress}</Text>
                </View>
                <View style={styles.orderMeta}>
                  <Text style={styles.metaItem}><Ionicons name="cube" size={12} /> {order.items} articles</Text>
                  <Text style={styles.metaItem}><Ionicons name="navigate" size={12} /> {order.distance}</Text>
                </View>
                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => handleDecline(order.id)}
                  >
                    <Text style={styles.declineBtnText}>Ignorer</Text>
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
            <View style={styles.radarContainer}>
               <View style={styles.radarCircle} />
               <Ionicons name="navigate" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Radar activé...</Text>
            <Text style={styles.emptySubtitle}>Recherche de nouvelles courses autour de vous.</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: { fontSize: FONTS.sizes.xl, fontWeight: "800", color: COLORS.white },
  subGreeting: { fontSize: FONTS.sizes.sm, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  onlineToggle: { alignItems: "center" },
  onlineLabel: { fontSize: 10, fontWeight: "900", marginBottom: 4 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    marginTop: -25,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: "900", color: COLORS.primary },
  statCurrency: { fontSize: 10, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 4 },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  offlineBanner: {
    margin: SPACING.lg, padding: SPACING.lg,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    alignItems: "center", borderStyle: "dashed", borderWidth: 2, borderColor: COLORS.grayMedium,
  },
  offlineText: { textAlign: "center", color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 10, lineHeight: 20 },
  section: { marginTop: SPACING.xl, paddingHorizontal: SPACING.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  countBadge: { backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.round },
  countBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
  activeOrderCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  activeOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  orderIdBadge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  activeOrderId: { fontSize: FONTS.sizes.sm, fontWeight: "800", color: COLORS.white },
  activeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.round },
  activeBadgeText: { color: COLORS.primary, fontSize: 11, fontWeight: "800" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  routeRowDark: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeAddress: { fontSize: FONTS.sizes.sm, color: "rgba(255,255,255,0.8)", flex: 1 },
  routeText: { fontSize: FONTS.sizes.sm, color: COLORS.text, flex: 1 },
  activeFooter: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", marginTop: 12, paddingTop: 12 },
  viewDelivery: { color: COLORS.secondary, fontSize: FONTS.sizes.sm, fontWeight: "800", textAlign: "right" },
  orderRequestCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    borderLeftWidth: 5, borderLeftColor: COLORS.primary,
  },
  orderRequestHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  orderRequestId: { fontSize: FONTS.sizes.md, fontWeight: "800", color: COLORS.text },
  orderRequestEarning: { fontSize: FONTS.sizes.lg, fontWeight: "900", color: COLORS.success },
  orderMeta: { flexDirection: "row", gap: 15, marginTop: 15, marginBottom: 20 },
  metaItem: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: "600" },
  orderActions: { flexDirection: "row", gap: SPACING.md },
  declineBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: RADIUS.md, backgroundColor: COLORS.grayLight },
  declineBtnText: { color: COLORS.textSecondary, fontWeight: "700" },
  acceptBtn: { flex: 2, paddingVertical: 12, alignItems: "center", borderRadius: RADIUS.md, backgroundColor: COLORS.primary },
  acceptBtnText: { color: COLORS.white, fontWeight: "800" },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  radarContainer: { width: 100, height: 100, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  radarCircle: { 
    position: "absolute", width: 80, height: 80, borderRadius: 40, 
    borderWidth: 1, borderColor: COLORS.primary, opacity: 0.3 
  },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22 },
})

