import React, { useState, useEffect, useRef } from "react"
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator, Image,
  ScrollView, Dimensions
} from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { Ionicons } from "@expo/vector-icons"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { api } from "../../services/api"
import { useStore } from "../../store/useStore"

const { width, height } = Dimensions.get("window")

export default function AIScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions()
  const [photo, setPhoto] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<any>(null)
  const cameraRef = useRef<any>(null)
  
  const addToCart = useStore((s) => s.addToCart)

  if (!permission) {
    return <View />
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>L'accès à la caméra est nécessaire pour scanner votre liste.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Autoriser l'accès</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const takePhoto = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true }
      const data = await cameraRef.current.takePictureAsync(options)
      setPhoto(data.uri)
      analyzePhoto(data.base64)
    }
  }

  const analyzePhoto = async (base64: string) => {
    setIsAnalyzing(true)
    try {
      const res = await api.post("/ai/scan", { image: base64 })
      setResults(res.data)
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'analyser l'image. Veuillez réessayer.")
      setPhoto(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAddToCartAll = () => {
    if (results?.items) {
      results.items.forEach((item: any) => {
        // En conditions réelles, on mapperait vers un vrai produit de la DB
        addToCart({
          id: `ai-${item.id}`,
          name: item.name,
          price: item.price,
          quantity: item.qty || 1,
          image: undefined,
          storeId: "ai-store",
          storeName: "Scan IA"
        })
      })
      Alert.alert("Succès", "Tous les articles ont été ajoutés à votre panier !", [
        { text: "Voir le panier", onPress: () => navigation.navigate("Cart") },
        { text: "Continuer" }
      ])
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner IA Papeterie</Text>
        <View style={{ width: 28 }} />
      </View>

      {!photo ? (
        <View style={styles.cameraWrapper}>
          <CameraView 
             ref={cameraRef}
             style={styles.camera}
             facing="back"
          >
            <View style={styles.overlay}>
               <View style={styles.scanFrame} />
               <Text style={styles.overlayText}>Cadrez votre liste scolaire ici</Text>
            </View>
          </CameraView>
          <View style={styles.controls}>
             <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
                <View style={styles.captureBtnInner} />
             </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.resultsWrapper}>
          <Image source={{ uri: photo }} style={styles.previewImg} />
          
          {isAnalyzing ? (
             <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="large" color={COLORS.white} />
                <Text style={styles.analyzingText}>Analyse intelligente en cours...</Text>
                <Text style={styles.analyzingSubtext}>Nous identifions vos fournitures...</Text>
             </View>
          ) : results ? (
            <View style={styles.resultsCard}>
               <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>Articles détectés ({results.items.length})</Text>
                  <Text style={styles.resultsTotal}>{results.estimatedPrice.toLocaleString()} F</Text>
               </View>
               <ScrollView style={styles.resultsList}>
                  {results.items.map((item: any) => (
                    <View key={item.id} style={styles.resultItem}>
                       <View style={styles.resultCount}>
                          <Text style={styles.resultCountText}>{item.qty}x</Text>
                       </View>
                       <View style={styles.resultInfo}>
                          <Text style={styles.resultName}>{item.name}</Text>
                          <Text style={styles.resultConfidence}>Fiabilité: {Math.round(item.confidence * 100)}%</Text>
                       </View>
                       <Text style={styles.resultPrice}>{item.price.toLocaleString()} F</Text>
                    </View>
                  ))}
               </ScrollView>
               <View style={styles.actions}>
                  <TouchableOpacity style={styles.retryBtn} onPress={() => { setPhoto(null); setResults(null); }}>
                     <Text style={styles.retryBtnText}>Reprendre</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleAddToCartAll}>
                     <Text style={styles.confirmBtnText}>Tout ajouter au panier</Text>
                  </TouchableOpacity>
               </View>
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayLight
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  permissionContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  permissionText: { textAlign: "center", fontSize: 16, color: COLORS.textSecondary, marginBottom: 20 },
  permissionBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 25, paddingVertical: 12, borderRadius: RADIUS.md },
  permissionBtnText: { color: COLORS.white, fontWeight: "700" },
  cameraWrapper: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },
  scanFrame: { 
    width: width * 0.8, height: height * 0.5, 
    borderWidth: 2, borderColor: COLORS.white, 
    borderRadius: RADIUS.lg, borderStyle: "dashed" 
  },
  overlayText: { color: COLORS.white, marginTop: 20, fontWeight: "600", fontSize: 16 },
  controls: { 
    position: "absolute", bottom: 40, width: "100%", 
    alignItems: "center" 
  },
  captureBtn: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: "rgba(255,255,255,0.3)", 
    alignItems: "center", justifyContent: "center" 
  },
  captureBtnInner: { 
    width: 64, height: 64, borderRadius: 32, 
    backgroundColor: COLORS.white 
  },
  resultsWrapper: { flex: 1 },
  previewImg: { width: "100%", height: "100%", position: "absolute" },
  analyzingOverlay: { 
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)", 
    justifyContent: "center", alignItems: "center" 
  },
  analyzingText: { color: COLORS.white, fontSize: 20, fontWeight: "800", marginTop: 20 },
  analyzingSubtext: { color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 8 },
  resultsCard: { 
    position: "absolute", bottom: 0, width: "100%", 
    height: "70%", backgroundColor: COLORS.white, 
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 15
  },
  resultsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  resultsTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  resultsTotal: { fontSize: 20, fontWeight: "900", color: COLORS.primary },
  resultsList: { flex: 1 },
  resultItem: { 
    flexDirection: "row", alignItems: "center", 
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight 
  },
  resultCount: { 
    padding: 8, 
    width: 40, height: 40, borderRadius: 8, 
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.primary + "15",
  },
  resultCountText: { fontWeight: "bold", color: COLORS.primary },
  resultInfo: { flex: 1, marginLeft: 12 },
  resultName: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  resultConfidence: { fontSize: 10, color: COLORS.success, marginTop: 2 },
  resultPrice: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  retryBtn: { flex: 1, backgroundColor: COLORS.grayLight, paddingVertical: 16, borderRadius: RADIUS.md, alignItems: "center" },
  retryBtnText: { color: COLORS.textSecondary, fontWeight: "700" },
  confirmBtn: { flex: 2, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.md, alignItems: "center" },
  confirmBtnText: { color: COLORS.white, fontWeight: "800" },
})
