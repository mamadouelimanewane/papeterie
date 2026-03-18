import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native"
import { useDriverStore } from "../../store/useDriverStore"

const MENU_ITEMS = [
  { icon: "📄", label: "Mes documents", screen: "Documents" },
  { icon: "🏦", label: "Informations bancaires", screen: null },
  { icon: "📊", label: "Mes statistiques", screen: "Earnings" },
  { icon: "🔔", label: "Notifications", screen: null },
  { icon: "🔒", label: "Changer le mot de passe", screen: null },
  { icon: "⭐", label: "Mes avis clients", screen: null },
  { icon: "📞", label: "Support NDUGUMi", screen: null },
  { icon: "📋", label: "Conditions générales", screen: null },
]

export default function ProfileScreen({ navigation }: any) {
  const { driver, logout, todayEarnings, todayOrders } = useDriverStore()

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnecter",
        style: "destructive",
        onPress: logout,
      },
    ])
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{driver?.name?.charAt(0) ?? "D"}</Text>
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.driverName}>{driver?.name}</Text>
        <Text style={styles.driverPhone}>{driver?.phone}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>⭐ {driver?.rating} · {driver?.vehicleType}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{driver?.totalOrders ?? 0}</Text>
          <Text style={styles.statLabel}>Livraisons</Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <Text style={styles.statValue}>{driver?.rating ?? "–"}</Text>
          <Text style={styles.statLabel}>Note ⭐</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {(driver?.walletBalance ?? 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Solde FCFA</Text>
        </View>
      </View>

      {/* Wallet */}
      <View style={styles.walletCard}>
        <View>
          <Text style={styles.walletLabel}>Solde disponible</Text>
          <Text style={styles.walletBalance}>
            {(driver?.walletBalance ?? 0).toLocaleString()} FCFA
          </Text>
        </View>
        <TouchableOpacity style={styles.withdrawBtn}>
          <Text style={styles.withdrawBtnText}>Retirer 💳</Text>
        </TouchableOpacity>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, index === MENU_ITEMS.length - 1 && styles.menuItemLast]}
            onPress={() => item.screen ? navigation.navigate(item.screen) : null}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.version}>NDUGUMi Driver v1.0.0</Text>
      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5FA" },
  header: {
    backgroundColor: "#6B6BD5",
    paddingTop: 55,
    paddingBottom: 30,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    position: "relative",
  },
  avatarText: { fontSize: 36, color: "#fff", fontWeight: "700" },
  onlineDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#6B6BD5",
  },
  driverName: { fontSize: 22, fontWeight: "800", color: "#fff" },
  driverPhone: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  ratingRow: { marginTop: 8 },
  ratingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: { flex: 1, padding: 16, alignItems: "center" },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#F0F0F0",
  },
  statValue: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 4 },
  walletCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    padding: 18,
  },
  walletLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  walletBalance: { fontSize: 22, fontWeight: "700", color: "#fff", marginTop: 4 },
  withdrawBtn: {
    backgroundColor: "#6B6BD5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  withdrawBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  menu: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: { fontSize: 18, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 14, color: "#333" },
  menuArrow: { fontSize: 20, color: "#ccc" },
  logoutBtn: {
    margin: 16,
    marginTop: 12,
    backgroundColor: "#FFF3F3",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFD0D0",
  },
  logoutText: { color: "#E53935", fontSize: 15, fontWeight: "600" },
  version: { textAlign: "center", color: "#bbb", fontSize: 12 },
})
