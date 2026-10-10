"use client"

import type React from "react"
import { Group, Circle, useComputedValue, vec, SweepGradient, BlurMask, mix, Paint } from "@shopify/react-native-skia"

interface PulseVisualizationProps {
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

export const PulseVisualization: React.FC<PulseVisualizationProps> = ({
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
  const maxRadius = Math.min(width, height) * 0.45

  // Compute the pulses
  const pulses = useComputedValue(() => {
    const result = []

    // Calculate parameters based on voice data
    const time = animated ? (clock.current / 1000) % 10 : 0
    const amplitudeFactor = mix(isActive.current, 0.2, amplitude.current)
    const frequencyFactor = mix(isActive.current, 1, 1 + frequency.current)
    const energyFactor = mix(isActive.current, 0.5, energy.current)
    const pauseFactor = 1 - pause.current * 0.5

    // Number of pulses based on energy
    const numPulses = Math.floor(mix(isActive.current, 1, 3 + energyFactor * 2))

    for (let i = 0; i < numPulses; i++) {
      // Calculate pulse radius based on time and index
      const baseRadius = maxRadius * ((numPulses - i) / numPulses)
      const pulsePhase = (time + i / numPulses) % 1
      const pulseRadius = baseRadius * pulsePhase * sensitivity

      // Only show pulse if it's visible
      if (pulseRadius > 0 && pulseRadius <= maxRadius) {
        // Calculate opacity based on phase
        const opacity = mix(isActive.current, 0.1, (1 - pulsePhase) * amplitudeFactor * pauseFactor * 0.6)

        result.push({
          radius: pulseRadius,
          opacity,
        })
      }
    }

    return result
  }, [clock, isActive, amplitude, frequency, energy, pause])

  // Compute the center circle radius
  const centerCircleRadius = useComputedValue(() => {
    const time = animated ? (clock.current / 300) % 10 : 0
    const pulseFactor = Math.sin(time) * 0.2 + 0.8
    return maxRadius * 0.2 * mix(isActive.current, 0.5, pulseFactor * amplitude.current * sensitivity)
  }, [clock, isActive, amplitude])

  return (
    <Group>
      {/* Render each pulse */}
      {pulses.current.map((pulse, index) => (
        <Circle key={index} cx={centerX} cy={centerY} r={pulse.radius} opacity={pulse.opacity}>
          <Paint>
            <SweepGradient c={vec(centerX, centerY)} colors={colors} />
            <BlurMask blur={10} style="normal" />
          </Paint>
        </Circle>
      ))}

      {/* Center circle */}
      <Circle cx={centerX} cy={centerY} r={centerCircleRadius}>
        <Paint>
          <SweepGradient c={vec(centerX, centerY)} colors={colors} />
        </Paint>
      </Circle>
    </Group>
  )
}
