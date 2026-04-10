import React, { useState } from "react"
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Modal, TextInput, ActivityIndicator
} from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { useStore } from "../../store/useStore"
import { authAPI } from "../../services/api"
import { Ionicons } from "@expo/vector-icons"

const MENU_ITEMS = [
  { icon: "cube", label: "Mes commandes", screen: "Orders" },
  { icon: "card", label: "Mon portefeuille", screen: "Wallet" },
  { icon: "notifications", label: "Notifications", screen: "Notifications" },
  { icon: "location", label: "Mes adresses", screen: "Addresses" },
  { icon: "gift", label: "Mes codes promo", screen: "Promo" },
  { icon: "help-circle", label: "Aide & Support", screen: "Support" },
  { icon: "information-circle", label: "À propos de Papeterie", screen: "About" },
]

export default function ProfileScreen({ navigation }: any) {
  const user = useStore((s) => s.user)
  const logout = useStore((s) => s.logout)
  const setUser = useStore((s) => s.setUser)
  const token = useStore((s) => s.token)
  const language = useStore((s) => s.language)
  const setLanguage = useStore((s) => s.setLanguage)

  const [editModal, setEditModal] = useState(false)
  const [editName, setEditName] = useState(user?.name || "")
  const [editPhone, setEditPhone] = useState(user?.phone || "")
  const [saving, setSaving] = useState(false)

  const walletBalance = (user as any)?.walletMoney ?? (user as any)?.walletBalance ?? 0

  async function handleSaveProfile() {
    if (!editName.trim()) {
      Alert.alert("Erreur", "Le nom est requis")
      return
    }
    setSaving(true)
    try {
      const res = await authAPI.updateProfile({ name: editName, phone: editPhone })
      setUser({ ...user!, name: editName, phone: editPhone } as any, token!)
      setEditModal(false)
      Alert.alert("Succès", "Profil mis à jour !")
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Mise à jour impossible")
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnexion", style: "destructive", onPress: logout },
    ])
  }

  function handleMenuItem(screen: string) {
    const available = ["Orders", "Wallet", "Notifications"]
    if (available.includes(screen)) {
      navigation.navigate(screen)
    } else if (screen === "Addresses") {
      Alert.alert(
        "Mes adresses",
        "Adresse principale : Almadies, Villa 45, Dakar\n\nGestion complète des adresses disponible prochainement.",
        [{ text: "OK" }]
      )
    } else if (screen === "Promo") {
      Alert.alert(
        "Codes promo",
        "Aucun code promo actif pour le moment.\n\nRestez connecté pour profiter de nos offres exclusives !",
        [{ text: "OK" }]
      )
    } else if (screen === "Support") {
      Alert.alert(
        "Aide & Support",
        "📞 Téléphone : +221 33 820 00 00\n📧 Email : support@papeterie.sn\n⏰ Disponible 8h-20h, 7j/7",
        [{ text: "Fermer" }]
      )
    } else if (screen === "About") {
      Alert.alert(
        "À propos de Papeterie",
        "Papeterie v1.0.0\n\nVotre plateforme de livraison de fournitures scolaires au Sénégal.\n\n🇸🇳 Made with ❤️ in Dakar",
        [{ text: "OK" }]
      )
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || "U"}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || "Utilisateur"}</Text>
          <Text style={styles.userPhone}>{user?.phone || "+221 77 000 00 00"}</Text>
          <Text style={styles.userEmail}>{user?.email || "email@example.com"}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => { setEditName(user?.name || ""); setEditPhone(user?.phone || ""); setEditModal(true) }}>
          <Text style={styles.editBtnText}><Ionicons name="create-outline" size={12} /> Modifier</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <View>
          <Text style={styles.walletLabel}>Mon Portefeuille</Text>
          <Text style={styles.walletBalance}>{walletBalance.toLocaleString()} FCFA</Text>
        </View>
        <TouchableOpacity style={styles.rechargeBtn} onPress={() => navigation.navigate("Wallet")}>
          <Text style={styles.rechargeBtnText}>+ Recharger</Text>
        </TouchableOpacity>
      </View>

      {/* Language */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Langue / Lakku</Text>
      </View>
      <View style={styles.languageRow}>
        <TouchableOpacity style={[styles.langBtn, language === "fr" && styles.langBtnActive]} onPress={() => setLanguage("fr")}>
          <Text style={[styles.langBtnText, language === "fr" && styles.langBtnTextActive]}>Français 🇫🇷</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.langBtn, language === "wo" && styles.langBtnActive]} onPress={() => setLanguage("wo")}>
          <Text style={[styles.langBtnText, language === "wo" && styles.langBtnTextActive]}>Wolof 🇸🇳</Text>
        </TouchableOpacity>
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
            onPress={() => handleMenuItem(item.screen)}
          >
            <Ionicons name={item.icon as any} size={22} color={COLORS.primary} style={{ width: 28 }} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}><Ionicons name="log-out" size={18} /> Se déconnecter</Text>
      </TouchableOpacity>
      <Text style={styles.version}>Papeterie v1.0.0</Text>
      <View style={{ height: 40 }} />

      {/* Edit Modal */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Modifier mon profil</Text>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Nom complet</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Votre nom"
              placeholderTextColor={COLORS.gray}
            />
            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+221 77 000 00 00"
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.gray}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", gap: SPACING.md, backgroundColor: COLORS.white, padding: SPACING.lg, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: "800" },
  userInfo: { flex: 1 },
  userName: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  userPhone: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  userEmail: { fontSize: FONTS.sizes.xs, color: COLORS.gray },
  editBtn: { backgroundColor: COLORS.grayLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 8 },
  editBtnText: { fontSize: FONTS.sizes.xs, fontWeight: "600", color: COLORS.text },
  walletCard: { margin: SPACING.lg, padding: SPACING.lg, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center", shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  walletLabel: { color: "rgba(255,255,255,0.8)", fontSize: FONTS.sizes.sm },
  walletBalance: { color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: "800", marginTop: 2 },
  rechargeBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  rechargeBtnText: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: "700" },
  sectionHeader: { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 1 },
  languageRow: { flexDirection: "row", marginHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.lg },
  langBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.white, alignItems: "center", borderWidth: 1, borderColor: COLORS.grayMedium },
  langBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  langBtnText: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.text },
  langBtnTextActive: { color: COLORS.white, fontWeight: "800" },
  menuSection: { backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: SPACING.md, gap: SPACING.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium },
  menuLabel: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.text },
  logoutBtn: { margin: SPACING.lg, backgroundColor: COLORS.danger + "15", borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: "center" },
  logoutText: { color: COLORS.danger, fontSize: FONTS.sizes.md, fontWeight: "700" },
  version: { textAlign: "center", color: COLORS.gray, fontSize: FONTS.sizes.xs, marginBottom: SPACING.sm },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  modalBody: { padding: SPACING.lg, gap: SPACING.md },
  inputLabel: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.text },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.md, color: COLORS.text, backgroundColor: COLORS.grayLight },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: "center", marginTop: SPACING.md, elevation: 4 },
  saveBtnText: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: "700" },
})
