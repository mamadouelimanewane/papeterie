import React, { useState } from "react"
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
} from "react-native"

const COLORS = {
  primary: "#6B6BD5", bg: "#F5F5F5", white: "#FFFFFF",
  text: "#212121", sub: "#757575", border: "#E0E0E0",
  green: "#4CAF50", orange: "#FF9800",
}

const NOTIFS = [
  { id: "1", type: "order", emoji: "📦", title: "Nouvelle commande disponible", body: "Commande #ORD-3255 — 3.2 km — +950 FCFA", time: "Il y a 1 min", read: false },
  { id: "2", type: "payment", emoji: "💰", title: "Paiement reçu", body: "Vous avez reçu 800 FCFA pour la livraison ORD-3253.", time: "Il y a 20 min", read: false },
  { id: "3", type: "system", emoji: "⚙️", title: "Mise à jour de l'application", body: "Une nouvelle version est disponible. Mettez à jour pour les dernières fonctionnalités.", time: "Il y a 2h", read: true },
  { id: "4", type: "order", emoji: "🌟", title: "Évaluation reçue", body: "Fatou Diallo vous a donné une note de 5 étoiles !", time: "Hier, 18:00", read: true },
  { id: "5", type: "payment", emoji: "💸", title: "Cashout effectué", body: "Virement de 15 000 FCFA vers votre compte Orange Money.", time: "Hier, 09:30", read: true },
]

export default function NotificationsScreen({ navigation }: any) {
  const [notifs, setNotifs] = useState(NOTIFS)
  const unread = notifs.filter((n) => !n.read).length

  const markAllRead = () => setNotifs(notifs.map((n) => ({ ...n, read: true })))

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications {unread > 0 ? `(${unread})` : ""}</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifs}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🔔</Text>
            <Text style={styles.emptyText}>Aucune notification</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => setNotifs(notifs.map((n) => n.id === item.id ? { ...n, read: true } : n))}
          >
            <View style={styles.iconWrap}>
              <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
            </View>
            <View style={styles.content}>
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20,
    paddingVertical: 16, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { marginRight: 12 },
  backIcon: { fontSize: 22, color: COLORS.text },
  title: { flex: 1, fontSize: 17, fontWeight: "800", color: COLORS.text },
  markAll: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  card: {
    flexDirection: "row", backgroundColor: COLORS.white, borderRadius: 14,
    padding: 14, gap: 12, alignItems: "flex-start",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary, backgroundColor: "#F3F3FB" },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center",
  },
  content: { flex: 1 },
  notifTitle: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  notifTitleUnread: { fontWeight: "800", color: COLORS.primary },
  notifBody: { fontSize: 12, color: COLORS.sub, marginTop: 3, lineHeight: 17 },
  notifTime: { fontSize: 11, color: "#9E9E9E", marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4 },
  empty: { alignItems: "center", padding: 48, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.sub },
})
