import React, { useEffect } from "react"
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native"
import { COLORS, FONTS } from "../../constants/theme"
import { Ionicons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

export default function SplashScreen({ navigation }: any) {
  const scaleAnim = new Animated.Value(0.3)
  const opacityAnim = new Animated.Value(0)

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start()

    const timer = setTimeout(() => navigation.replace("Login"), 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <View style={styles.logoBox}>
          <View style={styles.iconContainer}>
            <Ionicons name="book" size={50} color={COLORS.primary} style={styles.bookIcon} />
            <Ionicons name="create" size={30} color={COLORS.secondary} style={styles.penIcon} />
          </View>
          <Text style={styles.logoText}>Papeterie</Text>
        </View>
        <Text style={styles.tagline}>Fournitures Scolaires & Bureau</Text>
      </Animated.View>
      <Text style={styles.footer}>© 2026 Papeterie. Tous droits réservés.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: { alignItems: "center" },
  logoBox: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 20,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  bookIcon: { marginRight: -12 },
  penIcon: { transform: [{ rotate: "45deg" }] },
  logoIcon: { fontSize: 48 },
  logoText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 2,
  },
  tagline: {
    color: "rgba(255,255,255,0.85)",
    fontSize: FONTS.sizes.md,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    color: "rgba(255,255,255,0.5)",
    fontSize: FONTS.sizes.xs,
  },
})
