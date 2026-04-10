import React from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"

const MOCK_SUBS = [
  { id: "s1", name: "Papier A4 (Pack 5)", nextDate: "05 Mai 2026", status: "Actif", price: 12500, period: "Mensuel" },
  { id: "s2", name: "Cartouches HP 305 XL", nextDate: "12 Mai 2026", status: "Actif", price: 28000, period: "Trimestriel" },
]

export default function RefillSubscriptionScreen({ navigation, route }: any) {
  const isRefill = route.name === "Refill"

  const handleAdd = () => {
    Alert.alert("Ajouter un Refill", "Sélectionnez un produit pour l'ajouter à vos réapprovisionnements automatiques.")
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{isRefill ? "Réapprovisionnement" : "Mes Abonnements"}</Text>
        <TouchableOpacity onPress={handleAdd}>
           <Ionicons name="add-circle" size={26} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
           <Ionicons name="flash" size={24} color={COLORS.secondary} />
           <Text style={styles.infoText}>
             {isRefill 
               ? "Ne soyez jamais en rupture de stock. Nous détectons quand vous allez manquer de matériel." 
               : "Gérez vos fournitures récurrentes en un seul endroit."}
           </Text>
        </View>

        <Text style={styles.sectionTitle}>Abonnements actifs</Text>
        {MOCK_SUBS.map(sub => (
          <View key={sub.id} style={styles.subCard}>
             <View style={styles.subHeader}>
                <View>
                   <Text style={styles.subName}>{sub.name}</Text>
                   <Text style={styles.subPeriod}>{sub.period} · {sub.price.toLocaleString()} F</Text>
                </View>
                <View style={styles.statusBadge}>
                   <Text style={styles.statusText}>{sub.status}</Text>
                </View>
             </View>
             <View style={styles.subFooter}>
                <View style={styles.nextDateBox}>
                   <Ionicons name="time-outline" size={14} color={COLORS.gray} />
                   <Text style={styles.nextDateText}>Prochain envoi : {sub.nextDate}</Text>
                </View>
                <TouchableOpacity onPress={() => Alert.alert("Pause", "Abonnement mis en pause.")}>
                   <Text style={styles.pauseBtn}>Pause</Text>
                </TouchableOpacity>
             </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
           <Text style={styles.addBtnText}>+ Programmer un nouvel article</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: { flex: 1, padding: SPACING.lg },
  infoCard: { 
    backgroundColor: COLORS.secondary + "10", padding: 15, borderRadius: RADIUS.md,
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.secondary + "20"
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 18 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: COLORS.textSecondary, marginBottom: 15, textTransform: "uppercase" },
  subCard: { 
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  subHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  subName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  subPeriod: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  statusBadge: { backgroundColor: COLORS.success + "15", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: COLORS.success, fontSize: 10, fontWeight: "900" },
  subFooter: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: COLORS.grayLight
  },
  nextDateBox: { flexDirection: "row", alignItems: "center", gap: 6 },
  nextDateText: { fontSize: 12, color: COLORS.gray },
  pauseBtn: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  addBtn: { 
    borderWidth: 2, borderStyle: "dashed", borderColor: COLORS.primary + "40",
    borderRadius: RADIUS.lg, padding: 20, alignItems: "center", marginTop: 10
  },
  addBtnText: { color: COLORS.primary, fontWeight: "700" }
})
