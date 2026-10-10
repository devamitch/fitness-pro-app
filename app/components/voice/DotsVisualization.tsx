"use client"

import type React from "react"
import { Group, Circle, useComputedValue, vec, mix, Paint, SweepGradient } from "@shopify/react-native-skia"

interface DotsVisualizationProps {
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

export const DotsVisualization: React.FC<DotsVisualizationProps> = ({
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
  // Compute the dots
  const dots = useComputedValue(() => {
    const result = []
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.4

    // Calculate parameters based on voice data
    const time = animated ? (clock.current / 1000) % 10 : 0
    const amplitudeFactor = mix(isActive.current, 0.2, amplitude.current)
    const frequencyFactor = mix(isActive.current, 1, 1 + frequency.current)
    const energyFactor = mix(isActive.current, 0.5, energy.current)
    const pauseFactor = 1 - pause.current * 0.5

    // Number of dots based on energy and frequency
    const numDots = Math.floor(mix(isActive.current, 5, 12 + frequency.current * 8))

    // Number of rings
    const numRings = Math.floor(mix(isActive.current, 1, 3 + amplitudeFactor * 2))

    for (let ring = 0; ring < numRings; ring++) {
      const ringRadius = maxRadius * ((ring + 1) / numRings) * mix(isActive.current, 0.5, 0.9)

      for (let i = 0; i < numDots; i++) {
        const angle = (i / numDots) * Math.PI * 2 + time * (ring % 2 === 0 ? 1 : -1)

        // Calculate position with some variation
        const radiusVariation = Math.sin(i * 0.5 + time * 2) * maxRadius * 0.1 * amplitudeFactor * pauseFactor
        const radius = ringRadius + radiusVariation

        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius

        // Calculate dot size based on position and energy
        const baseDotSize = Math.min(width, height) * 0.03
        const dotSizeVariation = Math.sin(i * 0.7 + time * 3) * baseDotSize * 0.5
        const dotSize = (baseDotSize + dotSizeVariation) * sensitivity * energyFactor

        result.push({
          x,
          y,
          radius: Math.max(1, dotSize),
        })
      }
    }

    return result
  }, [clock, isActive, amplitude, frequency, energy, pause])

  return (
    <Group>
      {/* Render each dot */}
      {dots.current.map((dot, index) => (
        <Circle key={index} cx={dot.x} cy={dot.y} r={dot.radius}>
          <Paint>
            <SweepGradient c={vec(width / 2, height / 2)} colors={colors} />
          </Paint>
        </Circle>
      ))}
    </Group>
  )
}
