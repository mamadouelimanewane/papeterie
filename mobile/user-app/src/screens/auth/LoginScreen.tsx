import React, { useState } from "react"
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { useStore } from "../../store/useStore"

export default function LoginScreen({ navigation }: any) {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const setUser = useStore((s) => s.setUser)

  async function handleLogin() {
    if (!phone || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.")
      return
    }
    setLoading(true)
    // Mock login — replace with real API call
    setTimeout(() => {
      setLoading(false)
      setUser({ id: "1", name: "Fatou Diallo", email: "fatou@gmail.com", phone }, "mock_token")
    }, 1200)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🌿</Text>
            <Text style={styles.logoTextGreen}>NDUGUMi</Text>
          </View>
          <Text style={styles.title}>Bienvenue !</Text>
          <Text style={styles.subtitle}>Connectez-vous pour commander</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <View style={styles.inputRow}>
              <Text style={styles.flag}>🇸🇳 +221</Text>
              <TextInput
                style={styles.input}
                placeholder="77 000 00 00"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={COLORS.gray}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginBtnText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.phoneOtpBtn}>
            <Text style={styles.phoneOtpText}>📱 Connexion par SMS OTP</Text>
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerLink}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flexGrow: 1, padding: SPACING.lg },
  header: { alignItems: "center", marginTop: SPACING.xl, marginBottom: SPACING.xl },
  logoBox: {
    width: 90, height: 90, backgroundColor: COLORS.grayLight,
    borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
  },
  logoIcon: { fontSize: 38 },
  logoTextGreen: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: "900" },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  form: { gap: SPACING.md },
  inputGroup: { gap: 6 },
  label: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.text },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    backgroundColor: COLORS.grayLight, paddingHorizontal: SPACING.md, height: 52,
  },
  flag: { fontSize: FONTS.sizes.md, marginRight: SPACING.sm, color: COLORS.text },
  input: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.text },
  eyeBtn: { padding: 4 },
  forgotBtn: { alignSelf: "flex-end" },
  forgotText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: "600" },
  loginBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 52,
    alignItems: "center", justifyContent: "center", marginTop: SPACING.sm,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  loginBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.gray, fontSize: FONTS.sizes.sm },
  phoneOtpBtn: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md, height: 52,
    alignItems: "center", justifyContent: "center",
  },
  phoneOtpText: { color: COLORS.primary, fontSize: FONTS.sizes.md, fontWeight: "600" },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: SPACING.xl },
  registerText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  registerLink: { color: COLORS.primary, fontSize: FONTS.sizes.md, fontWeight: "700" },
})
