import React, { useState } from "react"
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from "react-native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useDriverStore } from "../../store/useDriverStore"
import { authAPI } from "../../services/api"
import { COLORS } from "../../constants/theme"
import { Ionicons } from "@expo/vector-icons"
import * as SecureStore from "expo-secure-store"

type Props = { navigation: NativeStackNavigationProp<any> }

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setDriver } = useDriverStore()

  const handleRegister = async () => {
    if (!name || !password || (!email && !phone)) {
      Alert.alert("Erreur", "Veuillez remplir le nom, un email ou téléphone, et le mot de passe")
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.register({ name, email: email || undefined, phone: phone || undefined, password })
      await SecureStore.setItemAsync("driver_token", res.data.token)
      setDriver(res.data.driver, res.data.token)
      Alert.alert("Succès", "Compte créé ! Votre demande est en attente de validation.")
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Inscription impossible, réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="bicycle" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Devenir Livreur</Text>
          <Text style={styles.subtitle}>Créez votre compte Papeterie Livreur</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom complet *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={COLORS.gray} style={styles.icon} />
              <TextInput style={styles.input} placeholder="Prénom Nom" value={name} onChangeText={setName} placeholderTextColor="#aaa" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={COLORS.gray} style={styles.icon} />
              <TextInput style={styles.input} placeholder="votre@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} placeholderTextColor="#aaa" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={18} color={COLORS.gray} style={styles.icon} />
              <TextInput style={styles.input} placeholder="+221 77 000 00 00" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholderTextColor="#aaa" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.gray} style={styles.icon} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="••••••••" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} placeholderTextColor="#aaa" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Créer mon compte</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 32 },
  header: { alignItems: "center", marginBottom: 28 },
  logoCircle: { width: 76, height: 76, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: 14, elevation: 6 },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.primary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: "center" },
  form: { backgroundColor: "#fff", borderRadius: 20, padding: 22, elevation: 4 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#F0F0F0", backgroundColor: "#FAFAFA", borderRadius: 12 },
  icon: { marginLeft: 12 },
  input: { flex: 1, paddingHorizontal: 10, paddingVertical: 12, fontSize: 15, color: COLORS.text },
  eyeBtn: { paddingHorizontal: 12 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8, elevation: 5 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  link: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
})
