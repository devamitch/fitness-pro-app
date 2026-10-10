"use client"

import { customFontsToLoad } from "@/config/fonts"
import { useTheme } from "@/hooks/useTheme"
import {
  Canvas,
  Group,
  Path,
  Skia,
  Text as SkiaText,
  runTiming,
  useComputedValue,
  useFont,
  useValue,
  vec,
} from "@shopify/react-native-skia"
import type React from "react"
import { useEffect } from "react"
import { StyleSheet, View, type ViewStyle } from "react-native"

interface AccuracyMeterProps {
  accuracy: number
  style?: ViewStyle
}

const AccuracyMeter: React.FC<AccuracyMeterProps> = ({ accuracy, style }) => {
  const { theme } = useTheme()
  const animatedAccuracy = useValue(0)
  const pulseValue = useValue(1)

  // Load font for text rendering
  const font = useFont(customFontsToLoad)

  // Update animated value when accuracy changes
  useEffect(() => {
    runTiming(animatedAccuracy, accuracy, { duration: 500 })

    // Add pulse effect when accuracy changes significantly
    if (Math.abs(animatedAccuracy.current - accuracy) > 10) {
      pulseValue.current = 1.2
      runTiming(pulseValue, 1, { duration: 300 })
    }
  }, [accuracy])

  // Compute the arc path for the meter
  const arcPath = useComputedValue(() => {
    const centerX = 100
    const centerY = 100
    const radius = 80
    const startAngle = Math.PI * 0.8
    const endAngle = Math.PI * 0.2
    const sweepAngle = endAngle - startAngle

    // Calculate angle based on accuracy
    const angle = startAngle + (sweepAngle * animatedAccuracy.current) / 100

    // Create background arc
    const bgPath = Skia.Path.Make()
    bgPath.addArc(
      { x: centerX - radius, y: centerY - radius, width: radius * 2, height: radius * 2 },
      startAngle * (180 / Math.PI),
      sweepAngle * (180 / Math.PI),
    )

    // Create foreground arc
    const fgPath = Skia.Path.Make()
    fgPath.addArc(
      { x: centerX - radius, y: centerY - radius, width: radius * 2, height: radius * 2 },
      startAngle * (180 / Math.PI),
      (angle - startAngle) * (180 / Math.PI),
    )

    return { bgPath: bgPath.toSVGString(), fgPath: fgPath.toSVGString() }
  }, [animatedAccuracy])

  // Compute color based on accuracy
  const color = useComputedValue(() => {
    if (animatedAccuracy.current < 50) {
      return theme.colors.error
    } else if (animatedAccuracy.current < 75) {
      return theme.colors.warning
    } else {
      return theme.colors.success
    }
  }, [animatedAccuracy, theme])

  // Compute text position
  const textPosition = useComputedValue(() => {
    return vec(100, 110)
  }, [])

  return (
    <View style={[styles.container, style]}>
      <Canvas style={styles.canvas}>
        <Group transform={[{ scale: pulseValue.current }]} origin={vec(100, 100)}>
          {/* Background arc */}
          <Path
            path={arcPath.current.bgPath}
            color="rgba(255, 255, 255, 0.2)"
            style="stroke"
            strokeWidth={12}
            strokeCap="round"
          />

          {/* Foreground arc */}
          <Path path={arcPath.current.fgPath} color={color.current} style="stroke" strokeWidth={12} strokeCap="round" />

          {/* Accuracy text */}
          {font && (
            <SkiaText
              text={`${Math.round(animatedAccuracy.current)}%`}
              x={textPosition.current.x}
              y={textPosition.current.y}
              font={font}
              color="white"
              opacity={0.9}
              origin={vec(100, 100)}
              textAlign="center"
            />
          )}
        </Group>
      </Canvas>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  canvas: {
    height: 200,
    width: 200,
  },
})

export default AccuracyMeter
