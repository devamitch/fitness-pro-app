"use client"

import type React from "react"
import { Group, Path, useComputedValue, Skia, vec, LinearGradient, mix, Paint } from "@shopify/react-native-skia"

interface BarsVisualizationProps {
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

export const BarsVisualization: React.FC<BarsVisualizationProps> = ({
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
  // Compute the bars path
  const barsPath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const numBars = Math.max(5, Math.floor(width / 8)) // Adjust number of bars based on width
    const barWidth = width / numBars
    const barGap = Math.max(1, barWidth * 0.2)
    const maxBarHeight = height * 0.8

    for (let i = 0; i < numBars; i++) {
      const normalizedPos = i / numBars

      // Calculate parameters based on voice data
      const time = animated ? (clock.current / 1000) % 10 : 0
      const amplitudeFactor = mix(isActive.current, 0.1, amplitude.current)
      const frequencyFactor = mix(isActive.current, 1, 1 + frequency.current)
      const energyFactor = mix(isActive.current, 0.5, energy.current)
      const pauseFactor = 1 - pause.current * 0.7

      // Calculate height based on position, frequency and time
      let heightFactor

      if (i < numBars / 3) {
        // Lower frequencies (left side)
        heightFactor = Math.sin(normalizedPos * Math.PI + time) * 0.5 + 0.5
      } else if (i < (numBars * 2) / 3) {
        // Mid frequencies (middle)
        heightFactor = Math.sin(normalizedPos * Math.PI * 2 + time * 1.5) * 0.5 + 0.5
      } else {
        // Higher frequencies (right side)
        heightFactor = Math.sin(normalizedPos * Math.PI * 3 + time * 2) * 0.5 + 0.5
      }

      // Apply frequency bias based on the frequency value
      if (frequency.current > 0.6) {
        // High frequency voice - boost right side
        if (i > numBars * 0.6) {
          heightFactor *= 1 + (frequency.current - 0.6) * 1.5
        }
      } else if (frequency.current < 0.4) {
        // Low frequency voice - boost left side
        if (i < numBars * 0.4) {
          heightFactor *= 1 + (0.4 - frequency.current) * 1.5
        }
      }

      // Apply sensitivity and other factors
      heightFactor = heightFactor * sensitivity * amplitudeFactor * energyFactor * pauseFactor

      // Ensure minimum height when active
      if (isActive.current > 0.5) {
        heightFactor = Math.max(heightFactor, 0.05)
      }

      const barHeight = maxBarHeight * heightFactor
      const x = i * barWidth
      const y = (height - barHeight) / 2

      path.addRect(Skia.XYWHRect(x + barGap / 2, y, barWidth - barGap, barHeight))
    }

    return path
  }, [clock, isActive, amplitude, frequency, energy, pause])

  return (
    <Group>
      {/* Main bars */}
      <Path path={barsPath}>
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
