import React from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Dimensions, Share, Alert
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { useStore } from "../../store/useStore"

const { width } = Dimensions.get("window")

export default function GroupOrderSessionScreen({ navigation }: any) {
  const groupCode = useStore((s) => s.groupCode)
  const groupMembers = useStore((s) => s.groupMembers)
  const setGroupOrder = useStore((s) => s.setGroupOrder)
  const cartTotal = useStore((s) => s.cartTotal)()

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Rejoins ma commande Papeterie pour partager les frais de livraison ! Code : ${groupCode}\nLien : https://papeterie.app/join/${groupCode}`,
      })
    } catch (error) {
      console.log(error)
    }
  }

  const handleLeave = () => {
    Alert.alert(
      "Quitter la session",
      "Voulez-vous vraiment quitter cette commande groupée ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Quitter", style: "destructive", onPress: () => { setGroupOrder(false); navigation.goBack(); } }
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Commande Groupée</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-social" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Code Card */}
        <View style={styles.codeCard}>
           <Text style={styles.codeLabel}>CODE DE LA SESSION</Text>
           <Text style={styles.groupCode}>{groupCode}</Text>
           <TouchableOpacity style={styles.copyBtn} onPress={handleShare}>
              <Text style={styles.copyBtnText}>Inviter des voisins</Text>
           </TouchableOpacity>
        </View>

        {/* Progress Card */}
        <View style={styles.card}>
           <View style={styles.progressHeader}>
              <Text style={styles.cardTitle}>Impact de groupe</Text>
              <View style={styles.deliveryBadge}>
                 <Text style={styles.deliveryBadgeText}>LIVRAISON GRATUITE</Text>
              </View>
           </View>
           <Text style={styles.progressDesc}>Grâce à vos {groupMembers.length} voisins, vous économisez 500 FCFA chacun sur la livraison !</Text>
           <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: "100%" }]} />
           </View>
           <View style={styles.statsRow}>
              <View style={styles.stat}>
                 <Text style={styles.statValue}>{cartTotal.toLocaleString()} F</Text>
                 <Text style={styles.statLabel}>Mon panier</Text>
              </View>
              <View style={styles.stat}>
                 <Text style={styles.statValue}>+45 000 F</Text>
                 <Text style={styles.statLabel}>Total groupe</Text>
              </View>
           </View>
        </View>

        {/* Members List */}
        <View style={styles.card}>
           <Text style={styles.cardTitle}>Participants ({groupMembers.length})</Text>
           {groupMembers.map((member, idx) => (
             <View key={idx} style={styles.memberRow}>
                <View style={[styles.avatar, { backgroundColor: idx === 0 ? COLORS.primary : COLORS.grayLight }]}>
                   <Text style={[styles.avatarText, idx !== 0 && { color: COLORS.text }]}>{member.charAt(0)}</Text>
                </View>
                <View style={styles.memberInfo}>
                   <Text style={styles.memberName}>{member} {idx === 0 && "(Moi)"}</Text>
                   <Text style={styles.memberStatus}>{idx === 0 ? "Panier prêt" : "En cours de sélection..."}</Text>
                </View>
                {idx === 0 && <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />}
             </View>
           ))}
        </View>

        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
           <Text style={styles.leaveBtnText}>Quitter la commande groupée</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
         <TouchableOpacity style={styles.mainBtn} onPress={() => navigation.navigate("Cart")}>
            <Text style={styles.mainBtnText}>Retour au panier collectif</Text>
         </TouchableOpacity>
      </View>
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
  codeCard: { 
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 24, 
    alignItems: "center", marginBottom: SPACING.lg,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
  },
  codeLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  groupCode: { color: COLORS.white, fontSize: 36, fontWeight: "900", marginVertical: 10, letterSpacing: 4 },
  copyBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.round },
  copyBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  card: { 
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, 
    marginBottom: SPACING.md, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  deliveryBadge: { backgroundColor: COLORS.success + "15", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  deliveryBadgeText: { color: COLORS.success, fontSize: 10, fontWeight: "900" },
  progressDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 15 },
  progressBarBg: { height: 8, backgroundColor: COLORS.grayLight, borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: COLORS.success },
  statsRow: { flexDirection: "row", marginTop: 15, borderTopWidth: 1, borderTopColor: COLORS.grayLight, paddingTop: 15 },
  stat: { flex: 1 },
  statValue: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.white, fontWeight: "800" },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  memberStatus: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  leaveBtn: { marginTop: 10, alignItems: "center", padding: 15 },
  leaveBtnText: { color: COLORS.danger, fontWeight: "600", fontSize: 14 },
  footer: { padding: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.grayLight },
  mainBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.md, alignItems: "center" },
  mainBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 16 },
})
