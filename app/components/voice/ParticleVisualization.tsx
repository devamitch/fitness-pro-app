"use client"

import type React from "react"
import { Group, Circle, useComputedValue, vec, mix, Paint, SweepGradient, BlurMask } from "@shopify/react-native-skia"

interface ParticleVisualizationProps {
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

export const ParticleVisualization: React.FC<ParticleVisualizationProps> = ({
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

  // Compute the particles
  const particles = useComputedValue(() => {
    const result = []
    const maxRadius = Math.min(width, height) * 0.45

    // Calculate parameters based on voice data
    const time = animated ? (clock.current / 1000) % 10 : 0
    const amplitudeFactor = mix(isActive.current, 0.2, amplitude.current)
    const frequencyFactor = mix(isActive.current, 1, 1 + frequency.current)
    const energyFactor = mix(isActive.current, 0.5, energy.current)
    const pauseFactor = 1 - pause.current * 0.5

    // Number of particles based on energy and amplitude
    const numParticles = Math.floor(mix(isActive.current, 5, 20 + amplitudeFactor * 30))

    for (let i = 0; i < numParticles; i++) {
      // Calculate particle position
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * maxRadius * mix(isActive.current, 0.3, 0.9) * energyFactor

      const x = centerX + Math.cos(angle) * distance
      const y = centerY + Math.sin(angle) * distance

      // Calculate particle size
      const baseSize = Math.min(width, height) * 0.02 * sensitivity
      const sizeVariation = Math.random() * baseSize * 0.5
      const size = (baseSize - sizeVariation) * amplitudeFactor * pauseFactor

      // Calculate particle opacity
      const baseOpacity = mix(isActive.current, 0.1, 0.7)
      const opacityVariation = Math.random() * 0.3
      const opacity = (baseOpacity - opacityVariation) * pauseFactor

      // Only add visible particles
      if (size > 0.5 && opacity > 0.05) {
        result.push({
          x,
          y,
          radius: size,
          opacity,
        })
      }
    }

    return result
  }, [clock, isActive, amplitude, frequency, energy, pause])

  // Compute the center glow
  const centerGlowRadius = useComputedValue(() => {
    const time = animated ? (clock.current / 500) % 10 : 0
    const pulseFactor = Math.sin(time) * 0.3 + 0.7
    return Math.min(width, height) * 0.2 * mix(isActive.current, 0.3, pulseFactor * amplitude.current * energy.current)
  }, [clock, isActive, amplitude, energy])

  return (
    <Group>
      {/* Center glow */}
      {showBackground && (
        <Circle cx={centerX} cy={centerY} r={centerGlowRadius} opacity={mix(isActive, 0.1, 0.4)}>
          <Paint>
            <SweepGradient c={vec(centerX, centerY)} colors={colors} />
            <BlurMask blur={15} style="normal" />
          </Paint>
        </Circle>
      )}

      {/* Particles */}
      {particles.current.map((particle, index) => (
        <Circle key={index} cx={particle.x} cy={particle.y} r={particle.radius} opacity={particle.opacity}>
          <Paint>
            <SweepGradient c={vec(centerX, centerY)} colors={colors} />
            <BlurMask blur={5} style="normal" />
          </Paint>
        </Circle>
      ))}
    </Group>
  )
}
