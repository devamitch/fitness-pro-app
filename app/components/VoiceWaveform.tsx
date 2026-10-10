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
} from "@shopify/react-native-skia"
import { useTheme } from "../theme/theme"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

interface VoiceWaveformProps {
  isRecording: boolean
  amplitude?: number // 0 to 1
  width?: number
  height?: number
  barCount?: number
  barWidth?: number
  barGap?: number
  style?: any
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isRecording,
  amplitude = 0.5,
  width = SCREEN_WIDTH - 120,
  height = 60,
  barCount = 30,
  barWidth = 3,
  barGap = 4,
  style,
}) => {
  const theme = useTheme()

  // Animation values
  const clock = useClockValue()
  const isActive = useValue(0)
  const amplitudeValue = useValue(0)

  // Update amplitude value when props change
  useEffect(() => {
    runTiming(amplitudeValue, amplitude, { duration: 300, easing: Easing.inOut(Easing.ease) })
  }, [amplitude])

  // Update active state when recording state changes
  useEffect(() => {
    runTiming(isActive, isRecording ? 1 : 0, { duration: 300, easing: Easing.inOut(Easing.ease) })
  }, [isRecording])

  // Compute the waveform path
  const waveformPath = useComputedValue(() => {
    const path = Skia.Path.Make()

    const totalWidth = barCount * (barWidth + barGap) - barGap
    const startX = (width - totalWidth) / 2

    for (let i = 0; i < barCount; i++) {
      const x = startX + i * (barWidth + barGap)

      // Calculate bar height based on position and time
      const timeOffset = (clock.current / 1000) % 2
      const positionFactor = Math.abs(i / barCount - 0.5) * 2 // 0 at center, 1 at edges

      const heightMultiplier = mix(
        isActive.current,
        0.2,
        1 - positionFactor * 0.5 + Math.sin(i * 0.4 + timeOffset * Math.PI) * 0.2,
      )

      const barHeight = height * heightMultiplier * amplitudeValue.current
      const y = (height - barHeight) / 2

      path.addRect(Skia.XYWHRect(x, y, barWidth, barHeight))
    }

    return path
  }, [clock, isActive, amplitudeValue])

  // Compute the glow path (larger version of the waveform)
  const glowPath = useComputedValue(() => {
    const path = Skia.Path.Make()

    const totalWidth = barCount * (barWidth + barGap) - barGap
    const startX = (width - totalWidth) / 2

    for (let i = 0; i < barCount; i++) {
      const x = startX + i * (barWidth + barGap)

      // Calculate bar height based on position and time
      const timeOffset = (clock.current / 1000) % 2
      const positionFactor = Math.abs(i / barCount - 0.5) * 2 // 0 at center, 1 at edges

      const heightMultiplier = mix(
        isActive.current,
        0.2,
        1 - positionFactor * 0.5 + Math.sin(i * 0.4 + timeOffset * Math.PI) * 0.2,
      )

      const barHeight = height * heightMultiplier * amplitudeValue.current * 1.2
      const y = (height - barHeight) / 2

      path.addRect(Skia.XYWHRect(x - 1, y - 1, barWidth + 2, barHeight + 2))
    }

    return path
  }, [clock, isActive, amplitudeValue])

  // Compute the circle pulse
  const pulseRadius = useComputedValue(() => {
    const base = 8
    const pulse = Math.sin(clock.current / 300) * 2
    return base + pulse * isActive.current
  }, [clock, isActive])

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Canvas style={styles.canvas}>
        {/* Background pulse circle */}
        <Circle cx={width / 2} cy={height / 2} r={pulseRadius}>
          <SweepGradient
            c={vec(width / 2, height / 2)}
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
          />
          <BlurMask blur={4} style="normal" />
        </Circle>

        {/* Glow effect */}
        <Group opacity={isActive}>
          <Path path={glowPath}>
            <SweepGradient
              c={vec(width / 2, height / 2)}
              colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            />
            <BlurMask blur={8} style="normal" />
          </Path>
        </Group>

        {/* Main waveform */}
        <Path path={waveformPath}>
          <SweepGradient
            c={vec(width / 2, height / 2)}
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
          />
        </Path>
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
