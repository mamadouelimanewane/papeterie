import React, { useState } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Modal, Alert,
} from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { useStore } from "../../store/useStore"
import { walletAPI } from "../../services/api"

const TRANSACTIONS = [
  { id: "1", type: "credit", label: "Recharge portefeuille", method: "Orange Money", amount: 5000, date: "Aujourd'hui, 10:00" },
  { id: "2", type: "debit", label: "Paiement commande #1234", method: "Wallet", amount: -3200, date: "Hier, 14:30" },
  { id: "3", type: "credit", label: "Remboursement commande #1198", method: "Wallet", amount: 1500, date: "Il y a 3 jours" },
  { id: "4", type: "debit", label: "Paiement commande #1185", method: "Wallet", amount: -8750, date: "Il y a 5 jours" },
  { id: "5", type: "credit", label: "Bonus fidélité", method: "Système", amount: 500, date: "Il y a 1 semaine" },
]

const PAYMENT_METHODS = [
  { id: "orange", label: "Orange Money", emoji: "🟠", color: "#FF6600" },
  { id: "wave", label: "Wave", emoji: "🔵", color: "#1B74E4" },
  { id: "free", label: "Free Money", emoji: "🔴", color: "#CC0000" },
  { id: "card", label: "Carte bancaire", emoji: "💳", color: "#6B7280" },
]

export default function WalletScreen({ navigation }: any) {
  const user = useStore((s) => s.user)
  const balance = user?.walletBalance ?? 0
  const [showRecharge, setShowRecharge] = useState(false)
  const [amount, setAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("orange")

  const handleRecharge = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert("Erreur", "Montant invalide")
      return
    }
    try {
      await walletAPI.recharge(Number(amount))
      Alert.alert("Succès", `Recharge de ${Number(amount).toLocaleString()} FCFA effectuée`)
      setShowRecharge(false)
      setAmount("")
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Recharge impossible")
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mon Portefeuille</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde disponible</Text>
          <Text style={styles.balanceAmount}>{balance.toLocaleString()} <Text style={styles.balanceCurrency}>FCFA</Text></Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowRecharge(true)}>
              <Text style={styles.actionBtnIcon}>➕</Text>
              <Text style={styles.actionBtnLabel}>Recharger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]}>
              <Text style={styles.actionBtnIcon}>📤</Text>
              <Text style={[styles.actionBtnLabel, { color: COLORS.primary }]}>Retirer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Raccourcis recharge */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recharge rapide</Text>
          <View style={styles.quickAmounts}>
            {[1000, 2000, 5000, 10000].map((val) => (
              <TouchableOpacity key={val} style={styles.quickBtn} onPress={() => { setAmount(String(val)); setShowRecharge(true) }}>
                <Text style={styles.quickBtnText}>{val.toLocaleString()}</Text>
                <Text style={styles.quickBtnSub}>FCFA</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Historique */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique</Text>
          <View style={styles.transactionList}>
            {TRANSACTIONS.map((tx) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: tx.type === "credit" ? "#E8F5E9" : "#FFEBEE" }]}>
                  <Text>{tx.type === "credit" ? "⬆️" : "⬇️"}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txLabel}>{tx.label}</Text>
                  <Text style={styles.txMeta}>{tx.method} · {tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === "credit" ? COLORS.success : COLORS.danger }]}>
                  {tx.type === "credit" ? "+" : ""}{tx.amount.toLocaleString()} FCFA
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Modal Recharge */}
      <Modal visible={showRecharge} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowRecharge(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recharger mon portefeuille</Text>
            <TouchableOpacity onPress={() => setShowRecharge(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg }}>
            <Text style={styles.inputLabel}>Montant (FCFA)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Ex: 5000"
              keyboardType="numeric"
              placeholderTextColor={COLORS.gray}
            />
            <View style={styles.quickAmounts}>
              {[1000, 2000, 5000, 10000].map((val) => (
                <TouchableOpacity key={val} style={[styles.quickBtn, amount === String(val) && { backgroundColor: COLORS.primary }]}
                  onPress={() => setAmount(String(val))}>
                  <Text style={[styles.quickBtnText, amount === String(val) && { color: COLORS.white }]}>{val.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.inputLabel, { marginTop: SPACING.lg }]}>Mode de paiement</Text>
            <View style={{ gap: SPACING.sm }}>
              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity key={pm.id} style={[styles.payMethodBtn, selectedMethod === pm.id && { borderColor: pm.color, backgroundColor: `${pm.color}10` }]}
                  onPress={() => setSelectedMethod(pm.id)}>
                  <Text style={{ fontSize: 24 }}>{pm.emoji}</Text>
                  <Text style={[styles.payMethodLabel, selectedMethod === pm.id && { color: pm.color, fontWeight: "700" }]}>{pm.label}</Text>
                  {selectedMethod === pm.id && <Text style={{ color: pm.color, marginLeft: "auto" }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={{ padding: SPACING.lg }}>
            <TouchableOpacity style={styles.rechargeBtn} onPress={handleRecharge}>
              <Text style={styles.rechargeBtnText}>Recharger {amount ? `${Number(amount).toLocaleString()} FCFA` : ""}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  title: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  balanceCard: {
    backgroundColor: COLORS.primary, margin: SPACING.lg, borderRadius: RADIUS.xl,
    padding: SPACING.lg, alignItems: "center",
  },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: FONTS.sizes.sm, fontWeight: "500" },
  balanceAmount: { color: COLORS.white, fontSize: 36, fontWeight: "900", marginTop: 6 },
  balanceCurrency: { fontSize: FONTS.sizes.lg, fontWeight: "600" },
  balanceActions: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.lg, width: "100%" },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: SPACING.sm, backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: RADIUS.md, paddingVertical: 12,
  },
  actionBtnSecondary: { backgroundColor: COLORS.white },
  actionBtnIcon: { fontSize: 18 },
  actionBtnLabel: { color: COLORS.white, fontWeight: "700", fontSize: FONTS.sizes.sm },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.md },
  quickAmounts: { flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" },
  quickBtn: {
    flex: 1, minWidth: 70, alignItems: "center", backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  quickBtnText: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.text },
  quickBtnSub: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  transactionList: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  txRow: {
    flexDirection: "row", alignItems: "center", padding: SPACING.md,
    gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium,
  },
  txIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txLabel: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.text },
  txMeta: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  txAmount: { fontSize: FONTS.sizes.sm, fontWeight: "700" },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium,
  },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.text },
  modalClose: { fontSize: 20, color: COLORS.gray },
  inputLabel: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.text, marginBottom: SPACING.sm },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    padding: SPACING.md, fontSize: FONTS.sizes.xl, fontWeight: "700",
    color: COLORS.text, marginBottom: SPACING.md,
  },
  payMethodBtn: {
    flexDirection: "row", alignItems: "center", gap: SPACING.md,
    padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  payMethodLabel: { fontSize: FONTS.sizes.md, fontWeight: "600", color: COLORS.text },
  rechargeBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: "center",
  },
  rechargeBtnText: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: "800" },
})
