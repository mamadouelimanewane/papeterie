import React, { useState } from "react"
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, Modal, ScrollView
} from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { useStore } from "../../store/useStore"
import { Ionicons } from "@expo/vector-icons"
import { ordersAPI } from "../../services/api"

const PAYMENT_OPTIONS = [
  { id: "Cash", label: "Especes", subtitle: "Payer a la livraison", icon: "cash", color: "#27AE60" },
  { id: "Wallet", label: "Portefeuille", subtitle: "Paiement instantane", icon: "wallet", color: "#8B5CF6" },
  { id: "Wave", label: "Wave", subtitle: "Paiement mobile", icon: "phone-portrait", color: "#1B74E4" },
  { id: "Orange", label: "Orange Money", subtitle: "Paiement mobile", icon: "phone-portrait", color: "#FF6600" },
]

export default function CartScreen({ navigation }: any) {
  const cart = useStore((s) => s.cart)
  const cartTotal = useStore((s) => s.cartTotal)()
  const updateQuantity = useStore((s) => s.updateQuantity)
  const removeFromCart = useStore((s) => s.removeFromCart)
  const clearCart = useStore((s) => s.clearCart)
  const user = useStore((s) => s.user)

  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const DELIVERY_FEE = 500
  const FREE_DELIVERY_THRESHOLD = 10000
  const deliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE

  const selectedPayment = PAYMENT_OPTIONS.find(p => p.id === paymentMethod) ?? PAYMENT_OPTIONS[0]

  const handleCheckout = async () => {
    if (cart.length === 0) return

    // Verifier solde wallet si paiement par wallet
    if (paymentMethod === "Wallet") {
      const walletBalance = (user as any)?.walletMoney ?? (user as any)?.walletBalance ?? 0
      if (walletBalance < cartTotal + deliveryFee) {
        Alert.alert("Solde insuffisant", `Votre solde est de ${walletBalance.toLocaleString()} FCFA. Rechargez votre portefeuille.`, [
          { text: "Recharger", onPress: () => navigation.navigate("Wallet") },
          { text: "Annuler", style: "cancel" },
        ])
        return
      }
    }

    setIsLoading(true)
    try {
      const orderData = {
        storeId: cart[0].storeId,
        total: cartTotal + deliveryFee,
        subtotal: cartTotal,
        deliveryFee,
        paymentMethod,
        paymentStatus: paymentMethod === "Cash" ? "En attente" : "Paye",
        items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        address: "Dakar, " + ((user as any)?.address || "Adresse du profil"),
      }

      const res = await ordersAPI.create(orderData)

      Alert.alert(
        "Commande confirmee !",
        `Commande ${res.data.orderId}\nTotal : ${(cartTotal + deliveryFee).toLocaleString()} FCFA\nPaiement : ${selectedPayment.label}\n\nVotre livreur va bientot accepter la commande.`,
        [{ text: "Voir mes commandes", onPress: () => { clearCart(); navigation.navigate("Orders") } }]
      )
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de passer la commande")
    } finally {
      setIsLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color={COLORS.grayMedium} />
        <Text style={styles.emptyTitle}>Votre panier est vide</Text>
        <Text style={styles.emptySubtext}>Ajoutez des produits pour commencer</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.shopBtnText}>Parcourir les boutiques</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon Panier ({cart.length})</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Vider</Text>
        </TouchableOpacity>
      </View>

      {cart.length > 0 && (
        <View style={styles.storeBanner}>
          <Text style={styles.storeText}>
            <Ionicons name="business" size={14} /> {cart[0].storeName}
          </Text>
        </View>
      )}

      <FlatList
        data={cart}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.md }}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemImagePlaceholder}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
              ) : (
                <Ionicons name="cube-outline" size={30} color={COLORS.grayMedium} />
              )}
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.price.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                <Text style={[styles.qtyBtnText, { color: COLORS.white }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Recapitulatif</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sous-total</Text>
          <Text style={styles.summaryValue}>{cartTotal.toLocaleString()} FCFA</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Livraison</Text>
          <Text style={[styles.summaryValue, deliveryFee === 0 && { color: COLORS.success }]}>
            {deliveryFee === 0 ? "Gratuit" : `${deliveryFee.toLocaleString()} FCFA`}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{(cartTotal + deliveryFee).toLocaleString()} FCFA</Text>
        </View>

        {/* Payment method selector */}
        <TouchableOpacity style={[styles.paymentSelector, { borderColor: selectedPayment.color }]} onPress={() => setShowPaymentModal(true)}>
          <Ionicons name={selectedPayment.icon as any} size={22} color={selectedPayment.color} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.paymentLabel, { color: selectedPayment.color }]}>{selectedPayment.label}</Text>
            <Text style={styles.paymentSubtitle}>{selectedPayment.subtitle}</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={COLORS.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: selectedPayment.color }]} onPress={handleCheckout} disabled={isLoading}>
          <Text style={styles.checkoutText}>{isLoading ? "Commande en cours..." : "Commander maintenant"}</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPaymentModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mode de paiement</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {PAYMENT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.paymentOption, paymentMethod === opt.id && { borderColor: opt.color, backgroundColor: opt.color + "10" }]}
                onPress={() => { setPaymentMethod(opt.id); setShowPaymentModal(false) }}
              >
                <View style={[styles.paymentIconBox, { backgroundColor: opt.color + "20" }]}>
                  <Ionicons name={opt.icon as any} size={24} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentOptionLabel, { color: opt.color }]}>{opt.label}</Text>
                  <Text style={styles.paymentOptionSub}>{opt.subtitle}</Text>
                </View>
                {paymentMethod === opt.id && <Ionicons name="checkmark-circle" size={24} color={opt.color} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: SPACING.md, backgroundColor: COLORS.white },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: "800", color: COLORS.text },
  emptySubtext: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  shopBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: 14, marginTop: SPACING.sm },
  shopBtnText: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: "700" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium },
  backBtn: { padding: 4 },
  title: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  clearText: { color: COLORS.danger, fontSize: FONTS.sizes.sm, fontWeight: "600" },
  storeBanner: { backgroundColor: COLORS.primaryLight + "15", padding: SPACING.md, paddingHorizontal: SPACING.lg },
  storeText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: "600" },
  cartItem: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.md, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemImagePlaceholder: { width: 60, height: 60, backgroundColor: COLORS.grayLight, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  itemImage: { width: "100%", height: "100%", borderRadius: RADIUS.md },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FONTS.sizes.md, fontWeight: "600", color: COLORS.text },
  itemPrice: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.primary, marginTop: 4 },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  qtyBtn: { width: 30, height: 30, borderRadius: RADIUS.round, borderWidth: 1.5, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  qtyBtnAdd: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  qtyBtnText: { fontSize: FONTS.sizes.lg, fontWeight: "700", color: COLORS.text, lineHeight: 22 },
  qtyText: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.text, minWidth: 24, textAlign: "center" },
  summary: { backgroundColor: COLORS.white, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.grayMedium, gap: SPACING.sm },
  summaryTitle: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.text },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.grayMedium, paddingTop: SPACING.sm, marginTop: 4 },
  totalLabel: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  totalValue: { fontSize: FONTS.sizes.xl, fontWeight: "800", color: COLORS.primary },
  paymentSelector: { flexDirection: "row", alignItems: "center", gap: SPACING.md, borderWidth: 2, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: 4 },
  paymentLabel: { fontSize: FONTS.sizes.md, fontWeight: "700" },
  paymentSubtitle: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 1 },
  checkoutBtn: { borderRadius: RADIUS.md, height: 52, alignItems: "center", justifyContent: "center", marginTop: SPACING.sm, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  checkoutText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: "700" },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  modalBody: { padding: SPACING.lg, gap: SPACING.md },
  paymentOption: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.border },
  paymentIconBox: { width: 48, height: 48, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  paymentOptionLabel: { fontSize: FONTS.sizes.md, fontWeight: "700" },
  paymentOptionSub: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
})
