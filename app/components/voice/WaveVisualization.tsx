"use client"

import type React from "react"
import {
  Group,
  Path,
  useComputedValue,
  Skia,
  vec,
  BlurMask,
  LinearGradient,
  mix,
  Paint,
} from "@shopify/react-native-skia"

interface WaveVisualizationProps {
  clock: any
  isActive: any
  amplitude: any
  frequency: any
  energy: any
  pause: any
  width: number
  height: number
  colors: string[]
  animated: boolean
  sensitivity: number
  showBackground: boolean
}

export const WaveVisualization: React.FC<WaveVisualizationProps> = ({
  clock,
  isActive,
  amplitude,
  frequency,
  energy,
  pause,
  width,
  height,
  colors,
  animated,
  sensitivity,
  showBackground,
}) => {
  // Compute the wave path
  const wavePath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const centerY = height / 2
    const waveHeight = height * 0.4 * sensitivity

    // Start at the left edge
    path.moveTo(0, centerY)

    // Draw the wave
    for (let x = 0; x <= width; x += 1) {
      const normalizedX = x / width

      // Calculate wave parameters based on voice data
      const time = animated ? (clock.current / 1000) % 10 : 0
      const amplitudeFactor = mix(isActive.current, 0.2, amplitude.current)
      const frequencyFactor = mix(isActive.current, 1, 1 + frequency.current * 2)
      const energyFactor = mix(isActive.current, 1, 1 + energy.current)
      const pauseFactor = 1 - pause.current * 0.5

      // Calculate y position with multiple sine waves
      const y1 =
        Math.sin(normalizedX * Math.PI * 2 * frequencyFactor + time) * waveHeight * amplitudeFactor * pauseFactor
      const y2 =
        Math.sin(normalizedX * Math.PI * 4 * frequencyFactor + time * 1.5) *
        waveHeight *
        0.5 *
        amplitudeFactor *
        pauseFactor
      const y3 =
        Math.sin(normalizedX * Math.PI * 8 * frequencyFactor + time * 0.5) *
        waveHeight *
        0.25 *
        amplitudeFactor *
        pauseFactor

      const y = centerY + (y1 + y2 + y3) * energyFactor

      path.lineTo(x, y)
    }

    // Complete the path to form a closed shape
    path.lineTo(width, height)
    path.lineTo(0, height)
    path.close()

    return path
  }, [clock, isActive, amplitude, frequency, energy, pause])

  // Compute the glow path (slightly larger)
  const glowPath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const centerY = height / 2
    const waveHeight = height * 0.45 * sensitivity

    path.moveTo(0, centerY)

    for (let x = 0; x <= width; x += 1) {
      const normalizedX = x / width

      const time = animated ? (clock.current / 1000) % 10 : 0
      const amplitudeFactor = mix(isActive.current, 0.2, amplitude.current)
      const frequencyFactor = mix(isActive.current, 1, 1 + frequency.current * 2)
      const energyFactor = mix(isActive.current, 1, 1 + energy.current)
      const pauseFactor = 1 - pause.current * 0.5

      const y1 =
        Math.sin(normalizedX * Math.PI * 2 * frequencyFactor + time) * waveHeight * amplitudeFactor * pauseFactor
      const y2 =
        Math.sin(normalizedX * Math.PI * 4 * frequencyFactor + time * 1.5) *
        waveHeight *
        0.5 *
        amplitudeFactor *
        pauseFactor
      const y3 =
        Math.sin(normalizedX * Math.PI * 8 * frequencyFactor + time * 0.5) *
        waveHeight *
        0.25 *
        amplitudeFactor *
        pauseFactor

      const y = centerY + (y1 + y2 + y3) * energyFactor

      path.lineTo(x, y)
    }

    path.lineTo(width, height)
    path.lineTo(0, height)
    path.close()

    return path
  }, [clock, isActive, amplitude, frequency, energy, pause])

  return (
    <Group>
      {/* Background glow */}
      {showBackground && (
        <Group opacity={mix(isActive, 0.2, 0.6)}>
          <Path path={glowPath}>
            <Paint>
              <LinearGradient
                start={vec(width / 2, 0)}
                end={vec(width / 2, height)}
                colors={[colors[0], "transparent"]}
              />
              <BlurMask blur={10} style="normal" />
            </Paint>
          </Path>
        </Group>
      )}

      {/* Main wave */}
      <Path path={wavePath}>
        <Paint>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={[colors[0], colors.length > 1 ? colors[1] : colors[0]]}
          />
        </Paint>
      </Path>
    </Group>
  )
}
