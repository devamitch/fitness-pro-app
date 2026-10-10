"use client"

import type React from "react"
import {
  Group,
  Circle,
  useComputedValue,
  vec,
  SweepGradient,
  BlurMask,
  mix,
  Paint,
  Path,
  Skia,
} from "@shopify/react-native-skia"

interface CircleVisualizationProps {
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

export const CircleVisualization: React.FC<CircleVisualizationProps> = ({
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
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.min(width, height) * 0.4

  // Compute the circle path with deformations
  const circlePath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const numPoints = 180
    const angleIncrement = (2 * Math.PI) / numPoints

    // Calculate parameters based on voice data
    const time = animated ? (clock.current / 1000) % 10 : 0
    const amplitudeFactor = mix(isActive.current, 0.2, amplitude.current)
    const frequencyFactor = mix(isActive.current, 1, 1 + frequency.current * 2)
    const energyFactor = mix(isActive.current, 1, 1 + energy.current)
    const pauseFactor = 1 - pause.current * 0.5

    const baseRadius = maxRadius * mix(isActive.current, 0.6, 0.8) * energyFactor

    for (let i = 0; i <= numPoints; i++) {
      const angle = i * angleIncrement

      // Calculate radius with deformations
      const deformation =
        Math.sin(angle * 3 * frequencyFactor + time * 2) * maxRadius * 0.1 * amplitudeFactor * pauseFactor +
        Math.sin(angle * 7 * frequencyFactor + time) * maxRadius * 0.05 * amplitudeFactor * pauseFactor

      const radius = baseRadius + deformation

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
  }, [clock, isActive, amplitude, frequency, energy, pause])

  // Compute the outer glow
  const glowPath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const numPoints = 180
    const angleIncrement = (2 * Math.PI) / numPoints

    const time = animated ? (clock.current / 1000) % 10 : 0
    const amplitudeFactor = mix(isActive.current, 0.2, amplitude.current)
    const frequencyFactor = mix(isActive.current, 1, 1 + frequency.current * 2)
    const energyFactor = mix(isActive.current, 1, 1 + energy.current)
    const pauseFactor = 1 - pause.current * 0.5

    const baseRadius = maxRadius * mix(isActive.current, 0.7, 0.9) * energyFactor

    for (let i = 0; i <= numPoints; i++) {
      const angle = i * angleIncrement

      const deformation =
        Math.sin(angle * 3 * frequencyFactor + time * 2) * maxRadius * 0.15 * amplitudeFactor * pauseFactor +
        Math.sin(angle * 7 * frequencyFactor + time) * maxRadius * 0.08 * amplitudeFactor * pauseFactor

      const radius = baseRadius + deformation

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
  }, [clock, isActive, amplitude, frequency, energy, pause])

  // Compute the pulse radius
  const pulseRadius = useComputedValue(() => {
    const time = animated ? (clock.current / 300) % 10 : 0
    const pulseFactor = Math.sin(time) * 0.2 + 0.8
    return maxRadius * mix(isActive.current, 0.3, pulseFactor * amplitude.current)
  }, [clock, isActive, amplitude])

  return (
    <Group>
      {/* Background pulse */}
      {showBackground && (
        <Circle cx={centerX} cy={centerY} r={pulseRadius} opacity={mix(isActive, 0.1, 0.3)}>
          <Paint>
            <SweepGradient c={vec(centerX, centerY)} colors={[colors[0], colors.length > 1 ? colors[1] : colors[0]]} />
            <BlurMask blur={15} style="normal" />
          </Paint>
        </Circle>
      )}

      {/* Glow effect */}
      {showBackground && (
        <Group opacity={mix(isActive, 0.1, 0.4)}>
          <Path path={glowPath}>
            <Paint>
              <SweepGradient c={vec(centerX, centerY)} colors={colors} />
              <BlurMask blur={10} style="normal" />
            </Paint>
          </Path>
        </Group>
      )}

      {/* Main circle */}
      <Path path={circlePath}>
        <Paint>
          <SweepGradient c={vec(centerX, centerY)} colors={colors} />
        </Paint>
      </Path>
    </Group>
  )
}
