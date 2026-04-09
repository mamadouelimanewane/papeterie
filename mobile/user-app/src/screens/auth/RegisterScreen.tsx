import React, { useState } from "react"
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native"
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme"
import { useStore } from "../../store/useStore"
import { authAPI } from "../../services/api"
import { Ionicons } from "@expo/vector-icons"
import { Alert } from "react-native"
import * as SecureStore from "expo-secure-store"

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", confirmPassword: "" })
  const [loading, setLoading] = useState(false)
  const setUser = useStore((s) => s.setUser)

  function update(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })) }

  async function handleRegister() {
    if (!form.name || !form.phone || !form.password) {
      Alert.alert("Erreur", "Veuillez remplir les champs obligatoires.")
      return
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)
    try {
      const { data } = await authAPI.register({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
      })

      if (data.token) {
        await SecureStore.setItemAsync("user_token", data.token)
        setUser(data.user, data.token)
        // La navigation vers l'app se fait automatiquement via l'état du store
      }
    } catch (err: any) {
      console.error("[Register]", err)
      Alert.alert("Erreur", err.message || "Impossible de créer le compte")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}><Ionicons name="arrow-back" size={20} /> Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez Papeterie et commandez vos fournitures scolaires</Text>

        <View style={styles.form}>
          {[
            { key: "name", label: "Nom complet", placeholder: "Fatou Diallo", icon: "person" },
            { key: "phone", label: "Téléphone", placeholder: "+221 77 000 00 00", icon: "phone-portrait", keyboardType: "phone-pad" },
            { key: "email", label: "Email (optionnel)", placeholder: "fatou@gmail.com", icon: "mail", keyboardType: "email-address" },
            { key: "password", label: "Mot de passe", placeholder: "••••••••", icon: "lock-closed", secure: true },
            { key: "confirmPassword", label: "Confirmer le mot de passe", placeholder: "••••••••", icon: "lock-closed", secure: true },
          ].map(({ key, label, placeholder, icon, keyboardType, secure }: any) => (
            <View key={key} style={styles.inputGroup}>
              <Text style={styles.label}>{label}</Text>
              <View style={styles.inputRow}>
                <Ionicons name={icon as any} size={18} color={COLORS.gray} style={{ marginRight: SPACING.sm }} />
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChangeText={(v) => update(key, v)}
                  secureTextEntry={secure}
                  keyboardType={keyboardType || "default"}
                  placeholderTextColor={COLORS.gray}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.registerBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.registerBtnText}>Créer mon compte</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Déjà inscrit ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flexGrow: 1, padding: SPACING.lg },
  backBtn: { marginBottom: SPACING.lg },
  backText: { color: COLORS.primary, fontSize: FONTS.sizes.md, fontWeight: "600" },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: "800", color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  form: { gap: SPACING.md },
  inputGroup: { gap: 6 },
  label: { fontSize: FONTS.sizes.sm, fontWeight: "600", color: COLORS.text },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    backgroundColor: COLORS.grayLight, paddingHorizontal: SPACING.md, height: 52,
  },
  icon: { fontSize: 18, marginRight: SPACING.sm },
  input: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.text },
  registerBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 52,
    alignItems: "center", justifyContent: "center", marginTop: SPACING.sm,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  registerBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: "700" },
  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: SPACING.xl },
  loginText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  loginLink: { color: COLORS.primary, fontSize: FONTS.sizes.md, fontWeight: "700" },
})
