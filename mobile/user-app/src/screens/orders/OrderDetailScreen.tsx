import React, { useState, useEffect } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Linking, Dimensions, Image, Alert, ActivityIndicator
} from "react-native"

import MapView, { Marker, Polyline } from "react-native-maps"
import { Ionicons } from "@expo/vector-icons"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { ordersAPI } from "../../services/api"


const { width } = Dimensions.get("window")

const STEPS = [
  { id: 1, label: "Commande confirmée", icon: "✅", status: "Pending" },
  { id: 2, label: "En préparation", icon: "📦", status: "Processing" },
  { id: 3, label: "Livreur assigné", icon: "🛵", status: "Accepted" },
  { id: 4, label: "En route vers vous", icon: "📍", status: "Pickedup" },
  { id: 5, label: "Livré", icon: "🏠", status: "Delivered" },
]

export default function OrderDetailScreen({ route, navigation }: any) {
  const initialOrder = route?.params?.order
  const [orderData, setOrderData] = useState<any>(initialOrder)
  const [driverPos, setDriverPos] = useState({ latitude: 14.7250, longitude: -17.4620 })
  const [loading, setLoading] = useState(!initialOrder)

  const fetchOrderDetails = async () => {
    try {
      const res = await ordersAPI.getById(orderData?.id || initialOrder?.id)
      const freshOrder = res.data
      setOrderData(freshOrder)
      
      if (freshOrder?.driver?.lastLocation) {
        const [lat, lng] = freshOrder.driver.lastLocation.split(",").map(Number)
        if (!isNaN(lat) && !isNaN(lng)) {
          setDriverPos({ latitude: lat, longitude: lng })
        }
      }
    } catch (error) {
       console.log("Error polling order status", error)
    } finally {
       setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetails()
    const interval = setInterval(fetchOrderDetails, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !orderData) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  const items = orderData?.items || []
  const subtotal = Array.isArray(items) ? items.reduce((sum: number, i: any) => sum + (i.price * i.qty), 0) : 0
  
  // Dynamic status check for steps
  const currentStatusIndex = STEPS.findIndex(s => s.status === orderData.status)
  const stepsWithStatus = STEPS.map((s, i) => ({
    ...s,
    done: i < currentStatusIndex || orderData.status === "Delivered",
    active: i === currentStatusIndex && orderData.status !== "Delivered"
  }))

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Suivi de commande {orderData.orderId || orderData.id}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{orderData.status}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* MapView at the top */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={{
              latitude: driverPos.latitude,
              longitude: driverPos.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            {/* Delivery Destination */}
            <Marker coordinate={{ latitude: 14.7360, longitude: -17.4580 }}>
              <View style={styles.homeMarker}>
                <Ionicons name="home" size={16} color={COLORS.white} />
              </View>
            </Marker>

            {/* Driver Position */}
            {orderData.driver && (
              <Marker coordinate={driverPos}>
                <View style={styles.driverMarker}>
                   <Ionicons name="bicycle" size={20} color={COLORS.white} />
                   <View style={styles.driverMarkerDot} />
                </View>
              </Marker>
            )}

            {/* Path */}
            <Polyline
              coordinates={[
                driverPos,
                { latitude: 14.7360, longitude: -17.4580 },
              ]}
              strokeColor={COLORS.primary}
              strokeWidth={4}
              lineDashPattern={[5, 5]}
            />
          </MapView>
          <View style={styles.mapOverlay}>
             <Text style={styles.mapOverlayText}>
               {orderData.status === "Delivered" ? "Colis livré !" : "Livreur en approche"}
             </Text>
          </View>
        </View>

        {/* Suivi en temps réel */}
        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
             <Text style={styles.cardTitle}>📦 Statut de livraison</Text>
             <View style={styles.etaBadge}>
                <Text style={styles.etaText}>{orderData.status === "Delivered" ? "Terminée" : "En cours"}</Text>
             </View>
          </View>
          <View style={styles.steps}>
            {stepsWithStatus.map((step, idx) => (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepDot, step.done && styles.stepDotDone, step.active && styles.stepDotActive]}>
                    <Text style={styles.stepDotText}>{step.done || step.active ? step.icon : ""}</Text>
                  </View>
                  {idx < stepsWithStatus.length - 1 && <View style={[styles.stepLine, step.done && styles.stepLineDone]} />}
                </View>
                <Text style={[styles.stepLabel, step.active && styles.stepLabelActive, step.done && styles.stepLabelDone]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Livreur */}
        {orderData.driver && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Votre livreur</Text>
            <View style={styles.driverRow}>
              <View style={[styles.driverAvatarImg, { backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" }]}>
                 <Text style={{ color: COLORS.white, fontWeight: "bold" }}>{orderData.driver.name.charAt(0)}</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{orderData.driver.name}</Text>
                <Text style={styles.driverVehicle}>{orderData.driver.phone}</Text>
                <View style={styles.driverRatingRow}>
                  <Ionicons name="star" size={12} color={COLORS.secondary} />
                  <Text style={styles.driverRatingText}>4.9</Text>
                </View>
              </View>
              <View style={styles.driverActions}>
                 <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${orderData.driver.phone}`)}>
                   <Ionicons name="call" size={20} color={COLORS.success} />
                 </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* OTP Code (New) */}
        {orderData.status !== "Delivered" && (
          <View style={[styles.card, styles.otpCard]}>
            <View style={styles.otpHeader}>
               <Ionicons name="key" size={20} color={COLORS.primary} />
               <Text style={styles.otpTitle}>Code de livraison</Text>
            </View>
            <Text style={styles.otpDesc}>Donnez ce code au livreur pour confirmer la bonne réception de votre colis.</Text>
            <View style={styles.otpCodeContainer}>
               <Text style={styles.otpCodeText}>{orderData.deliveryOtp || "------"}</Text>
            </View>
          </View>
        )}


        {/* Adresse */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Adresse de livraison</Text>
          <View style={styles.addressRow}>
            <Text style={{ fontSize: 20 }}>📍</Text>
            <Text style={styles.addressText}>{orderData.address}</Text>
          </View>
        </View>

        {/* Articles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Articles commandés</Text>
          {Array.isArray(orderData.items) && orderData.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.qty}x</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{(item.price * item.qty).toLocaleString()} FCFA</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Récapitulatif</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>{subtotal.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Livraison</Text>
            <Text style={styles.totalValue}>{orderData.deliveryFee?.toLocaleString() || "500"} FCFA</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalFinalLabel}>Total</Text>
            <Text style={styles.totalFinalValue}>{orderData.total?.toLocaleString()} FCFA</Text>
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium, gap: SPACING.sm,
  },
  backBtn: { marginRight: SPACING.sm },
  backIcon: { fontSize: 22, color: COLORS.text },
  title: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: "800", color: COLORS.text },
  statusBadge: { backgroundColor: "#FFF3E0", borderRadius: RADIUS.round, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  statusText: { color: "#E65100", fontSize: FONTS.sizes.xs, fontWeight: "700" },
  mapContainer: {
    height: 250,
    width: "100%",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  homeMarker: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.white,
  },
  driverMarker: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.white,
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.success,
  },
  driverMarkerImg: { width: 34, height: 34, borderRadius: 17 },
  driverMarkerDot: {
    position: "absolute", bottom: -2, right: -2,
    width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success,
    borderWidth: 2, borderColor: COLORS.white,
  },
  mapOverlay: {
    position: "absolute", bottom: 10, left: 10, backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.round,
  },
  mapOverlayText: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  card: {
    backgroundColor: COLORS.white, margin: SPACING.md, marginBottom: 0,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardSectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: "800", color: COLORS.textSecondary, marginBottom: SPACING.md, textTransform: "uppercase" },
  trackingCard: {
    backgroundColor: COLORS.white, margin: SPACING.md, marginBottom: 0,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
  },
  trackingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
  etaBadge: { backgroundColor: COLORS.primary + "10", paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.round },
  etaText: { color: COLORS.primary, fontWeight: "800", fontSize: 13 },
  cardTitle: { fontSize: FONTS.sizes.md, fontWeight: "800", color: COLORS.text },
  steps: { gap: 0 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md },
  stepLeft: { alignItems: "center", width: 32 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.grayLight,
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.grayMedium,
  },
  stepDotDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  stepDotText: { fontSize: 14 },
  stepLine: { width: 2, height: 24, backgroundColor: COLORS.grayMedium, marginTop: 2 },
  stepLineDone: { backgroundColor: COLORS.primary },
  stepLabel: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, paddingTop: 6, paddingBottom: SPACING.md },
  stepLabelActive: { color: COLORS.text, fontWeight: "800" },
  stepLabelDone: { color: COLORS.text, fontWeight: "600" },
  driverRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  driverAvatarImg: { width: 56, height: 56, borderRadius: 28 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.text },
  driverVehicle: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  driverRatingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  driverRatingText: { fontSize: FONTS.sizes.xs, color: COLORS.text, fontWeight: "600" },
  driverActions: { flexDirection: "row" },
  actionBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.grayLight, alignItems: "center", justifyContent: "center",
  },

  addressRow: { flexDirection: "row", gap: SPACING.sm, alignItems: "flex-start" },
  addressText: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.text, lineHeight: 20 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium, gap: SPACING.sm },
  itemQty: { width: 28, fontSize: FONTS.sizes.sm, fontWeight: "700", color: COLORS.primary },
  itemName: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.text },
  itemPrice: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.text },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  totalRowFinal: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.grayMedium },
  totalLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  totalValue: { fontSize: FONTS.sizes.sm, color: COLORS.text },
  totalFinalLabel: { fontSize: FONTS.sizes.md, fontWeight: "800", color: COLORS.text },
  totalFinalValue: { fontSize: FONTS.sizes.md, fontWeight: "800", color: COLORS.primary },
  otpCard: { backgroundColor: COLORS.primary + "08", borderColor: COLORS.primary + "20", borderWidth: 1 },
  otpHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  otpTitle: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
  otpDesc: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 15, lineHeight: 18 },
  otpCodeContainer: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: "center", borderStyle: "dashed", borderWidth: 2, borderColor: COLORS.primary },
  otpCodeText: { fontSize: 28, fontWeight: "900", color: COLORS.primary, letterSpacing: 4 },
})
