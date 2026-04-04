import React from "react"
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { useStore } from "../../store/useStore"
import { Ionicons } from "@expo/vector-icons"
import { ordersAPI } from "../../services/api"

export default function CartScreen({ navigation }: any) {
  const cart = useStore((s) => s.cart)
  const cartTotal = useStore((s) => s.cartTotal)()
  const updateQuantity = useStore((s) => s.updateQuantity)
  const removeFromCart = useStore((s) => s.removeFromCart)
  const clearCart = useStore((s) => s.clearCart)

  const DELIVERY_FEE = 500
  const FREE_DELIVERY_THRESHOLD = 10000
  const deliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE

  const handleCheckout = async () => {
    try {
      const orderData = {
        storeId: cart[0]?.storeId || "640000000000000000000000", // Fallback ID for Prisma
        total: cartTotal + deliveryFee,
        items: cart,
        address: "123 Client Address",
      }
      
      const res = await ordersAPI.create(orderData)
      
      Alert.alert(
        "Commande confirmée",
        `ID: ${res.data.orderId}\nTotal : ${(cartTotal + deliveryFee).toLocaleString()} FCFA`,
        [
          { text: "OK", onPress: () => {
            clearCart()
            navigation.navigate("Orders")
          }},
        ]
      )
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de passer la commande")
    }
  }

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color={COLORS.grayMedium} />
        <Text style={styles.emptyTitle}>Votre panier est vide</Text>
        <Text style={styles.emptySubtext}>Ajoutez des produits pour commencer</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.shopBtnText}>Parcourir les marchés</Text>
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

      {/* Store name */}
      {cart.length > 0 && (
        <View style={styles.storeBanner}>
          <Text style={styles.storeText}><Ionicons name="business" size={14} /> {cart[0].storeName}</Text>
        </View>
      )}

      <FlatList
        data={cart}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.md }}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemImagePlaceholder}>
              <Ionicons name="cube-outline" size={30} color={COLORS.grayMedium} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.price.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, styles.qtyBtnAdd]}
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <Text style={[styles.qtyBtnText, { color: COLORS.white }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Order Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Récapitulatif</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sous-total</Text>
          <Text style={styles.summaryValue}>{cartTotal.toLocaleString()} FCFA</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Livraison</Text>
          <Text style={[styles.summaryValue, deliveryFee === 0 && { color: COLORS.success }]}>
            {deliveryFee === 0 ? <><Ionicons name="sparkles" size={12} /> Gratuit</> : `${deliveryFee.toLocaleString()} FCFA`}
          </Text>
        </View>
        {cartTotal < FREE_DELIVERY_THRESHOLD && (
          <Text style={styles.freeDeliveryHint}>
            +{(FREE_DELIVERY_THRESHOLD - cartTotal).toLocaleString()} FCFA pour la livraison gratuite
          </Text>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{(cartTotal + deliveryFee).toLocaleString()} FCFA</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>Commander maintenant</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: SPACING.md, backgroundColor: COLORS.white },
  emptyEmoji: { fontSize: 72 },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: "800", color: COLORS.text },
  emptySubtext: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  shopBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: 14, marginTop: SPACING.sm },
  shopBtnText: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: "700" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: FONTS.sizes.xl, color: COLORS.text },
  title: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  clearText: { color: COLORS.danger, fontSize: FONTS.sizes.sm, fontWeight: "600" },
  storeBanner: { backgroundColor: COLORS.primaryLight + "15", padding: SPACING.md, paddingHorizontal: SPACING.lg },
  storeText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: "600" },
  cartItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemImagePlaceholder: { width: 60, height: 60, backgroundColor: COLORS.grayLight, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
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
  freeDeliveryHint: { fontSize: FONTS.sizes.xs, color: COLORS.warning, textAlign: "center" },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.grayMedium, paddingTop: SPACING.sm, marginTop: 4 },
  totalLabel: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  totalValue: { fontSize: FONTS.sizes.xl, fontWeight: "800", color: COLORS.primary },
  checkoutBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 52,
    alignItems: "center", justifyContent: "center", marginTop: SPACING.sm,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  checkoutText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: "700" },
})
