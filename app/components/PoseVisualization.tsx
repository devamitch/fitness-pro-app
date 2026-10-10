"use client"

import { memo, useMemo } from "react"
import { StyleSheet, type ViewStyle } from "react-native"
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated"
import Svg, { Circle, Line, G } from "react-native-svg"
import { getKeypointConnections } from "../services/pose-detection/utils"
import type { PoseData } from "../services/pose-detection/types"
import { useTheme } from "../theme"

interface PoseVisualizationProps {
  pose: PoseData
  opacity?: SharedValue<number>
  style?: ViewStyle
  width?: number
  height?: number
  keypointSize?: number
  lineWidth?: number
  showNames?: boolean
}

/**
 * PoseVisualization - A component to visualize detected poses
 */
export const PoseVisualization = memo(
  ({
    pose,
    opacity,
    style,
    width = 400,
    height = 600,
    keypointSize = 6,
    lineWidth = 3,
    showNames = false,
  }: PoseVisualizationProps) => {
    // Get theme colors
    const theme = useTheme()

    // Calculate connections and colors
    const connections = useMemo(() => getKeypointConnections(), [])

    // Define keypoint colors by body part
    const keypointColors = useMemo(() => {
      return {
        face: theme.colors.primary, // Face keypoints
        torso: theme.colors.secondary, // Torso keypoints
        arms: theme.colors.accent, // Arm keypoints
        legs: theme.colors.info, // Leg keypoints
        default: theme.colors.white, // Default color
      }
    }, [theme])

    // Get keypoint color by name
    const getKeypointColor = (name: string) => {
      if (name.includes("eye") || name.includes("ear") || name.includes("nose") || name.includes("mouth")) {
        return keypointColors.face
      } else if (name.includes("shoulder") || name.includes("hip")) {
        return keypointColors.torso
      } else if (name.includes("elbow") || name.includes("wrist") || name.includes("hand")) {
        return keypointColors.arms
      } else if (name.includes("knee") || name.includes("ankle") || name.includes("foot")) {
        return keypointColors.legs
      }

      return keypointColors.default
    }

    // Animated style for opacity
    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity?.value ?? 1,
      }
    }, [opacity])

    return (
      <Animated.View style={[styles.container, style, animatedStyle]}>
        <Svg width="100%" height="100%" viewBox={`0 0 1 1`}>
          <G>
            {/* Draw connections */}
            {connections.map(([fromName, toName], index) => {
              const fromKeypoint = pose.keypoints.find((kp) => kp.name === fromName)
              const toKeypoint = pose.keypoints.find((kp) => kp.name === toName)

              if (!fromKeypoint || !toKeypoint || fromKeypoint.score < 0.5 || toKeypoint.score < 0.5) {
                return null
              }

              const color = getKeypointColor(fromName)
              const opacity = (fromKeypoint.score + toKeypoint.score) / 2

              return (
                <Line
                  key={`${fromName}-${toName}-${index}`}
                  x1={fromKeypoint.x}
                  y1={fromKeypoint.y}
                  x2={toKeypoint.x}
                  y2={toKeypoint.y}
                  stroke={color}
                  strokeWidth={lineWidth / Math.max(width, height)}
                  strokeOpacity={opacity}
                />
              )
            })}

            {/* Draw keypoints */}
            {pose.keypoints.map((keypoint, index) => {
              if (keypoint.score < 0.5) return null

              const color = getKeypointColor(keypoint.name)

              return (
                <Circle
                  key={`${keypoint.name}-${index}`}
                  cx={keypoint.x}
                  cy={keypoint.y}
                  r={keypointSize / Math.max(width, height)}
                  fill={color}
                  fillOpacity={keypoint.score}
                />
              )
            })}
          </G>
        </Svg>
      </Animated.View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
})
