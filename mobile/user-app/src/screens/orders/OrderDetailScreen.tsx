import React, { useState } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Linking, Dimensions,
} from "react-native"
import MapView, { Marker, Polyline } from "react-native-maps"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"

const { width } = Dimensions.get("window")

const STEPS = [
  { id: 1, label: "Commande confirmée", icon: "✅", done: true },
  { id: 2, label: "En préparation", icon: "👨‍🍳", done: true },
  { id: 3, label: "Livreur assigné", icon: "🛵", done: true },
  { id: 4, label: "En route vers vous", icon: "📍", done: false, active: true },
  { id: 5, label: "Livré", icon: "🏠", done: false },
]

export default function OrderDetailScreen({ route, navigation }: any) {
  const order = route?.params?.order ?? {
    id: "ORD-1234",
    store: "Marché Keur Massar",
    date: "15 Mars 2026, 10:35",
    status: "delivering",
    total: 12500,
    deliveryFee: 500,
    address: "Cité Fadia, Appartement B4, Dakar",
    driver: { name: "Mamadou Lamine Diallo", phone: "+221 77 000 00 01", rating: 4.9, vehicle: "Moto — DK 1234 AB" },
    items: [
      { name: "Légumes assortis", qty: 2, price: 2500 },
      { name: "Poulet entier 1kg", qty: 1, price: 5000 },
      { name: "Oignons 1kg", qty: 2, price: 1000 },
      { name: "Huile de palme 1L", qty: 1, price: 1500 },
    ],
  }

  const subtotal = order.items.reduce((sum: number, i: any) => sum + i.price * i.qty, 0)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Commande {order.id}</Text>
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
            {/* Delivery Designation */}
            <Marker coordinate={{ latitude: 14.7360, longitude: -17.4580 }} title="Ma position">
              <View style={[styles.markerBody, { backgroundColor: "#6B6BD5" }]}>
                <Text style={{ fontSize: 16 }}>🏠</Text>
              </View>
            </Marker>

            {/* Driver Position */}
            <Marker coordinate={{ latitude: 14.7200, longitude: -17.4600 }} title="Livreur en approche">
              <View style={[styles.markerBody, { backgroundColor: "#4CAF50" }]}>
                <Text style={{ fontSize: 16 }}>🛵</Text>
              </View>
            </Marker>

            {/* Path */}
            <Polyline
              coordinates={[
                { latitude: 14.7200, longitude: -17.4600 },
                { latitude: 14.7360, longitude: -17.4580 },
              ]}
              strokeColor="#1A237E"
              strokeWidth={4}
              lineDashPattern={[5, 3]}
            />
          </MapView>
        </View>

        {/* Suivi en temps réel */}
        <View style={styles.trackingCard}>
          <Text style={styles.cardTitle}>🛵 Suivi en temps réel</Text>
          <Text style={styles.eta}>Arrivée estimée : <Text style={styles.etaTime}>15 min</Text></Text>
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
          <Text style={styles.cardTitle}>Votre livreur</Text>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={{ fontSize: 28 }}>🛵</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{order.driver.name}</Text>
              <Text style={styles.driverVehicle}>{order.driver.vehicle}</Text>
              <Text style={styles.driverRating}>⭐ {order.driver.rating}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${order.driver.phone}`)}>
              <Text style={{ fontSize: 22 }}>📞</Text>
            </TouchableOpacity>
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
  markerBody: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  card: {
    backgroundColor: COLORS.white, margin: SPACING.md, marginBottom: 0,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  trackingCard: {
    backgroundColor: COLORS.white, margin: SPACING.md, marginBottom: 0,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  cardTitle: { fontSize: FONTS.sizes.md, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.md },
  eta: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  etaTime: { color: COLORS.primary, fontWeight: "800" },
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
  stepLabelActive: { color: COLORS.secondary, fontWeight: "700" },
  stepLabelDone: { color: COLORS.text, fontWeight: "600" },
  driverRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  driverAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#EDE7F6", alignItems: "center", justifyContent: "center",
  },
  driverInfo: { flex: 1 },
  driverName: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.text },
  driverVehicle: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  driverRating: { fontSize: FONTS.sizes.xs, color: COLORS.text, marginTop: 2 },
  callBtn: {
    width: 48, height: 48, borderRadius: RADIUS.round,
    backgroundColor: "#E8F5E9", alignItems: "center", justifyContent: "center",
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
