// Common types for pose detection
export interface PoseKeypoint {
  x: number
  y: number
  z: number
  score: number
  name: string
}

export interface PoseData {
  score: number
  keypoints: PoseKeypoint[]
  timestamp: number
  isRepCompleted?: boolean
  repQuality?: number
  formCorrections?: string[]
}

// Exercise form data
export interface ExerciseForm {
  exerciseId: string
  name: string
  keypoints: Array<{
    name: string
    importance: number // 1-10 scale of importance
    position: { x: number; y: number; z: number }
  }>
  angles: Array<{
    name: string
    joints: [string, string, string] // Three joints that form an angle
    targetAngle: number
    tolerance: number
    importance: number // 1-10 scale of importance
  }>
}

// TensorFlow specific types
export interface TensorFlowPoseKeypoint {
  x: number
  y: number
  z: number
  score: number
  name: string
}

export interface TensorFlowPoseData {
  score: number
  keypoints: TensorFlowPoseKeypoint[]
  timestamp: number
}

export type ModelType = "posenet" | "movenet" | "blazepose" | "custom"

export interface ModelConfig {
  type: ModelType
  modelJson?: string
  modelWeights?: string[]
  inputShape?: number[]
  outputShape?: number[]
  inputTensorName?: string
  outputTensorName?: string
  scoreThreshold?: number
  maxPoses?: number
}
