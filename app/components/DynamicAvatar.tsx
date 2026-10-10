"use client"

import { IMAGES } from "@/assets/images"
import {
  BlurMask,
  Canvas,
  Circle,
  DisplacementMap,
  Easing,
  Group,
  ImageShader,
  Path,
  Skia,
  SweepGradient,
  Turbulence,
  mix,
  runTiming,
  useClockValue,
  useComputedValue,
  useImage,
  useValue,
  vec,
} from "@shopify/react-native-skia"
import type React from "react"
import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import { useTheme } from "../theme/theme"

interface DynamicAvatarProps {
  uri?: string
  size?: number
  isActive?: boolean
  style?: any
}

export const DynamicAvatar: React.FC<DynamicAvatarProps> = ({
  uri,
  size = 100,
  isActive = false,
  style,
}) => {
  const theme = useTheme()
  const clock = useClockValue()
  const activeValue = useValue(0)

  // Load image
  const image = useImage(uri)

  // Default avatar if no image is provided
  const defaultAvatar = useImage(IMAGES.logo)

  // Update active state
  useEffect(() => {
    runTiming(activeValue, isActive ? 1 : 0, { duration: 300, easing: Easing.inOut(Easing.ease) })
  }, [activeValue, isActive])

  // Compute the border path
  const borderPath = useComputedValue(() => {
    const path = Skia.Path.Make()
    const center = size / 2
    const radius = size / 2

    for (let i = 0; i < 360; i += 1) {
      const angle = (i * Math.PI) / 180
      const time = (clock.current / 1000) % 10

      const radiusOffset = Math.sin(angle * 8 + time) * mix(activeValue.current, 0, 4)
      const x = center + Math.cos(angle) * (radius + radiusOffset)
      const y = center + Math.sin(angle) * (radius + radiusOffset)

      if (i === 0) {
        path.moveTo(x, y)
      } else {
        path.lineTo(x, y)
      }
    }

    path.close()
    return path
  }, [clock, activeValue, size])

  // Compute the displacement amount
  const displacementAmount = useComputedValue(() => {
    return mix(activeValue.current, 0, 5)
  }, [activeValue])

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Canvas style={styles.canvas}>
        {/* Animated border */}
        <Group opacity={mix(activeValue.current, 0.5, 0.8)}>
          <Path path={borderPath}>
            <SweepGradient
              c={vec(size / 2, size / 2)}
              colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            />
            <BlurMask blur={8} style="normal" />
          </Path>
        </Group>

        {/* Avatar image with displacement effect */}
        <Group clip={borderPath} transform={[{ translateX: 2 }, { translateY: 2 }]}>
          {(image || defaultAvatar) && (
            <Group>
              <DisplacementMap channelX="r" channelY="g" scale={displacementAmount}>
                <Turbulence freqX={0.01} freqY={0.01} octaves={2} seed={1} />
                <Circle cx={size / 2 - 2} cy={size / 2 - 2} r={size / 2 - 4}>
                  <ImageShader
                    image={image || defaultAvatar}
                    fit="cover"
                    x={0}
                    y={0}
                    width={size}
                    height={size}
                  />
                </Circle>
              </DisplacementMap>
            </Group>
          )}
        </Group>
      </Canvas>
    </View>
  )
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
})
