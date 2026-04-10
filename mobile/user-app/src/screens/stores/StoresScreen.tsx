import React, { useState, useEffect } from "react"
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, SafeAreaView, ActivityIndicator
} from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { storesAPI } from "../../services/api"
import { Ionicons } from "@expo/vector-icons"

export default function StoresScreen({ navigation }: any) {
  const [stores, setStores] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadStores() }, [])

  async function loadStores() {
    try {
      setIsLoading(true)
      const res = await storesAPI.getAll()
      const all = res.data.stores || res.data
      setStores(all.filter((s: any) => s.segment === "PAPETERIE" && s.status === "Active"))
    } catch (err) {
      console.error("[StoresScreen]", err)
    } finally {
      setIsLoading(false)
    }
  }

  const EMOJIS = ["📚", "🖊️", "✏️", "📐", "🎨"]
  const filtered = stores.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.address || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nos Boutiques</Text>
        <Text style={styles.subtitle}>{stores.length} papeterie{stores.length > 1 ? "s" : ""} disponible{stores.length > 1 ? "s" : ""}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une boutique..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={COLORS.gray}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.md }}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={loadStores}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("StoreDetail", {
                store: {
                  ...item,
                  emoji: EMOJIS[index % EMOJIS.length],
                  area: item.address || "Dakar",
                  deliveryTime: "20-35 min",
                  minOrder: 0,
                }
              })}
            >
              <View style={styles.cardEmoji}>
                <Text style={styles.emoji}>{EMOJIS[index % EMOJIS.length]}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.storeName}>{item.name}</Text>
                <Text style={styles.storeAddr}>
                  <Ionicons name="location" size={12} color={COLORS.primary} /> {item.address || "Dakar"}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.rating}>⭐ {item.rating?.toFixed(1) || "5.0"}</Text>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.meta}>20-35 min</Text>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.meta}>Min: 0 FCFA</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="business-outline" size={60} color={COLORS.grayMedium} />
              <Text style={styles.emptyText}>Aucune boutique trouvée</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium },
  title: { fontSize: FONTS.sizes.xl, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, margin: SPACING.lg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 48 },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.text },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.md, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardEmoji: { width: 56, height: 56, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryLight + "20", alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  storeName: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.text },
  storeAddr: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  rating: { fontSize: FONTS.sizes.xs, color: COLORS.text },
  dot: { color: COLORS.gray },
  meta: { fontSize: FONTS.sizes.xs, color: COLORS.gray },
  empty: { alignItems: "center", paddingTop: 60, gap: SPACING.sm },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
})
