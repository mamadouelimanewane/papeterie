import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useDriverStore } from "../../store/useDriverStore"

type Props = {
  navigation: NativeStackNavigationProp<any>
}

export default function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setDriver } = useDriverStore()

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs")
      return
    }
    setLoading(true)
    setTimeout(() => {
      setDriver(
        {
          id: "DRV-001",
          name: "Moussa Diallo",
          phone: "+221 77 123 45 67",
          email: "moussa.diallo@ndugumi.com",
          vehicleType: "Moto",
          rating: 4.8,
          totalOrders: 247,
          walletBalance: 15400,
        },
        "mock-driver-token-123"
      )
      setLoading(false)
    }, 1500)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🚗</Text>
        </View>
        <Text style={styles.title}>NDUGUMi Driver</Text>
        <Text style={styles.subtitle}>Connectez-vous à votre compte livreur</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Numéro de téléphone</Text>
          <View style={styles.phoneRow}>
            <View style={styles.flag}>
              <Text style={styles.flagText}>🇸🇳 +221</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="77 123 45 67"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor="#aaa"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Pas encore livreur ? </Text>
        <TouchableOpacity>
          <Text style={styles.signupLink}>Rejoignez-nous</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5FA",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6B6BD5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoIcon: { fontSize: 36 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1A2E",
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 6,
    textAlign: "center",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
  },
  flag: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
  },
  flagText: { fontSize: 14, color: "#333" },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  passwordRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  eyeBtn: { paddingHorizontal: 14 },
  eyeIcon: { fontSize: 18 },
  loginBtn: {
    backgroundColor: "#6B6BD5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  forgotBtn: { alignItems: "center", marginTop: 16 },
  forgotText: { color: "#6B6BD5", fontSize: 14 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  footerText: { color: "#888", fontSize: 14 },
  signupLink: { color: "#6B6BD5", fontSize: 14, fontWeight: "600" },
})
