import React from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { useStore } from "../../store/useStore"

const MENU_ITEMS = [
  { icon: "📦", label: "Mes commandes", screen: "Orders" },
  { icon: "💳", label: "Mon portefeuille", screen: "Wallet" },
  { icon: "🔔", label: "Notifications", screen: "Notifications" },
  { icon: "📍", label: "Mes adresses", screen: "Addresses" },
  { icon: "⭐", label: "Mes avis", screen: "Reviews" },
  { icon: "🎁", label: "Mes codes promo", screen: "Promo" },
  { icon: "🤝", label: "Parrainer des amis", screen: "Referral" },
  { icon: "❓", label: "Aide & Support", screen: "Support" },
  { icon: "ℹ️", label: "À propos de NDUGUMi", screen: "About" },
]

export default function ProfileScreen({ navigation }: any) {
  const user = useStore((s) => s.user)
  const logout = useStore((s) => s.logout)

  function handleLogout() {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnexion", style: "destructive", onPress: logout },
    ])
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || "Utilisateur"}</Text>
          <Text style={styles.userPhone}>{user?.phone || "+221 77 000 00 00"}</Text>
          <Text style={styles.userEmail}>{user?.email || "email@example.com"}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditProfile")}>
          <Text style={styles.editBtnText}>✏️ Modifier</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <View>
          <Text style={styles.walletLabel}>Mon Portefeuille</Text>
          <Text style={styles.walletBalance}>0.00 FCFA</Text>
        </View>
        <TouchableOpacity style={styles.rechargeBtn} onPress={() => navigation.navigate("Wallet")}>
          <Text style={styles.rechargeBtnText}>+ Recharger</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Commandes", value: "12" },
          { label: "Avis", value: "8" },
          { label: "Points", value: "450" },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.version}>NDUGUMi v1.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", alignItems: "center", gap: SPACING.md,
    backgroundColor: COLORS.white, padding: SPACING.lg, paddingTop: 56,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: "800" },
  userInfo: { flex: 1 },
  userName: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  userPhone: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  userEmail: { fontSize: FONTS.sizes.xs, color: COLORS.gray },
  editBtn: { backgroundColor: COLORS.grayLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 8 },
  editBtnText: { fontSize: FONTS.sizes.xs, fontWeight: "600", color: COLORS.text },
  walletCard: {
    margin: SPACING.lg, padding: SPACING.lg,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  walletLabel: { color: "rgba(255,255,255,0.8)", fontSize: FONTS.sizes.sm },
  walletBalance: { color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: "800", marginTop: 2 },
  rechargeBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  rechargeBtnText: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: "700" },
  statsRow: { flexDirection: "row", paddingHorizontal: SPACING.lg, gap: SPACING.md, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: "800", color: COLORS.primary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  menuSection: { backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: SPACING.md, gap: SPACING.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium },
  menuIcon: { fontSize: 22, width: 28 },
  menuLabel: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.text },
  menuChevron: { fontSize: 20, color: COLORS.gray },
  logoutBtn: { margin: SPACING.lg, backgroundColor: COLORS.danger + "15", borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: "center" },
  logoutText: { color: COLORS.danger, fontSize: FONTS.sizes.md, fontWeight: "700" },
  version: { textAlign: "center", color: COLORS.gray, fontSize: FONTS.sizes.xs, marginBottom: SPACING.sm },
})
