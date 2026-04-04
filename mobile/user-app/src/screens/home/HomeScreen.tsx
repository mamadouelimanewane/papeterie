import React, { useState, useRef } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Dimensions, Image, TextInput, Alert,
} from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { useStore } from "../../store/useStore"
import { Ionicons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

const BANNERS = [
  { id: "1", title: "Livres Scolaires\nMon École", subtitle: "De la maternelle à la terminale", bg: "#1A237E", emoji: "📚" },
  { id: "2", title: "Prêt pour la\nrentrée ?", subtitle: "Listes complètes disponibles en 1h", bg: "#283593", emoji: "🎒" },
  { id: "3", title: "Géométrie &\nCalculs", subtitle: "Matériel de précision et calculatrices", bg: "#3949AB", emoji: "📐" },
]

const CATEGORIES = [
  { id: "1", name: "Livres", emoji: "📖", color: "#E8EAF6" },
  { id: "2", name: "Cahiers", emoji: "📓", color: "#EDE7F6" },
  { id: "3", name: "Stylos", emoji: "🖋️", color: "#F3E5F5" },
  { id: "4", name: "Géométrie", emoji: "📏", color: "#E1F5FE" },
  { id: "5", name: "Sacs", emoji: "🎒", color: "#E0F2F1" },
  { id: "6", name: "Art", emoji: "🎨", color: "#F1F8E9" },
  { id: "7", name: "Révision", emoji: "📝", color: "#F9FBE7" },
  { id: "8", name: "Calcul", emoji: "🧮", color: "#FFF3E0" },
]

const STORES = [
  { id: "1", name: "Mon École - Plateau", area: "Dakar Plateau", rating: 4.9, orders: 1248, deliveryTime: "15-30 min", minOrder: 5000, emoji: "🏫", tag: "Principal" },
  { id: "2", name: "Librairie Papeterie", area: "Dakar Centre", rating: 4.8, orders: 2150, deliveryTime: "20-35 min", minOrder: 3000, emoji: "📚", tag: "Populaire" },
]

export default function HomeScreen({ navigation }: any) {
  const [bannerIndex, setBannerIndex] = useState(0)
  const [search, setSearch] = useState("")
  const user = useStore((s) => s.user)
  const cartCount = useStore((s) => s.cartCount)()
  const unreadCount = useStore((s) => s.unreadCount)

  const handleDev = () => {
    Alert.alert("En développement", "Cette fonctionnalité sera bientôt disponible !")
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.name?.split(" ")[0] || "Bienvenue"} 👋</Text>
          <TouchableOpacity style={styles.locationRow} onPress={handleDev}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={styles.locationText}>Dakar, Sénégal</Text>
            <Ionicons name="chevron-down" size={12} color={COLORS.primary} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications" size={20} color={COLORS.primary} />
            {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Cart")}>
            <Ionicons name="cart" size={20} color={COLORS.primary} />
            {cartCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={COLORS.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher produits, marchés..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={COLORS.gray}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={handleDev}>
            <Ionicons name="options" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Banners */}
        <FlatList
          data={BANNERS}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.id}
          onMomentumScrollEnd={(e) => setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.md }}
          renderItem={({ item }) => (
            <View style={[styles.banner, { backgroundColor: item.bg, width: width - 32 }]}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>{item.title}</Text>
                <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                <TouchableOpacity style={styles.bannerBtn} onPress={handleDev}>
                  <Text style={styles.bannerBtnText}>Commander →</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.bannerEmoji}>{item.emoji}</Text>
            </View>
          )}
        />
        {/* Dots */}
        <View style={styles.dots}>
          {BANNERS.map((_, i) => (
            <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
          ))}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Catégories</Text>
            <TouchableOpacity onPress={handleDev}><Text style={styles.seeAll}>Voir tout</Text></TouchableOpacity>
          </View>
          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm }}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.categoryCard, { backgroundColor: item.color }]} onPress={handleDev}>
                <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                <Text style={styles.categoryName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Nearby Stores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Marchés à proximité</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Stores")}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: SPACING.lg, gap: SPACING.md }}>
            {STORES.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={styles.storeCard}
                onPress={() => navigation.navigate("StoreDetail", { store })}
              >
                <View style={styles.storeImagePlaceholder}>
                  <Text style={styles.storeEmoji}>{store.emoji}</Text>
                </View>
                <View style={styles.storeInfo}>
                  <View style={styles.storeNameRow}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    {store.tag && (
                      <View style={[styles.storeTag, store.tag === "Nouveau" ? { backgroundColor: "#E3F2FD" } : { backgroundColor: "#FFF8E1" }]}>
                        <Text style={[styles.storeTagText, store.tag === "Nouveau" ? { color: "#1565C0" } : { color: "#E65100" }]}>{store.tag}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.storeArea}><Ionicons name="location" size={10} /> {store.area}</Text>
                  <View style={styles.storeStats}>
                    <Text style={styles.storeRating}><Ionicons name="star" size={10} color={COLORS.secondary} /> {store.rating}</Text>
                    <Text style={styles.storeSep}>·</Text>
                    <Text style={styles.storeDelivery}><Ionicons name="time" size={10} /> {store.deliveryTime}</Text>
                    <Text style={styles.storeSep}>·</Text>
                    <Text style={styles.storeMin}>Min: {store.minOrder.toLocaleString()} FCFA</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium,
  },
  greeting: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 2, gap: 2 },
  locationIcon: { fontSize: 13 },
  locationText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  locationChevron: { color: COLORS.primary, fontSize: 10, marginLeft: 2 },
  headerActions: { flexDirection: "row", gap: SPACING.sm },
  iconBtn: { position: "relative", padding: 6, backgroundColor: COLORS.grayLight, borderRadius: RADIUS.round },
  iconBtnIcon: { fontSize: 20 },
  badge: {
    position: "absolute", top: -2, right: -2,
    backgroundColor: COLORS.danger, borderRadius: RADIUS.round,
    minWidth: 16, height: 16, alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: "700" },
  searchContainer: { flexDirection: "row", gap: SPACING.sm, padding: SPACING.lg, backgroundColor: COLORS.white },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    backgroundColor: COLORS.grayLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, height: 46,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.text },
  filterBtn: {
    width: 46, height: 46, backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center",
  },
  banner: {
    borderRadius: RADIUS.lg, padding: SPACING.lg, height: 160,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: SPACING.sm,
  },
  bannerContent: { flex: 1 },
  bannerTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: "800", lineHeight: 26 },
  bannerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: FONTS.sizes.sm, marginTop: 4, marginBottom: 12 },
  bannerBtn: {
    backgroundColor: "rgba(255,255,255,0.25)", borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md, paddingVertical: 6, alignSelf: "flex-start",
  },
  bannerBtnText: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: "600" },
  bannerEmoji: { fontSize: 64 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 4, marginTop: SPACING.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.grayMedium },
  dotActive: { width: 18, backgroundColor: COLORS.primary },
  section: { marginTop: SPACING.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  seeAll: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: "600" },
  categoryCard: { width: 72, height: 80, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", gap: 4 },
  categoryEmoji: { fontSize: 28 },
  categoryName: { fontSize: FONTS.sizes.xs, fontWeight: "600", color: COLORS.text, textAlign: "center" },
  storeCard: {
    flexDirection: "row", backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.md, gap: SPACING.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  storeImagePlaceholder: {
    width: 72, height: 72, borderRadius: RADIUS.md,
    backgroundColor: COLORS.grayLight, alignItems: "center", justifyContent: "center",
  },
  storeEmoji: { fontSize: 36 },
  storeInfo: { flex: 1, gap: 4 },
  storeNameRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  storeName: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.text },
  storeTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.round },
  storeTagText: { fontSize: FONTS.sizes.xs, fontWeight: "700" },
  storeArea: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  storeStats: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  storeRating: { fontSize: FONTS.sizes.xs, fontWeight: "600", color: COLORS.text },
  storeSep: { color: COLORS.gray, fontSize: FONTS.sizes.xs },
  storeDelivery: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  storeMin: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
})
