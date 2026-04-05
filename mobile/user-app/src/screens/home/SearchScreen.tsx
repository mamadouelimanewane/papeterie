import React, { useState, useEffect } from "react"
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Dimensions, ActivityIndicator
} from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { Ionicons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

const MOCK_PRODUCTS = [
  { id: "p1", name: "Cahier 200 pages quadrillé", price: 1500, store: "Mon École", category: "Cahiers" },
  { id: "p2", name: "Stylo à bille bleu (lot de 4)", price: 800, store: "Librairie Papeterie", category: "Stylos" },
  { id: "p3", name: "Kit de géométrie complet", price: 2500, store: "Mon École", category: "Géométrie" },
  { id: "p4", name: "Sac à dos d'école standard", price: 8500, store: "Mon École", category: "Sacs" },
  { id: "p5", name: "Calculatrice scientifique", price: 9500, store: "Librairie Papeterie", category: "Calcul" },
]

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    if (query.length > 1) {
      setLoading(true)
      const timer = setTimeout(() => {
        const filtered = MOCK_PRODUCTS.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
        )
        setResults(filtered)
        setLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setResults([])
    }
  }, [query])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.input}
            placeholder="Rechercher un article..."
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Recherche en cours...</Text>
        </View>
      ) : query.length > 1 && results.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={64} color={COLORS.grayMedium} />
          <Text style={styles.emptyText}>Aucun résultat pour "{query}"</Text>
        </View>
      ) : query.length <= 1 ? (
        <View style={styles.suggestContainer}>
          <Text style={styles.suggestTitle}>Suggestions</Text>
          <View style={styles.tags}>
            {["Cahiers", "Stylos", "Calculatrices", "Géométrie"].map(tag => (
              <TouchableOpacity key={tag} style={styles.tag} onPress={() => setQuery(tag)}>
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: SPACING.lg }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate("StoreDetail", { store: { id: "1", name: item.store, area: "Dakar", rating: 4.5, minOrder: 1000 } })}
            >
              <View style={styles.productInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.store}><Ionicons name="business" size={10} /> {item.store}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{item.price.toLocaleString()}F</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: "row", alignItems: "center", gap: SPACING.md,
    paddingTop: 56, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayLight,
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    backgroundColor: COLORS.grayLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, height: 44,
  },
  input: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.text },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  loadingText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, textAlign: "center", paddingHorizontal: 40 },
  suggestContainer: { padding: SPACING.lg },
  suggestTitle: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  tag: { paddingHorizontal: SPACING.md, paddingVertical: 8, backgroundColor: COLORS.grayLight, borderRadius: RADIUS.round },
  tagText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: "600" },
  card: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight,
  },
  productInfo: { flex: 1, gap: 4 },
  name: { fontSize: FONTS.sizes.md, fontWeight: "600", color: COLORS.text },
  store: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  priceContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  price: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.primary },
})
