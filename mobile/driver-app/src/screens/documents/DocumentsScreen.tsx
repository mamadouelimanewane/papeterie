import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native"

const DOCUMENTS = [
  { id: "id_card", label: "Carte d'identité", icon: "🪪", required: true, status: "approved" },
  { id: "license", label: "Permis de conduire", icon: "🚗", required: true, status: "approved" },
  { id: "vehicle_reg", label: "Carte grise", icon: "📋", required: true, status: "pending" },
  { id: "insurance", label: "Assurance véhicule", icon: "🛡️", required: true, status: "missing" },
  { id: "profile_photo", label: "Photo de profil", icon: "📸", required: true, status: "approved" },
  { id: "vehicle_photo", label: "Photo du véhicule", icon: "🏍️", required: false, status: "missing" },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: "Approuvé ✓", color: "#2E7D32", bg: "#E8F5E9" },
  pending: { label: "En attente ⏳", color: "#F57C00", bg: "#FFF3E0" },
  missing: { label: "Manquant", color: "#C62828", bg: "#FFEBEE" },
  rejected: { label: "Rejeté ✗", color: "#C62828", bg: "#FFEBEE" },
}

export default function DocumentsScreen() {
  const [docs, setDocs] = useState(DOCUMENTS)

  const handleUpload = (docId: string) => {
    Alert.alert(
      "Téléverser un document",
      "Choisissez la source de votre document",
      [
        { text: "Appareil photo", onPress: () => simulateUpload(docId) },
        { text: "Galerie", onPress: () => simulateUpload(docId) },
        { text: "Annuler", style: "cancel" },
      ]
    )
  }

  const simulateUpload = (docId: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "pending" } : d))
    )
    Alert.alert("Document envoyé", "Votre document est en cours de vérification.")
  }

  const approvedCount = docs.filter((d) => d.status === "approved").length
  const total = docs.length

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Progress */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Profil documentaire</Text>
        <Text style={styles.progressCount}>{approvedCount}/{total} documents validés</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(approvedCount / total) * 100}%` as any }]} />
        </View>
        {approvedCount < total && (
          <Text style={styles.progressHint}>
            Complétez vos documents pour accéder à toutes les fonctionnalités
          </Text>
        )}
      </View>

      {/* Documents list */}
      <View style={styles.docList}>
        {docs.map((doc) => {
          const statusCfg = STATUS_CONFIG[doc.status]
          return (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docLeft}>
                <Text style={styles.docIcon}>{doc.icon}</Text>
                <View style={styles.docInfo}>
                  <View style={styles.docLabelRow}>
                    <Text style={styles.docLabel}>{doc.label}</Text>
                    {doc.required && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Requis</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>
                      {statusCfg.label}
                    </Text>
                  </View>
                </View>
              </View>
              {(doc.status === "missing" || doc.status === "rejected") && (
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={() => handleUpload(doc.id)}
                >
                  <Text style={styles.uploadBtnText}>📤</Text>
                </TouchableOpacity>
              )}
              {doc.status === "pending" && (
                <View style={styles.pendingIcon}>
                  <Text>⏳</Text>
                </View>
              )}
              {doc.status === "approved" && (
                <View style={styles.approvedIcon}>
                  <Text>✅</Text>
                </View>
              )}
            </View>
          )
        })}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Les documents sont vérifiés par notre équipe sous 24h ouvrées. Assurez-vous que les photos soient claires et lisibles.
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5FA" },
  progressCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  progressTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 },
  progressCount: { fontSize: 13, color: "#666", marginBottom: 12 },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6B6BD5",
    borderRadius: 4,
  },
  progressHint: { fontSize: 12, color: "#888", marginTop: 10 },
  docList: { marginHorizontal: 16 },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  docLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  docIcon: { fontSize: 28, marginRight: 14 },
  docInfo: { flex: 1 },
  docLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  docLabel: { fontSize: 14, fontWeight: "600", color: "#333" },
  requiredBadge: {
    backgroundColor: "#EDE7F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  requiredText: { fontSize: 10, color: "#6B6BD5", fontWeight: "600" },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  uploadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EDE7F6",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtnText: { fontSize: 18 },
  pendingIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  approvedIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBox: {
    margin: 16,
    backgroundColor: "#EDE7F6",
    borderRadius: 12,
    padding: 16,
  },
  infoText: { fontSize: 13, color: "#5E35B1", lineHeight: 20 },
})
