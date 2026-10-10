"use client"

import { useState } from "react"
import { Image, type ImageSourcePropType, StyleSheet, type ViewStyle } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { Box } from "../layout/Box"

export interface ParallaxImageProps {
  source: ImageSourcePropType
  width: number | string
  height: number | string
  parallaxFactor?: number
  style?: ViewStyle
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center"
}

export const ParallaxImage = ({
  source,
  width,
  height,
  parallaxFactor = 0.2,
  style,
  resizeMode = "cover",
}: ParallaxImageProps) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)

  // Calculate the maximum translation based on parallax factor
  const maxTranslation = Math.max(10, Math.min(imageSize.width, imageSize.height) * parallaxFactor)

  // Handle scroll or movement
  const handleMovement = (offsetX: number, offsetY: number) => {
    // Convert offset to translation within the max range
    const newTranslateX = offsetX * maxTranslation
    const newTranslateY = offsetY * maxTranslation

    // Animate to the new position
    translateX.value = withTiming(newTranslateX, { duration: 100 })
    translateY.value = withTiming(newTranslateY, { duration: 100 })
  }

  // Animated style for the image
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    }
  })

  return (
    <Box
      width={width}
      height={height}
      overflow="hidden"
      style={style}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout
        setImageSize({ width, height })
      }}
    >
      <Animated.View
        style={[
          styles.imageContainer,
          animatedStyle,
          {
            width: typeof width === "number" ? width + maxTranslation * 2 : "100%",
            height: typeof height === "number" ? height + maxTranslation * 2 : "100%",
            marginLeft: -maxTranslation,
            marginTop: -maxTranslation,
          },
        ]}
      >
        <Image source={source} style={styles.image} resizeMode={resizeMode} />
      </Animated.View>
    </Box>
  )
}

const styles = StyleSheet.create({
  imageContainer: {
    position: "absolute",
  },
  image: {
    width: "100%",
    height: "100%",
  },
})
