"use client"

import type React from "react"
import { Group, Path, useComputedValue, Skia, vec, LinearGradient, mix, Paint } from "@shopify/react-native-skia"

interface SpectrumVisualizationProps {
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

export const SpectrumVisualization: React.FC<SpectrumVisualizationProps> = ({
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
  // Compute the spectrum path
  const spectrumPath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const centerY = height / 2
    const maxHeight = height * 0.4 * sensitivity

    // Start at the left edge
    path.moveTo(0, centerY)

    // Number of points based on width
    const numPoints = Math.max(20, Math.floor(width / 5))

    // Calculate parameters based on voice data
    const time = animated ? (clock.current / 1000) % 10 : 0
    const amplitudeFactor = mix(isActive.current, 0.2, amplitude.current)
    const frequencyFactor = mix(isActive.current, 1, 1 + frequency.current * 2)
    const energyFactor = mix(isActive.current, 0.5, energy.current)
    const pauseFactor = 1 - pause.current * 0.5

    // Draw the spectrum
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * width
      const normalizedX = i / numPoints

      // Calculate height based on position (simulating frequency spectrum)
      let heightFactor

      if (normalizedX < 0.2) {
        // Low frequencies (left side)
        heightFactor = Math.sin(normalizedX * Math.PI * 5) * 0.8 + 0.2
        // Boost low frequencies if low frequency voice
        if (frequency.current < 0.4) {
          heightFactor *= 1 + (0.4 - frequency.current) * 2
        }
      } else if (normalizedX < 0.6) {
        // Mid frequencies (middle)
        heightFactor = Math.sin((normalizedX - 0.2) * Math.PI * 2.5) * 0.7 + 0.3
      } else {
        // High frequencies (right side)
        heightFactor = Math.sin((normalizedX - 0.6) * Math.PI * 5) * 0.6 * (1 - normalizedX) + 0.1
        // Boost high frequencies if high frequency voice
        if (frequency.current > 0.6) {
          heightFactor *= 1 + (frequency.current - 0.6) * 2
        }
      }

      // Add time-based variation
      const timeVariation = Math.sin(normalizedX * Math.PI * 8 + time * 2) * 0.2

      // Apply all factors
      heightFactor = (heightFactor + timeVariation) * amplitudeFactor * energyFactor * pauseFactor

      // Ensure minimum height when active
      if (isActive.current > 0.5) {
        heightFactor = Math.max(heightFactor, 0.05)
      }

      const y = centerY - maxHeight * heightFactor

      path.lineTo(x, y)
    }

    // Complete the path to form a closed shape
    path.lineTo(width, centerY)
    path.close()

    return path
  }, [clock, isActive, amplitude, frequency, energy, pause])

  // Compute the mirror path (bottom half)
  const mirrorPath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const centerY = height / 2
    const maxHeight = height * 0.4 * sensitivity

    // Start at the left edge
    path.moveTo(0, centerY)

    // Number of points based on width
    const numPoints = Math.max(20, Math.floor(width / 5))

    // Calculate parameters based on voice data
    const time = animated ? (clock.current / 1000) % 10 : 0
    const amplitudeFactor = mix(isActive.current, 0.2, amplitude.current)
    const frequencyFactor = mix(isActive.current, 1, 1 + frequency.current * 2)
    const energyFactor = mix(isActive.current, 0.5, energy.current)
    const pauseFactor = 1 - pause.current * 0.5

    // Draw the spectrum (mirrored)
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * width
      const normalizedX = i / numPoints

      // Calculate height based on position (simulating frequency spectrum)
      let heightFactor

      if (normalizedX < 0.2) {
        // Low frequencies (left side)
        heightFactor = Math.sin(normalizedX * Math.PI * 5) * 0.8 + 0.2
        if (frequency.current < 0.4) {
          heightFactor *= 1 + (0.4 - frequency.current) * 2
        }
      } else if (normalizedX < 0.6) {
        // Mid frequencies (middle)
        heightFactor = Math.sin((normalizedX - 0.2) * Math.PI * 2.5) * 0.7 + 0.3
      } else {
        // High frequencies (right side)
        heightFactor = Math.sin((normalizedX - 0.6) * Math.PI * 5) * 0.6 * (1 - normalizedX) + 0.1
        if (frequency.current > 0.6) {
          heightFactor *= 1 + (frequency.current - 0.6) * 2
        }
      }

      // Add time-based variation (slightly different phase for variation)
      const timeVariation = Math.sin(normalizedX * Math.PI * 8 + time * 2 + 0.5) * 0.2

      // Apply all factors
      heightFactor = (heightFactor + timeVariation) * amplitudeFactor * energyFactor * pauseFactor

      // Ensure minimum height when active
      if (isActive.current > 0.5) {
        heightFactor = Math.max(heightFactor, 0.05)
      }

      const y = centerY + maxHeight * heightFactor

      path.lineTo(x, y)
    }

    // Complete the path to form a closed shape
    path.lineTo(width, centerY)
    path.close()

    return path
  }, [clock, isActive, amplitude, frequency, energy, pause])

  return (
    <Group>
      {/* Top half */}
      <Path path={spectrumPath}>
        <Paint>
          <LinearGradient
            start={vec(width / 2, 0)}
            end={vec(width / 2, height / 2)}
            colors={[colors[0], colors.length > 1 ? colors[1] : colors[0]]}
          />
        </Paint>
      </Path>

      {/* Bottom half (mirrored) */}
      <Path path={mirrorPath}>
        <Paint>
          <LinearGradient
            start={vec(width / 2, height / 2)}
            end={vec(width / 2, height)}
            colors={[colors.length > 1 ? colors[1] : colors[0], colors.length > 2 ? colors[2] : colors[0]]}
          />
        </Paint>
      </Path>
    </Group>
  )
}
