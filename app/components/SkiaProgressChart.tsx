"use client"

import { customFontsToLoad } from "@/theme"
import {
  Canvas,
  Group,
  LinearGradient,
  Path,
  Skia,
  Text,
  runTiming,
  useComputedValue,
  useFont,
  useValue,
  vec,
} from "@shopify/react-native-skia"
import { curveBasis, line } from "d3-shape"
import React from "react"
import { Dimensions, StyleSheet, View } from "react-native"
import { useTheme } from "../theme/theme"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

interface ProgressChartProps {
  data: number[]
  height?: number
  width?: number
  strokeWidth?: number
  animated?: boolean
  showLabels?: boolean
  showGrid?: boolean
  fillGradient?: boolean
  title?: string
}

export const SkiaProgressChart: React.FC<ProgressChartProps> = ({
  data,
  height = 200,
  width = SCREEN_WIDTH - 40,
  strokeWidth = 3,
  animated = true,
  showLabels = true,
  showGrid = true,
  fillGradient = true,
  title,
}) => {
  const theme = useTheme()
  const font = useFont(customFontsToLoad.interMedium)
  const titleFont = useFont(customFontsToLoad.interBold)

  const progress = useValue(0)

  React.useEffect(() => {
    if (animated) {
      runTiming(progress, 1, { duration: 1500 })
    } else {
      progress.current = 1
    }
  }, [animated, data])

  const createPath = (dataPoints: number[]) => {
    const maxValue = Math.max(...dataPoints, 0)
    const minValue = Math.min(...dataPoints, 0)
    const range = maxValue - minValue

    const xGetter = (_: number, i: number) => i * (width / (dataPoints.length - 1))
    const yGetter = (d: number) => height - ((d - minValue) / range) * height * 0.8 - height * 0.1

    const lineGenerator = line().x(xGetter).y(yGetter).curve(curveBasis)

    return lineGenerator(dataPoints as any)
  }

  const path = createPath(data)
  const skPath = Skia.Path.MakeFromSVGString(path || "")

  const animatedPath = useComputedValue(() => {
    if (!skPath) return ""

    const length = skPath.getLength()
    const end = length * progress.current

    return skPath.copy().trim(0, end, false).toSVGString() || ""
  }, [progress, skPath])

  const fillPath = useComputedValue(() => {
    if (!skPath) return ""

    const filledPath = Skia.Path.MakeFromSVGString(skPath.toSVGString() || "")
    if (!filledPath) return ""

    filledPath.lineTo(width, height)
    filledPath.lineTo(0, height)
    filledPath.close()

    return filledPath
  }, [skPath])

  const animatedFillPath = useComputedValue(() => {
    if (!skPath) return ""

    const length = skPath.getLength()
    const end = length * progress.current
    const trimmedPath = skPath.copy().trim(0, end, false)

    const filledPath = Skia.Path.MakeFromSVGString(trimmedPath.toSVGString() || "")
    if (!filledPath) return ""

    filledPath.lineTo(width * progress.current, height)
    filledPath.lineTo(0, height)
    filledPath.close()

    return filledPath
  }, [progress, skPath])

  // Generate grid lines
  const gridLines = []
  if (showGrid) {
    const numLines = 5
    for (let i = 1; i < numLines; i++) {
      const y = (height / numLines) * i
      gridLines.push(
        <Path
          key={`h-${i}`}
          path={`M 0 ${y} H ${width}`}
          color={theme.dark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
          style="stroke"
          strokeWidth={1}
        />,
      )
    }
  }

  // Generate labels
  const labels = []
  if (showLabels && font) {
    const numLabels = Math.min(data.length, 7) // Limit to 7 labels to avoid crowding
    const step = Math.ceil(data.length / numLabels)

    for (let i = 0; i < data.length; i += step) {
      const x = i * (width / (data.length - 1))
      labels.push(
        <Text
          key={`label-${i}`}
          font={font}
          text={`${i + 1}`}
          x={x}
          y={height - 5}
          color={theme.colors.text.tertiary}
          opacity={0.7}
          origin={vec(x, height - 5)}
          textAlign="center"
        />,
      )
    }
  }

  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>
        {/* Grid lines */}
        <Group>{gridLines}</Group>

        {/* Fill gradient */}
        {fillGradient && (
          <Group>
            <Path path={animated ? animatedFillPath : fillPath} color="transparent">
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, height)}
                colors={[
                  theme.dark ? "rgba(10, 132, 255, 0.3)" : "rgba(10, 132, 255, 0.2)",
                  theme.dark ? "rgba(10, 132, 255, 0.05)" : "rgba(10, 132, 255, 0.05)",
                ]}
              />
            </Path>
          </Group>
        )}

        {/* Line */}
        <Path
          path={animated ? animatedPath : path || ""}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeJoin="round"
          strokeCap="round"
          color={theme.colors.primary}
        />

        {/* Labels */}
        <Group>{labels}</Group>

        {/* Title */}
        {title && titleFont && (
          <Text
            font={titleFont}
            text={title}
            x={width / 2}
            y={20}
            color={theme.colors.text.primary}
            opacity={0.9}
            origin={vec(width / 2, 20)}
            textAlign="center"
          />
        )}
      </Canvas>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
  },
})
