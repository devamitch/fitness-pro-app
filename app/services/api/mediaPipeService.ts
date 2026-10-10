import apiClient from "./client"
import { Platform } from "react-native"
import * as FileSystem from "expo-file-system"

// Types
export interface PoseDetectionResult {
  keypoints: Array<{
    name: string
    x: number
    y: number
    z?: number
    score: number
  }>
  score: number
  bbox?: {
    xMin: number
    yMin: number
    width: number
    height: number
  }
}

export interface ExerciseAnalysisResult {
  score: number
  feedback: string[]
  isCorrectForm: boolean
  keypoints: PoseDetectionResult["keypoints"]
  repDetected: boolean
}

// MediaPipe Service
export const mediaPipeService = {
  // Analyze pose from image data
  analyzePose: async (
    imageBase64: string,
    modelType: "MoveNet" | "BlazePose" | "PoseNet" = "BlazePose",
  ): Promise<PoseDetectionResult> => {
    const response = await apiClient.post("/mediapipe/analyze-pose", {
      image: imageBase64,
      modelType,
      platform: Platform.OS,
    })
    return response.data
  },

  // Analyze exercise form
  analyzeExerciseForm: async (
    imageBase64: string,
    exerciseId: string,
    previousPoses?: PoseDetectionResult[],
  ): Promise<ExerciseAnalysisResult> => {
    const response = await apiClient.post("/mediapipe/analyze-exercise", {
      image: imageBase64,
      exerciseId,
      previousPoses: previousPoses || [],
      platform: Platform.OS,
    })
    return response.data
  },

  // Process video for exercise analysis
  processExerciseVideo: async (
    videoUri: string,
    exerciseId: string,
  ): Promise<{
    averageScore: number
    feedback: string[]
    repCount: number
    keyframes: Array<{
      timestamp: number
      score: number
      feedback: string[]
      imageUri: string
    }>
  }> => {
    // First upload the video
    const fileInfo = await FileSystem.getInfoAsync(videoUri)

    if (!fileInfo.exists) {
      throw new Error("Video file does not exist")
    }

    // Create form data for upload
    const formData = new FormData()
    formData.append("video", {
      uri: videoUri,
      name: "exercise.mp4",
      type: "video/mp4",
    } as any)
    formData.append("exerciseId", exerciseId)

    const response = await apiClient.post("/mediapipe/process-exercise-video", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  },

  // Get reference poses for an exercise
  getReferencePoses: async (
    exerciseId: string,
  ): Promise<
    Array<{
      id: string
      exerciseId: string
      name: string
      keypoints: Array<{
        name: string
        x: number
        y: number
        z?: number
        importance: number
      }>
      angles: Array<{
        name: string
        joints: [string, string, string]
        targetAngle: number
        tolerance: number
        importance: number
      }>
      imageUri: string
      phase: string
      order: number
    }>
  > => {
    const response = await apiClient.get(`/mediapipe/reference-poses/${exerciseId}`)
    return response.data
  },
}
