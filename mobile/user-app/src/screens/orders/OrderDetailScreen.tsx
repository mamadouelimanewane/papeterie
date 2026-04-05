import React, { useState } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Linking, Dimensions, Image, Alert
} from "react-native"

import MapView, { Marker, Polyline } from "react-native-maps"
import { Ionicons } from "@expo/vector-icons"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"


const { width } = Dimensions.get("window")

const STEPS = [
  { id: 1, label: "Commande confirmée", icon: "✅", done: true },
  { id: 2, label: "En préparation", icon: "📦", done: true },
  { id: 3, label: "Livreur assigné", icon: "🛵", done: true },
  { id: 4, label: "En route vers vous", icon: "📍", done: false, active: true },
  { id: 5, label: "Livré", icon: "🏠", done: false },
]

export default function OrderDetailScreen({ route, navigation }: any) {
  const order = route?.params?.order ?? {
    id: "ORD-1234",
    store: "Mon École - Plateau",
    date: "15 Mars 2026, 10:35",
    status: "delivering",
    total: 12500,
    deliveryFee: 500,
    address: "Cité Fadia, Appartement B4, Dakar",
    driver: { 
      name: "Mamadou Lamine Diallo", 
      phone: "+221 77 000 00 01", 
      rating: 4.9, 
      vehicle: "Moto — DK 1234 AB",
      avatar: require("../../assets/images/driver_avatar.png")
    },
    items: [
      { name: "Cahier 200 pages", qty: 2, price: 1500 },
      { name: "Kit de géométrie", qty: 1, price: 2500 },
      { name: "Calculatrice Scientifique", qty: 1, price: 7000 },
    ],
  }

  const items = order?.items || []
  const subtotal = items.reduce((sum: number, i: any) => sum + (i.price * i.qty), 0)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Suivi de commande {order.id}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>En route</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* MapView at the top */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 14.7167,
              longitude: -17.4677,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Delivery Destination */}
            <Marker coordinate={{ latitude: 14.7360, longitude: -17.4580 }}>
              <View style={styles.homeMarker}>
                <Ionicons name="home" size={16} color={COLORS.white} />
              </View>
            </Marker>

            {/* Driver Position */}
            <Marker coordinate={{ latitude: 14.7250, longitude: -17.4620 }}>
              <View style={styles.driverMarker}>
                <Image source={order.driver.avatar} style={styles.driverMarkerImg} />
                <View style={styles.driverMarkerDot} />
              </View>
            </Marker>

            {/* Path */}
            <Polyline
              coordinates={[
                { latitude: 14.7250, longitude: -17.4620 },
                { latitude: 14.7360, longitude: -17.4580 },
              ]}
              strokeColor={COLORS.primary}
              strokeWidth={4}
              lineDashPattern={[5, 5]}
            />
          </MapView>
          <View style={styles.mapOverlay}>
             <Text style={styles.mapOverlayText}>Livreur en approche</Text>
          </View>
        </View>

        {/* Suivi en temps réel */}
        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
             <Text style={styles.cardTitle}>📦 Statut de livraison</Text>
             <View style={styles.etaBadge}>
                <Text style={styles.etaText}>12 min</Text>
             </View>
          </View>
          <View style={styles.steps}>
            {STEPS.map((step, idx) => (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepDot, step.done && styles.stepDotDone, step.active && styles.stepDotActive]}>
                    <Text style={styles.stepDotText}>{step.done || step.active ? step.icon : ""}</Text>
                  </View>
                  {idx < STEPS.length - 1 && <View style={[styles.stepLine, step.done && styles.stepLineDone]} />}
                </View>
                <Text style={[styles.stepLabel, step.active && styles.stepLabelActive, step.done && styles.stepLabelDone]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Livreur */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Votre livreur</Text>
          <View style={styles.driverRow}>
            <Image source={order.driver.avatar} style={styles.driverAvatarImg} />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{order.driver.name}</Text>
              <Text style={styles.driverVehicle}>{order.driver.vehicle}</Text>
              <View style={styles.driverRatingRow}>
                <Ionicons name="star" size={12} color={COLORS.secondary} />
                <Text style={styles.driverRatingText}>{order.driver.rating}</Text>
              </View>
            </View>
            <View style={styles.driverActions}>
               <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${order.driver.phone}`)}>
                 <Ionicons name="call" size={20} color={COLORS.success} />
               </TouchableOpacity>
               <TouchableOpacity style={[styles.actionBtn, { marginLeft: 10 }]} onPress={() => Alert.alert("Chat", "Le chat avec le livreur sera disponible bientôt !")}>
                 <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
               </TouchableOpacity>
            </View>
          </View>
        </View>


        {/* Adresse */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Adresse de livraison</Text>
          <View style={styles.addressRow}>
            <Text style={{ fontSize: 20 }}>📍</Text>
            <Text style={styles.addressText}>{order.address}</Text>
          </View>
        </View>

        {/* Articles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Articles commandés</Text>
          {order.items.map((item: any, idx: number) => (
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
            <Text style={styles.totalValue}>{order.deliveryFee.toLocaleString()} FCFA</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalFinalLabel}>Total</Text>
            <Text style={styles.totalFinalValue}>{order.total.toLocaleString()} FCFA</Text>
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
})
