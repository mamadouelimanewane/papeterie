import React, { useState } from "react"
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
} from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { useStore } from "../../store/useStore"

const NOTIFS = [
  { id: "1", type: "order", title: "Commande confirmée", body: "Votre commande #ORD-1234 a été confirmée par le marchand.", time: "Il y a 2 min", read: false, emoji: "✅" },
  { id: "2", type: "delivery", title: "Livreur en route", body: "Mamadou est en route vers votre adresse. Livraison estimée : 15 min.", time: "Il y a 18 min", read: false, emoji: "🛵" },
  { id: "3", type: "promo", title: "Offre exclusive 🎉", body: "Profitez de -20% sur toutes les commandes ce soir avec le code NDUGUMI20.", time: "Il y a 1h", read: true, emoji: "🎁" },
  { id: "4", type: "order", title: "Commande livrée", body: "Votre commande #ORD-1230 a été livrée avec succès.", time: "Hier, 14:30", read: true, emoji: "📦" },
  { id: "5", type: "wallet", title: "Portefeuille rechargé", body: "Votre portefeuille a été crédité de 5 000 FCFA.", time: "Hier, 09:00", read: true, emoji: "💰" },
  { id: "6", type: "promo", title: "Nouveau marchand disponible", body: "Marché Bio Dakar est maintenant disponible dans votre zone.", time: "Il y a 2 jours", read: true, emoji: "🏪" },
]

type FilterType = "all" | "order" | "promo" | "wallet"

export default function NotificationsScreen({ navigation }: any) {
  const [filter, setFilter] = useState<FilterType>("all")
  const [notifs, setNotifs] = useState(NOTIFS)
  const setUnreadCount = useStore((s) => s.setUnreadCount)

  const filtered = filter === "all" ? notifs : notifs.filter((n) => n.type === filter)
  const unread = notifs.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifs(notifs.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markRead = (id: string) => {
    setNotifs(notifs.map((n) => n.id === id ? { ...n, read: true } : n))
    const newUnread = notifs.filter((n) => !n.read && n.id !== id).length
    setUnreadCount(newUnread)
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(["all", "order", "promo", "wallet"] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "Tout" : f === "order" ? "Commandes" : f === "promo" ? "Promos" : "Wallet"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.sm }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyText}>Aucune notification</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notifCard, !item.read && styles.notifCardUnread]}
            onPress={() => markRead(item.id)}
          >
            <View style={styles.notifIconWrap}>
              <Text style={styles.notifEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.notifContent}>
              <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>{item.title}</Text>
              <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.notifTime}>{item.time}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium,
  },
  backBtn: { marginRight: SPACING.md },
  backIcon: { fontSize: 22, color: COLORS.text },
  title: { flex: 1, fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  markAllText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: "600" },
  filters: {
    flexDirection: "row", gap: SPACING.sm, padding: SPACING.md,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium,
  },
  filterBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.round, backgroundColor: COLORS.grayLight,
  },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: "600" },
  filterTextActive: { color: COLORS.white },
  notifCard: {
    flexDirection: "row", backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.md, gap: SPACING.md, alignItems: "flex-start",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  notifCardUnread: { backgroundColor: "#F1F8F1", borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  notifIconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.grayLight, alignItems: "center", justifyContent: "center",
  },
  notifEmoji: { fontSize: 22 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.text },
  notifTitleUnread: { fontWeight: "800", color: COLORS.primary },
  notifBody: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
  notifTime: { fontSize: FONTS.sizes.xs, color: COLORS.gray, marginTop: 4 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary, marginTop: 4,
  },
  empty: { alignItems: "center", padding: SPACING.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
})
