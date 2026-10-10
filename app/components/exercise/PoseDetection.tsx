"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { View, StyleSheet, type ViewStyle } from "react-native"
import { Canvas, Path, useValue, runTiming, Skia, useComputedValue, Group } from "@shopify/react-native-skia"
import { useTheme } from "@/hooks/useTheme"
import { mediaPipe, type PoseKeypoint } from "@/services/mediaPipe"
import { aiCoach } from "@/services/aiCoach"

interface PoseDetectionProps {
  style?: ViewStyle
}

const PoseDetection: React.FC<PoseDetectionProps> = ({ style }) => {
  const { theme } = useTheme()
  const canvasRef = useRef<View>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Skia values for animation
  const opacity = useValue(0.8)
  const lineWidth = useValue(3)
  const pointRadius = useValue(6)

  // Keypoints and connections
  const [keypoints, setKeypoints] = useState<PoseKeypoint[]>([])

  // Define connections between keypoints
  const connections = [
    // Face
    ["nose", "left_eye_inner"],
    ["left_eye_inner", "left_eye"],
    ["left_eye", "left_eye_outer"],
    ["left_eye_outer", "left_ear"],
    ["nose", "right_eye_inner"],
    ["right_eye_inner", "right_eye"],
    ["right_eye", "right_eye_outer"],
    ["right_eye_outer", "right_ear"],
    ["mouth_left", "mouth_right"],

    // Upper body
    ["left_shoulder", "right_shoulder"],
    ["left_shoulder", "left_elbow"],
    ["left_elbow", "left_wrist"],
    ["right_shoulder", "right_elbow"],
    ["right_elbow", "right_wrist"],

    // Hands
    ["left_wrist", "left_pinky"],
    ["left_wrist", "left_index"],
    ["left_wrist", "left_thumb"],
    ["right_wrist", "right_pinky"],
    ["right_wrist", "right_index"],
    ["right_wrist", "right_thumb"],

    // Torso
    ["left_shoulder", "left_hip"],
    ["right_shoulder", "right_hip"],
    ["left_hip", "right_hip"],

    // Lower body
    ["left_hip", "left_knee"],
    ["left_knee", "left_ankle"],
    ["right_hip", "right_knee"],
    ["right_knee", "right_ankle"],

    // Feet
    ["left_ankle", "left_heel"],
    ["left_heel", "left_foot_index"],
    ["left_ankle", "left_foot_index"],
    ["right_ankle", "right_heel"],
    ["right_heel", "right_foot_index"],
    ["right_ankle", "right_foot_index"],
  ]

  // Update keypoints from AI Coach
  useEffect(() => {
    const interval = setInterval(() => {
      const isMonitoring = aiCoach.isMonitoring()
      const lastPose = mediaPipe.getCurrentPose()

      if (lastPose && lastPose.keypoints) {
        setKeypoints(lastPose.keypoints)

        // Animate opacity based on monitoring state
        runTiming(opacity, isMonitoring ? 0.9 : 0.6, { duration: 300 })

        // Animate line width
        runTiming(lineWidth, isMonitoring ? 3.5 : 2.5, { duration: 300 })

        // Animate point radius
        runTiming(pointRadius, isMonitoring ? 7 : 5, { duration: 300 })
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Handle canvas layout
  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout
    setCanvasSize({ width, height })
  }

  // Compute paths for connections
  const connectionPaths = useComputedValue(() => {
    if (keypoints.length === 0 || canvasSize.width === 0) return []

    const paths: { path: string; color: string; isActive: boolean }[] = []
    const keypointMap = new Map<string, PoseKeypoint>()

    // Create map for quick lookup
    keypoints.forEach((kp) => {
      keypointMap.set(kp.name, kp)
    })

    // Create paths for each connection
    connections.forEach(([start, end]) => {
      const startPoint = keypointMap.get(start)
      const endPoint = keypointMap.get(end)

      if (startPoint && endPoint && startPoint.score > 0.5 && endPoint.score > 0.5) {
        // Scale coordinates to canvas size
        const x1 = startPoint.x * canvasSize.width
        const y1 = startPoint.y * canvasSize.height
        const x2 = endPoint.x * canvasSize.width
        const y2 = endPoint.y * canvasSize.height

        // Create path
        const path = Skia.Path.Make()
        path.moveTo(x1, y1)
        path.lineTo(x2, y2)

        // Determine color based on body part
        let color = theme.colors.primary

        if (
          start.includes("shoulder") ||
          end.includes("shoulder") ||
          start.includes("elbow") ||
          end.includes("elbow") ||
          start.includes("wrist") ||
          end.includes("wrist")
        ) {
          color = "#4CAF50" // Green for arms
        } else if (
          start.includes("hip") ||
          end.includes("hip") ||
          start.includes("knee") ||
          end.includes("knee") ||
          start.includes("ankle") ||
          end.includes("ankle")
        ) {
          color = "#2196F3" // Blue for legs
        } else if (
          start.includes("eye") ||
          end.includes("eye") ||
          start.includes("ear") ||
          end.includes("ear") ||
          start.includes("nose") ||
          end.includes("mouth")
        ) {
          color = "#FFC107" // Yellow for face
        }

        paths.push({
          path: path.toSVGString(),
          color,
          isActive: startPoint.score > 0.7 && endPoint.score > 0.7,
        })
      }
    })

    return paths
  }, [keypoints, canvasSize, theme])

  // Compute keypoint circles
  const keypointCircles = useComputedValue(() => {
    if (keypoints.length === 0 || canvasSize.width === 0) return []

    return keypoints
      .filter((kp) => kp.score > 0.5)
      .map((kp) => {
        const x = kp.x * canvasSize.width
        const y = kp.y * canvasSize.height

        // Determine color based on body part
        let color = theme.colors.primary

        if (kp.name.includes("shoulder") || kp.name.includes("elbow") || kp.name.includes("wrist")) {
          color = "#4CAF50" // Green for arms
        } else if (kp.name.includes("hip") || kp.name.includes("knee") || kp.name.includes("ankle")) {
          color = "#2196F3" // Blue for legs
        } else if (
          kp.name.includes("eye") ||
          kp.name.includes("ear") ||
          kp.name.includes("nose") ||
          kp.name.includes("mouth")
        ) {
          color = "#FFC107" // Yellow for face
        }

        return {
          cx: x,
          cy: y,
          r: pointRadius.current * (kp.score > 0.7 ? 1.2 : 1),
          color,
          isActive: kp.score > 0.7,
        }
      })
  }, [keypoints, canvasSize, pointRadius, theme])

  return (
    <View style={[styles.container, style]} onLayout={handleLayout} ref={canvasRef}>
      <Canvas style={styles.canvas}>
        <Group opacity={opacity}>
          {/* Draw connections */}
          {connectionPaths.current.map((conn, index) => (
            <Path
              key={`conn-${index}`}
              path={conn.path}
              color={conn.color}
              style="stroke"
              strokeWidth={lineWidth.current * (conn.isActive ? 1.2 : 0.8)}
              strokeJoin="round"
              strokeCap="round"
              opacity={conn.isActive ? 0.9 : 0.6}
            />
          ))}

          {/* Draw keypoints */}
          {keypointCircles.current.map((circle, index) => (
            <Path
              key={`kp-${index}`}
              path={`M ${circle.cx - circle.r} ${circle.cy} a ${circle.r} ${circle.r} 0 1 0 ${circle.r * 2} 0 a ${circle.r} ${circle.r} 0 1 0 ${-circle.r * 2} 0`}
              color={circle.color}
              style="fill"
              opacity={circle.isActive ? 0.9 : 0.6}
            />
          ))}
        </Group>
      </Canvas>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
})

export default PoseDetection
