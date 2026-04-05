import React, { useEffect, useRef } from "react"
import { View, Animated, StyleSheet, ViewStyle } from "react-native"
import { COLORS } from "../../constants/theme"

interface SkeletonProps {
  width: number | string
  height: number | string
  radius?: number
  style?: ViewStyle
}

export default function Skeleton({ width, height, radius = 8, style }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { 
          width: width as any, 
          height: height as any, 
          borderRadius: radius, 
          opacity 
        },
        style,
      ]}
    />
  )
}


const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.grayMedium,
  },
})
