import React, { useEffect, useRef } from "react"
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { COLORS, FONTS } from "../../constants/theme"
import { Ionicons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

type Props = {
  navigation: NativeStackNavigationProp<any>
}

export default function SplashScreen({ navigation }: Props) {
  const scale = useRef(new Animated.Value(0.5)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    const timer = setTimeout(() => {
      navigation.replace("Login")
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale }], opacity }]}>
        <View style={styles.logoBox}>
          <View style={styles.iconContainer}>
            <Ionicons name="book" size={50} color={COLORS.primary} style={styles.bookIcon} />
            <Ionicons name="create" size={30} color={COLORS.secondary} style={styles.penIcon} />
          </View>
          <Text style={styles.logoText}>Papeterie</Text>
        </View>
        <Text style={styles.tagline}>Espace Livreur</Text>
      </Animated.View>
      <Text style={styles.version}>v1.0.0-PROD</Text>
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
  logoContainer: {
    alignItems: "center",
  },
  logoBox: {
    width: 140,
    height: 140,
    backgroundColor: COLORS.white,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 24,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  bookIcon: { marginRight: -12 },
  penIcon: { transform: [{ rotate: "45deg" }] },
  logoText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 4,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  version: {
    position: "absolute",
    bottom: 40,
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
})
