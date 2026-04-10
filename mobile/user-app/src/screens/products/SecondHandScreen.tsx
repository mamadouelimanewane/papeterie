import React, { useState } from "react"
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, Image, TextInput, Alert
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"

const MOCK_USED_ITEMS = [
  { id: "u1", name: "Bescherelle Conjugaison", price: 2500, state: "Bon état", seller: "Ami #2", emoji: "📘" },
  { id: "u2", name: "Dictionnaire Larousse 2024", price: 5000, state: "Comme neuf", seller: "Étudiant B.", emoji: "📕" },
  { id: "u3", name: "Calculatrice Casio fx-92", price: 7500, state: "Usagé", seller: "Lycéen X", emoji: "📟" },
  { id: "u4", name: "Lot de 5 classeurs", price: 3000, state: "Bon état", seller: "Parent Y", emoji: "📁" },
]

export default function SecondHandScreen({ navigation }: any) {
  const [search, setSearch] = useState("")
  const [showSellModal, setShowSellModal] = useState(false)
  const [newItem, setNewItem] = useState({ name: "", price: "", state: "Bon état", emoji: "📚" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSell = async () => {
    if (!newItem.name || !newItem.price) {
      Alert.alert("Erreur", "Veuillez remplir le nom et le prix.")
      return
    }
    setIsSubmitting(true)
    // Simulation d'envoi API
    setTimeout(() => {
      setIsSubmitting(false)
      setShowSellModal(false)
      Alert.alert("Succès", "Votre annonce a été publiée ! Elle sera visible après validation.")
      setNewItem({ name: "", price: "", state: "Bon état", emoji: "📚" })
    }, 1500)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Le Coin Occasion ♻️</Text>
        <TouchableOpacity onPress={() => setShowSellModal(true)}>
           <Text style={styles.sellText}>Vendre</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.gray} />
        <TextInput 
          placeholder="Chercher un livre, du matériel..." 
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={MOCK_USED_ITEMS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))}
        keyExtractor={(i) => i.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => {}}>
            <View style={styles.emojiContainer}>
               <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <View style={styles.info}>
               <View style={styles.stateBadge}>
                  <Text style={styles.stateText}>{item.state}</Text>
               </View>
               <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
               <Text style={styles.itemPrice}>{item.price.toLocaleString()} F</Text>
               <Text style={styles.itemSeller}>Vendu par {item.seller}</Text>
            </View>
            <TouchableOpacity style={styles.buyBtn}>
               <Text style={styles.buyBtnText}>Acheter</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowSellModal(true)}>
         <Ionicons name="add" size={30} color={COLORS.white} />
         <Text style={styles.fabText}>Poster une annonce</Text>
      </TouchableOpacity>

      {/* Sell Modal */}
      <Modal visible={showSellModal} animationType="slide" presentationStyle="pageSheet">
         <View style={styles.modal}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Vendre un article</Text>
               <TouchableOpacity onPress={() => setShowSellModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
               </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
               <Text style={styles.label}>Nom de l'article</Text>
               <TextInput 
                 style={styles.input} 
                 placeholder="Ex: Manuel Math 4ème" 
                 value={newItem.name}
                 onChangeText={(t) => setNewItem({...newItem, name: t})}
               />
               
               <Text style={styles.label}>Prix (FCFA)</Text>
               <TextInput 
                 style={styles.input} 
                 placeholder="Ex: 2500" 
                 keyboardType="numeric"
                 value={newItem.price}
                 onChangeText={(t) => setNewItem({...newItem, price: t})}
               />

               <Text style={styles.label}>État</Text>
               <View style={styles.stateSelector}>
                  {["Comme neuf", "Bon état", "Usagé"].map(s => (
                    <TouchableOpacity 
                      key={s} 
                      style={[styles.stateOpt, newItem.state === s && styles.stateOptActive]}
                      onPress={() => setNewItem({...newItem, state: s})}
                    >
                       <Text style={[styles.stateOptText, newItem.state === s && {color: COLORS.white}]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
               </View>

               <TouchableOpacity style={styles.submitBtn} onPress={handleSell} disabled={isSubmitting}>
                  {isSubmitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitBtnText}>Publier l'annonce</Text>}
               </TouchableOpacity>
            </ScrollView>
         </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayLight
  },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  sellText: { color: COLORS.primary, fontWeight: "700" },
  searchBox: { 
    flexDirection: "row", alignItems: "center", margin: SPACING.lg,
    backgroundColor: COLORS.white, paddingHorizontal: 15, borderRadius: RADIUS.md, height: 46,
    borderWidth: 1, borderColor: COLORS.grayLight
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  list: { padding: SPACING.md },
  card: { 
    flex: 1, backgroundColor: COLORS.white, margin: 6, borderRadius: RADIUS.lg,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    overflow: "hidden"
  },
  emojiContainer: { 
    height: 100, backgroundColor: COLORS.grayLight + "50", 
    alignItems: "center", justifyContent: "center" 
  },
  emoji: { fontSize: 50 },
  info: { padding: 12 },
  stateBadge: { 
    backgroundColor: COLORS.secondary + "20", alignSelf: "flex-start",
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 6
  },
  stateText: { color: COLORS.secondary, fontSize: 9, fontWeight: "900", textTransform: "uppercase" },
  itemName: { fontSize: 14, fontWeight: "700", color: COLORS.text, height: 40 },
  itemPrice: { fontSize: 16, fontWeight: "800", color: COLORS.primary, marginTop: 4 },
  itemSeller: { fontSize: 10, color: COLORS.textSecondary, marginTop: 4 },
  buyBtn: { backgroundColor: COLORS.primary, paddingVertical: 8, alignItems: "center" },
  buyBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 12 },
  fab: { 
    position: "absolute", bottom: 20, alignSelf: "center",
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.secondary,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30,
    shadowColor: COLORS.secondary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5
  },
  fabText: { color: COLORS.white, fontWeight: "800", marginLeft: 8 },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalBody: { padding: 20 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8, color: COLORS.text, marginTop: 15 },
  input: { backgroundColor: COLORS.grayLight, borderRadius: 8, padding: 12, fontSize: 16 },
  stateSelector: { flexDirection: "row", gap: 8, marginTop: 5 },
  stateOpt: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, borderWidth: 1, borderColor: COLORS.grayMedium },
  stateOptActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stateOptText: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  submitBtn: { backgroundColor: COLORS.secondary, paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 30 },
  submitBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 16 },
})
