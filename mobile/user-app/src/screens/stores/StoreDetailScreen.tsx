import React, { useState, useEffect } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Dimensions, Alert, Image
} from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { useStore } from "../../store/useStore"
import { storesAPI } from "../../services/api"
import { Ionicons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

const CATEGORY_IMAGES: Record<string, string> = {
  "Cahiers": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400",
  "Livres": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
  "Geometrie": "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400",
  "Fournitures": "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
  "Art & Creativite": "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400",
}
// Mock products removed — now using real API data with state

export default function StoreDetailScreen({ route, navigation }: any) {
  const { store } = route.params || {}
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("Tous")
  
  const addToCart = useStore((s) => s.addToCart)
  const cartCount = useStore((s) => s.cartCount)()
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const isFavorite = useStore((s) => s.isFavorite)

  useEffect(() => {
    if (store?.id) loadProducts()
  }, [store?.id])

  async function loadProducts() {
    try {
      setIsLoading(true)
      const res = await storesAPI.getProducts(store.id)
      setProducts(res.data.products || res.data)
    } catch (err) {
      console.error("[StoreDetailData]", err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const categories = ["Tous", ...Array.from(new Set(products.map(p => p.category)))]
  
  const filteredProducts = activeCategory === "Tous" 
    ? products 
    : products.filter(p => p.category === activeCategory)

  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Magasin introuvable</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleAddToCart = (product: any) => {
    addToCart({
      ...product,
      quantity: 1,
      storeId: store.id,
      storeName: store.name,
    })
    Alert.alert("Panier", `${product.name} ajouté au panier !`)
  }

  return (
    <View style={styles.container}>
      {/* Header with Background */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.navigate("Cart")}>
            <Ionicons name="cart" size={24} color={COLORS.text} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.storeEmojiContainer}>
          <Text style={styles.storeEmoji}>{store.emoji || "🏪"}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Store Info */}
        <View style={styles.storeInfo}>
          <View style={styles.storeTitleRow}>
            <Text style={styles.storeName}>{store.name}</Text>
            {store.tag && (
              <View style={[styles.storeTag, store.tag === "Nouveau" ? { backgroundColor: "#E3F2FD" } : { backgroundColor: "#FFF8E1" }]}>
                <Text style={[styles.storeTagText, store.tag === "Nouveau" ? { color: "#1565C0" } : { color: "#E65100" }]}>{store.tag}</Text>
              </View>
            )}
          </View>
          <Text style={styles.storeArea}><Ionicons name="location" size={12} color={COLORS.primary} /> {store.area}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}><Ionicons name="star" size={14} color={COLORS.secondary} /> {store.rating}</Text>
              <Text style={styles.statLabel}>Avis</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}><Ionicons name="time" size={14} color={COLORS.primary} /> {store.deliveryTime}</Text>
              <Text style={styles.statLabel}>Livraison</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{(store.minOrder || 0).toLocaleString()}F</Text>
              <Text style={styles.statLabel}>Min. Commande</Text>
            </View>
          </View>
        </View>

        {/* Categories Tabs */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm }}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products List */}
        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>{activeCategory} ({filteredProducts.length})</Text>
          <View style={styles.productGrid}>
            {filteredProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productImagePlaceholder}>
                  {(product.image || CATEGORY_IMAGES[product.category]) ? (
                    <Image source={{ uri: product.image || CATEGORY_IMAGES[product.category] }} style={{ width: "100%", height: "100%", borderRadius: RADIUS.sm }} />
                  ) : (
                    <Ionicons name="cube-outline" size={32} color={COLORS.grayMedium} />
                  )}
                  <TouchableOpacity 
                    style={styles.favBtn} 
                    onPress={() => toggleFavorite(product.id)}
                  >
                    <Ionicons 
                      name={isFavorite(product.id) ? "heart" : "heart-outline"} 
                      size={18} 
                      color={isFavorite(product.id) ? COLORS.danger : COLORS.gray} 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <View style={styles.productFooter}>
                  <Text style={styles.productPrice}>{(product.price || 0).toLocaleString()} F</Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(product)}>
                    <Ionicons name="add" size={20} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Floating View Cart Button if cart is not empty */}
      {cartCount > 0 && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity style={styles.floatingCartBtn} onPress={() => navigation.navigate("Cart")}>
            <View style={styles.cartCountCircle}>
              <Text style={styles.cartCountText}>{cartCount}</Text>
            </View>
            <Text style={styles.floatingCartText}>Voir le panier</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  errorText: { fontSize: FONTS.sizes.lg, fontWeight: "700", color: COLORS.text },
  backBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  backBtnText: { color: COLORS.white, fontWeight: "600" },
  header: {
    backgroundColor: COLORS.primaryLight + "20",
    paddingTop: 56,
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative'
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
  },
  circleBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  badge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: COLORS.danger, borderRadius: RADIUS.round,
    minWidth: 18, height: 18, alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: "700" },
  storeEmojiContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: -40, // Pulls the info card up
  },
  storeEmoji: { fontSize: 72 },
  scrollContent: { paddingTop: 20 },
  storeInfo: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  storeTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: SPACING.sm },
  storeName: { flex: 1, fontSize: FONTS.sizes.xl, fontWeight: "800", color: COLORS.text },
  storeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.round },
  storeTagText: { fontSize: FONTS.sizes.xs, fontWeight: "700" },
  storeArea: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 4 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.text },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 4 },
  separator: { width: 1, height: 30, backgroundColor: COLORS.grayLight },
  categoriesContainer: { marginTop: SPACING.xl },
  categoryTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
  },
  categoryTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryTabText: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.textSecondary },
  categoryTabTextActive: { color: COLORS.white },
  productsContainer: { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.md },
  productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: SPACING.sm },
  productCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    marginBottom: SPACING.sm,
  },
  productImagePlaceholder: {
    width: "100%", height: 100,
    backgroundColor: COLORS.grayLight,
    borderRadius: RADIUS.sm,
    alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  favBtn: {
    position: "absolute", top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  productName: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.text, height: 36 },

  productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  productPrice: { fontSize: FONTS.sizes.md, fontWeight: "800", color: COLORS.primary },
  addBtn: {
    backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: RADIUS.round,
    alignItems: "center", justifyContent: "center"
  },
  floatingCartContainer: {
    position: "absolute", bottom: SPACING.xl, left: 0, right: 0,
    paddingHorizontal: SPACING.lg,
  },
  floatingCartBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: SPACING.md, borderRadius: RADIUS.lg,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  cartCountCircle: {
    backgroundColor: COLORS.white, width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  cartCountText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: "800" },
  floatingCartText: { flex: 1, textAlign: "center", color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: "700" },
})
