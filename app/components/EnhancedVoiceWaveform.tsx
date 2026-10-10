"use client"

import type React from "react"
import { useEffect } from "react"
import { StyleSheet, View, Dimensions } from "react-native"
import {
  Canvas,
  Path,
  useValue,
  useComputedValue,
  useClockValue,
  Skia,
  Group,
  BlurMask,
  vec,
  SweepGradient,
  Circle,
  mix,
  runTiming,
  Easing,
  Paint,
  useValueEffect,
  LinearGradient,
} from "@shopify/react-native-skia"
import { useTheme } from "../theme/theme"
import { useSharedValue } from "react-native-reanimated"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

interface EnhancedVoiceWaveformProps {
  isRecording: boolean
  amplitude?: number // 0 to 1
  width?: number
  height?: number
  style?: any
}

export const EnhancedVoiceWaveform: React.FC<EnhancedVoiceWaveformProps> = ({
  isRecording,
  amplitude = 0.5,
  width = SCREEN_WIDTH - 120,
  height = 60,
  style,
}) => {
  const theme = useTheme()

  // Animation values
  const clock = useClockValue()
  const isActive = useValue(0)
  const amplitudeValue = useValue(0)
  const animatedAmplitude = useSharedValue(amplitude)

  // Update amplitude value when props change
  useEffect(() => {
    animatedAmplitude.value = amplitude
  }, [amplitude])

  useValueEffect(clock, () => {
    // Update amplitude with a slight random variation for natural effect
    if (isRecording) {
      const randomVariation = Math.sin(clock.current / 200) * 0.1
      amplitudeValue.current = animatedAmplitude.value * (1 + randomVariation)
    }
  })

  // Update active state when recording state changes
  useEffect(() => {
    runTiming(isActive, isRecording ? 1 : 0, { duration: 300, easing: Easing.inOut(Easing.ease) })
  }, [isRecording])

  // Compute the circular wave path
  const wavePath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.4
    const numPoints = 180
    const angleIncrement = (2 * Math.PI) / numPoints

    // First wave (inner)
    for (let i = 0; i <= numPoints; i++) {
      const angle = i * angleIncrement
      const time = (clock.current / 1000) % 10

      // Calculate radius with time-based variation
      const radiusVariation = Math.sin(angle * 8 + time * 2) * 5 * isActive.current
      const radiusMultiplier = 0.6 + amplitudeValue.current * 0.4
      const radius = (maxRadius * radiusMultiplier + radiusVariation) * isActive.current

      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      if (i === 0) {
        path.moveTo(x, y)
      } else {
        path.lineTo(x, y)
      }
    }

    path.close()
    return path
  }, [clock, isActive, amplitudeValue])

  // Compute the outer glow path
  const glowPath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.45
    const numPoints = 180
    const angleIncrement = (2 * Math.PI) / numPoints

    // Outer glow wave
    for (let i = 0; i <= numPoints; i++) {
      const angle = i * angleIncrement
      const time = (clock.current / 1000) % 10

      // Calculate radius with time-based variation (different frequency)
      const radiusVariation = Math.sin(angle * 6 + time * 1.5) * 8 * isActive.current
      const radiusMultiplier = 0.7 + amplitudeValue.current * 0.3
      const radius = (maxRadius * radiusMultiplier + radiusVariation) * isActive.current

      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      if (i === 0) {
        path.moveTo(x, y)
      } else {
        path.lineTo(x, y)
      }
    }

    path.close()
    return path
  }, [clock, isActive, amplitudeValue])

  // Compute the frequency bars
  const barsPath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const numBars = 32
    const barWidth = width / numBars
    const barGap = 2
    const maxBarHeight = height * 0.8

    for (let i = 0; i < numBars; i++) {
      const time = (clock.current / 1000) % 10
      const normalizedPos = i / numBars

      // Calculate height based on position and time
      const heightFactor = Math.sin(normalizedPos * Math.PI + time * 2) * 0.5 + 0.5
      const heightMultiplier = mix(isActive.current, 0.1, heightFactor * amplitudeValue.current)

      const barHeight = maxBarHeight * heightMultiplier
      const x = i * barWidth
      const y = (height - barHeight) / 2

      path.addRect(Skia.XYWHRect(x + barGap / 2, y, barWidth - barGap, barHeight))
    }

    return path
  }, [clock, isActive, amplitudeValue])

  // Compute the pulse effect
  const pulseRadius = useComputedValue(() => {
    return mix(isActive.current, 0, Math.min(width, height) * 0.5 * amplitudeValue.current)
  }, [isActive, amplitudeValue])

  // Compute the pulse opacity
  const pulseOpacity = useComputedValue(() => {
    const time = (clock.current / 300) % 10
    return mix(isActive.current, 0, Math.sin(time) * 0.3 + 0.2)
  }, [clock, isActive])

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Canvas style={styles.canvas}>
        {/* Pulse effect */}
        <Circle cx={width / 2} cy={height / 2} r={pulseRadius} opacity={pulseOpacity}>
          <Paint>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={[theme.colors.primary, theme.colors.secondary]}
            />
            <BlurMask blur={20} style="normal" />
          </Paint>
        </Circle>

        {/* Outer glow */}
        <Group opacity={mix(isActive.current, 0, 0.6)}>
          <Path path={glowPath}>
            <Paint>
              <SweepGradient
                c={vec(width / 2, height / 2)}
                colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
              />
              <BlurMask blur={15} style="normal" />
            </Paint>
          </Path>
        </Group>

        {/* Main wave */}
        <Path path={wavePath}>
          <Paint>
            <SweepGradient
              c={vec(width / 2, height / 2)}
              colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            />
          </Paint>
        </Path>

        {/* Frequency bars */}
        <Group opacity={mix(isActive.current, 0, 0.8)}>
          <Path path={barsPath}>
            <Paint>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, height)}
                colors={[theme.colors.secondary, theme.colors.primary]}
              />
            </Paint>
          </Path>
        </Group>
      </Canvas>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  canvas: {
    flex: 1,
  },
})
