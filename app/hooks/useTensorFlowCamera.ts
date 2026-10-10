"use client"

import { useEffect, useState } from "react"
import { useFrameProcessor } from "react-native-vision-camera"
import { runOnJS } from "react-native-reanimated"
import { tensorflowMedia } from "@/services/pose"
import type { TensorFlowPoseData, ModelType } from "@/services/pose/types"

interface UseTensorFlowCameraOptions {
  modelType?: ModelType
  skipFrames?: number
  scoreThreshold?: number
  enabled?: boolean
  onInitialized?: () => void
}

export function useTensorFlowCamera(
  onPrediction: (prediction: TensorFlowPoseData) => void,
  options: UseTensorFlowCameraOptions = {},
) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Initialize TensorFlow.js
  useEffect(() => {
    const initialize = async () => {
      try {
        const initialized = await tensorflowMedia.initialize({
          type: options.modelType || "posenet",
          scoreThreshold: options.scoreThreshold || 0.5,
        })

        setIsInitialized(initialized)

        if (initialized && options.onInitialized) {
          options.onInitialized()
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to initialize TensorFlow.js"))
      }
    }

    initialize()

    return () => {
      // Clean up resources
      tensorflowMedia.dispose()
    }
  }, [options.modelType, options.scoreThreshold, options.onInitialized])

  // Create frame processor
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet"
      if (!options.enabled) return

      // Skip frames to improve performance
      const skipFrames = options.skipFrames || 3

      // Process frame with TensorFlow.js
      runOnJS(tensorflowMedia.processFrame.bind(tensorflowMedia))(frame, onPrediction, {
        modelType: options.modelType,
        scoreThreshold: options.scoreThreshold,
      })
    },
    [onPrediction, options.enabled, options.skipFrames, options.modelType, options.scoreThreshold],
  )

  return {
    frameProcessor,
    isInitialized,
    error,
  }
}
