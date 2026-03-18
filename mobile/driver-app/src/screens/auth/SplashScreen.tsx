"use client"

import React, { useEffect, useRef } from "react"
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

const { width, height } = Dimensions.get("window")

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
        duration: 600,
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
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🚗</Text>
        </View>
        <Text style={styles.appName}>NDUGUMi</Text>
        <Text style={styles.tagline}>Driver App</Text>
      </Animated.View>
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6B6BD5",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoIcon: {
    fontSize: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
    letterSpacing: 1,
  },
  version: {
    position: "absolute",
    bottom: 40,
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
})
