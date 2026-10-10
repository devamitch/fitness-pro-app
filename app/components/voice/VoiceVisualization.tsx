"use client"

import type React from "react"
import { useEffect } from "react"
import { View, StyleSheet, type ViewStyle } from "react-native"
import { Canvas, Path, useValue, runTiming, useComputedValue, Skia } from "@shopify/react-native-skia"
import { useTheme } from "@/hooks/useTheme"
import { useVoiceData } from "@/hooks/useVoiceData"

export type VisualizationType = "wave" | "bars" | "circle" | "dots" | "pulse"

export interface VoiceVisualizationProps {
  type?: VisualizationType
  color?: string
  style?: ViewStyle
  active?: boolean
  sensitivity?: number // 0 to 1
}

export const VoiceVisualization: React.FC<VoiceVisualizationProps> = ({
  type = "wave",
  color,
  style,
  active = false,
  sensitivity = 0.5,
}) => {
  const { colors } = useTheme()
  const visualColor = color || colors.primary
  const { voiceData, startListening, stopListening } = useVoiceData()

  const amplitude = useValue(0)

  // Start/stop listening based on active prop
  useEffect(() => {
    if (active) {
      startListening()
    } else {
      stopListening()
    }

    return () => {
      stopListening()
    }
  }, [active])

  // Update amplitude based on voice data
  useEffect(() => {
    if (voiceData && voiceData.length > 0) {
      // Calculate average amplitude from voice data
      const avg = voiceData.reduce((sum, val) => sum + Math.abs(val), 0) / voiceData.length
      // Apply sensitivity
      const normalizedAmplitude = Math.min(avg * sensitivity * 2, 1)
      runTiming(amplitude, normalizedAmplitude, { duration: 100 })
    } else {
      runTiming(amplitude, 0, { duration: 300 })
    }
  }, [voiceData, sensitivity])

  // Wave visualization
  const wavePath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const height = 100
    const width = 200

    path.moveTo(0, height / 2)

    const amplitude_value = amplitude.current * 40
    const frequency = 0.05
    const segments = 20

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width
      const y = height / 2 + Math.sin(x * frequency + Date.now() * 0.01) * amplitude_value
      path.lineTo(x, y)
    }

    return path
  }, [amplitude])

  // Bars visualization
  const getBarsPath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const height = 100
    const width = 200
    const barCount = 10
    const barWidth = width / (barCount * 2)

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth * 2) + barWidth / 2
      const barAmplitude = amplitude.current * Math.random() * height * 0.8
      const y1 = height / 2 - barAmplitude / 2
      const y2 = height / 2 + barAmplitude / 2

      path.addRect(Skia.XYWHRect(x, y1, barWidth, y2 - y1))
    }

    return path
  }, [amplitude])

  // Circle visualization
  const getCirclePath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const size = 100
    const cx = size / 2
    const cy = size / 2
    const baseRadius = size * 0.3
    const maxExtraRadius = size * 0.15

    const radius = baseRadius + amplitude.current * maxExtraRadius
    path.addCircle(cx, cy, radius)

    return path
  }, [amplitude])

  // Render the appropriate visualization based on type
  const renderVisualization = () => {
    switch (type) {
      case "wave":
        return <Path path={wavePath} color={visualColor} style="stroke" strokeWidth={3} />
      case "bars":
        return <Path path={getBarsPath} color={visualColor} />
      case "circle":
        return <Path path={getCirclePath} color={visualColor} />
      // Other types would be implemented similarly
      default:
        return <Path path={wavePath} color={visualColor} style="stroke" strokeWidth={3} />
    }
  }

  return (
    <View style={[styles.container, style]}>
      <Canvas style={styles.canvas}>{renderVisualization()}</Canvas>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    width: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  canvas: {
    flex: 1,
    width: "100%",
  },
})
