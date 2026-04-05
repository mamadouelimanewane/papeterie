import React, { useState, useEffect, useRef } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Dimensions, Image, TextInput, Alert,
  SafeAreaView
} from "react-native"

import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { useStore } from "../../store/useStore"
import { storesAPI, categoriesAPI, sliderAPI } from "../../services/api"
import { Ionicons } from "@expo/vector-icons"
import Skeleton from "../../components/ui/Skeleton"

const { width } = Dimensions.get("window")

// Mock constants removed — now using real API data with state

export default function HomeScreen({ navigation }: any) {
  const [banners, setBanners] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const user = useStore((s) => s.user)
  const cartCount = useStore((s) => s.cartCount)()
  const unreadCount = useStore((s) => s.unreadCount)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const [b, c, s] = await Promise.all([
        sliderAPI.getBanners(),
        categoriesAPI.getAll(),
        storesAPI.getAll(),
      ])
      setBanners(b.data.banners || b.data)
      setCategories(c.data.categories || c.data)
      setStores((s.data.stores || s.data).filter((x: any) => x.segment === "PAPETERIE"))
    } catch (err) {
      console.error("[HomeData]", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDev = () => {
    Alert.alert("En développement", "Cette fonctionnalité sera bientôt disponible !")
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={120} height={28} radius={4} />
          <Skeleton width={40} height={40} radius={20} />
        </View>
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: 10 }}>
          <Skeleton width="100%" height={50} radius={RADIUS.md} />
        </View>
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: 20 }}>
          <Skeleton width="100%" height={160} radius={RADIUS.lg} />
        </View>
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: 30, flexDirection: "row", gap: 15 }}>
          <Skeleton width={80} height={90} radius={RADIUS.md} />
          <Skeleton width={80} height={90} radius={RADIUS.md} />
          <Skeleton width={80} height={90} radius={RADIUS.md} />
          <Skeleton width={80} height={90} radius={RADIUS.md} />
        </View>
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: 30 }}>
           <Skeleton width={200} height={24} radius={4} />
           <View style={{ marginTop: 15, gap: 10 }}>
              <Skeleton width="100%" height={80} radius={RADIUS.lg} />
              <Skeleton width="100%" height={80} radius={RADIUS.lg} />
           </View>
        </View>
      </SafeAreaView>
    )
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
        <TouchableOpacity 
          style={styles.searchContainer} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Search")}
        >
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={COLORS.gray} />
            <Text style={styles.searchInputPlaceholder}>Rechercher produits, marchés...</Text>
          </View>
          <View style={styles.filterBtn}>
            <Ionicons name="options" size={20} color={COLORS.white} />
          </View>
        </TouchableOpacity>


        {/* Banners */}
        <FlatList
          data={banners}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.id}
          onMomentumScrollEnd={(e) => setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.md }}
          renderItem={({ item, index }) => (
            <View style={[styles.banner, { backgroundColor: index % 2 === 0 ? COLORS.primary : COLORS.primaryLight, width: width - 32 }]}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>{item.title}</Text>
                <Text style={styles.bannerSubtitle}>{item.subtitle || "Offre exclusive Papeterie"}</Text>
                <TouchableOpacity style={styles.bannerBtn} onPress={handleDev}>
                  <Text style={styles.bannerBtnText}>Commander →</Text>
                </TouchableOpacity>
              </View>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.bannerImg} />
              ) : (
                <Text style={styles.bannerEmoji}>📚</Text>
              )}
            </View>
          )}
        />
        {/* Dots */}
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
          ))}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Catégories Premium</Text>
            <TouchableOpacity onPress={handleDev}><Text style={styles.seeAll}>Voir tout</Text></TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm }}
            renderItem={({ item, index }) => (
              <TouchableOpacity 
                style={[styles.categoryCard, { backgroundColor: index % 2 === 0 ? "#E8EAF6" : "#F1F8E9" }]} 
                onPress={handleDev}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.categoryImg} />
                ) : (
                  <Text style={styles.categoryEmoji}>📝</Text>
                )}
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
            {stores.map((store) => (
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
                  <Text style={styles.storeArea}><Ionicons name="location" size={10} /> {store.serviceArea}</Text>
                  <View style={styles.storeStats}>
                    <Text style={styles.storeRating}><Ionicons name="star" size={10} color={COLORS.secondary} /> {store.rating}</Text>
                    <Text style={styles.storeSep}>·</Text>
                    <Text style={styles.storeDelivery}><Ionicons name="time" size={10} /> {store.deliveryTime}</Text>
                    <Text style={styles.storeSep}>·</Text>
                    <Text style={styles.storeMin}>Min: {(store.minOrder || 0).toLocaleString()} FCFA</Text>
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
  searchInputPlaceholder: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
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
  bannerImg: { width: 120, height: 120, resizeMode: "contain" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 4, marginTop: SPACING.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.grayMedium },
  dotActive: { width: 18, backgroundColor: COLORS.primary },
  section: { marginTop: SPACING.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  seeAll: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: "600" },
  categoryCard: { width: 80, height: 90, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", gap: 4 },
  categoryEmoji: { fontSize: 28 },
  categoryImg: { width: 44, height: 44, resizeMode: "contain" },
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
