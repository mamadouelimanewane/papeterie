import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
  Dimensions,
  SafeAreaView,
} from "react-native"
import MapView, { Marker, Polyline } from "react-native-maps"
import { useDriverStore } from "../../store/useDriverStore"
import { Ionicons } from "@expo/vector-icons"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"

const { width } = Dimensions.get("window")

const STEPS = [
  { key: "accepted", label: "Collecte", icon: "storefront", desc: "Aller au magasin" },
  { key: "pickedup", label: "Livraison", icon: "bicycle", desc: "Aller chez le client" },
  { key: "delivered", label: "Terminé", icon: "checkmark-circle", desc: "Remis en main propre" },
]

export default function ActiveDeliveryScreen({ navigation }: any) {
  const { currentOrder, setCurrentOrder, completeDelivery } = useDriverStore()
  const [step, setStep] = useState(0)

  if (!currentOrder) {
    navigation.goBack()
    return null
  }

  const handleNextStep = () => {
    if (step === 0) {
      setCurrentOrder({ ...currentOrder, status: "pickedup" })
      setStep(1)
    } else if (step === 1) {
      setCurrentOrder({ ...currentOrder, status: "delivered" })
      setStep(2)
    } else {
      Alert.alert(
        "Livraison terminée ! 🎉",
        `Gains confirmés : ${currentOrder.earnings.toLocaleString()} FCFA.\nBeau travail !`,
        [
          {
            text: "C'est parti !",
            onPress: () => {
              completeDelivery()
              navigation.navigate("Home")
            },
          },
        ]
      )
    }
  }

  const callCustomer = () => {
    Linking.openURL(`tel:${currentOrder.customerPhone}`)
  }

  const openMaps = (address: string) => {
    const encoded = encodeURIComponent(address)
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`)
  }

  const btnColors = [COLORS.warning, COLORS.primary, COLORS.success]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Real MapView */}
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
            {/* Store Marker */}
            <Marker coordinate={{ latitude: 14.7167, longitude: -17.4677 }}>
              <View style={[styles.markerBody, { backgroundColor: COLORS.warning, borderColor: COLORS.white }]}>
                <Ionicons name="storefront" size={16} color={COLORS.white} />
              </View>
            </Marker>

            {/* Delivery Marker */}
            <Marker coordinate={{ latitude: 14.7360, longitude: -17.4580 }}>
              <View style={[styles.markerBody, { backgroundColor: COLORS.primary, borderColor: COLORS.white }]}>
                <Ionicons name="home" size={16} color={COLORS.white} />
              </View>
            </Marker>

            {/* Driver Marker */}
            <Marker coordinate={{ latitude: 14.7200, longitude: -17.4600 }}>
              <View style={[styles.markerBody, { backgroundColor: COLORS.success, borderColor: COLORS.white, width: 40, height: 40, borderRadius: 20 }]}>
                 <Ionicons name="bicycle" size={20} color={COLORS.white} />
              </View>
            </Marker>

            <Polyline
              coordinates={[
                { latitude: 14.7167, longitude: -17.4677 },
                { latitude: 14.7200, longitude: -17.4600 },
                { latitude: 14.7360, longitude: -17.4580 },
              ]}
              strokeColor={COLORS.primary}
              strokeWidth={4}
              lineDashPattern={[5, 5]}
            />
          </MapView>
          
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
             <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressLineBg}>
             <View style={[styles.progressLineFill, { width: `${(step / 2) * 100}%` }]} />
          </View>
          <View style={styles.progressDotsRow}>
            {STEPS.map((s, i) => (
              <View key={s.key} style={styles.dotContainer}>
                <View style={[
                  styles.progressDot,
                  i <= step ? styles.progressDotActive : styles.progressDotInactive
                ]}>
                  <Ionicons name={s.icon as any} size={14} color={COLORS.white} />
                </View>
                <Text style={[styles.dotLabel, i <= step && styles.dotLabelActive]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Current task details */}
        <View style={styles.infoCard}>
           <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>MISSION ACTUELLE</Text>
              <Text style={styles.infoTitle}>{STEPS[step].desc}</Text>
           </View>
           <TouchableOpacity style={styles.navCircle} onPress={() => openMaps(step === 0 ? currentOrder.storeAddress : currentOrder.deliveryAddress)}>
              <Ionicons name="navigate" size={24} color={COLORS.white} />
           </TouchableOpacity>
        </View>

        {/* Order Card */}
        <View style={styles.detailsCard}>
           <View style={styles.cardHeader}>
              <Text style={styles.orderId}>{currentOrder.id}</Text>
              <Text style={styles.orderPrice}>{currentOrder.earnings.toLocaleString()} F</Text>
           </View>
           <View style={styles.addressSection}>
              <View style={styles.addressRow}>
                 <View style={[styles.smallDot, { backgroundColor: COLORS.warning }]} />
                 <View style={styles.addressInfo}>
                    <Text style={styles.addrType}>Ramassage</Text>
                    <Text style={styles.addrText}>{currentOrder.storeAddress}</Text>
                 </View>
              </View>
              <View style={styles.verticalLink} />
              <View style={styles.addressRow}>
                 <View style={[styles.smallDot, { backgroundColor: COLORS.primary }]} />
                 <View style={styles.addressInfo}>
                    <Text style={styles.addrType}>Destination</Text>
                    <Text style={styles.addrText}>{currentOrder.deliveryAddress}</Text>
                 </View>
              </View>
           </View>
        </View>

        {/* Client Row */}
        <View style={styles.customerRow}>
           <View style={styles.customerAvatar}>
              <Text style={styles.avatarText}>{currentOrder.customerName.charAt(0)}</Text>
           </View>
           <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{currentOrder.customerName}</Text>
              <Text style={styles.customerRating}>⭐ 4.9 · Client Premium</Text>
           </View>
           <TouchableOpacity style={styles.phoneBtn} onPress={callCustomer}>
              <Ionicons name="call" size={20} color={COLORS.success} />
           </TouchableOpacity>
        </View>

        {/* Full Width Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.mainActionBtn, { backgroundColor: btnColors[step] }]}
            onPress={handleNextStep}
            activeOpacity={0.8}
          >
            <View style={styles.btnContent}>
               <Text style={styles.actionBtnText}>
                 {step === 0 ? "J'AI RÉCUPÉRÉ LE COLIS" : step === 1 ? "CONFIRMER LA LIVRAISON" : "TERMINER LA MISSION"}
               </Text>
               <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapContainer: { height: 300, width: "100%" },
  map: { ...StyleSheet.absoluteFillObject },
  backBtn: { 
    position: "absolute", top: 20, left: 20, 
    width: 44, height: 44, borderRadius: 22, 
    backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  markerBody: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
  },
  progressSection: { backgroundColor: COLORS.white, paddingVertical: 25, paddingHorizontal: 30 },
  progressLineBg: { position: "absolute", top: 40, left: 60, right: 60, height: 4, backgroundColor: COLORS.grayLight, borderRadius: 2 },
  progressLineFill: { height: "100%", backgroundColor: COLORS.success, borderRadius: 2 },
  progressDotsRow: { flexDirection: "row", justifyContent: "space-between" },
  dotContainer: { alignItems: "center" },
  progressDot: { 
    width: 34, height: 34, borderRadius: 17, 
    alignItems: "center", justifyContent: "center", zIndex: 10 
  },
  progressDotActive: { backgroundColor: COLORS.success },
  progressDotInactive: { backgroundColor: COLORS.grayMedium },
  dotLabel: { fontSize: 10, fontWeight: "700", color: COLORS.textSecondary, marginTop: 8 },
  dotLabelActive: { color: COLORS.text },
  infoCard: {
    flexDirection: "row", alignItems: "center",
    margin: SPACING.md, backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: "900", color: COLORS.textSecondary, letterSpacing: 1 },
  infoTitle: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text, marginTop: 4 },
  navCircle: { 
    width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  detailsCard: { 
    marginHorizontal: SPACING.md, backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md 
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  orderId: { fontSize: FONTS.sizes.md, fontWeight: "800", color: COLORS.text },
  orderPrice: { fontSize: FONTS.sizes.md, fontWeight: "900", color: COLORS.success },
  addressSection: { gap: 0 },
  addressRow: { flexDirection: "row", gap: 15, alignItems: "center" },
  smallDot: { width: 10, height: 10, borderRadius: 5 },
  addressInfo: { flex: 1 },
  addrType: { fontSize: 10, fontWeight: "700", color: COLORS.textSecondary, textTransform: "uppercase" },
  addrText: { fontSize: FONTS.sizes.sm, color: COLORS.text, marginTop: 2 },
  verticalLink: { width: 2, height: 30, backgroundColor: COLORS.grayLight, marginLeft: 4 },
  customerRow: {
    flexDirection: "row", alignItems: "center", marginHorizontal: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, gap: 15,
  },
  customerAvatar: { 
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryLight,
    alignItems: "center", justifyContent: "center" 
  },
  avatarText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: "800" },
  customerInfo: { flex: 1 },
  customerName: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.text },
  customerRating: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  phoneBtn: { 
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.success + "15",
    alignItems: "center", justifyContent: "center" 
  },
  actionContainer: { padding: SPACING.lg },
  mainActionBtn: { borderRadius: RADIUS.lg, paddingVertical: 18, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  btnContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  actionBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
})

