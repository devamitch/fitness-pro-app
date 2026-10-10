export interface PoseKeypoint {
  name: string
  x: number
  y: number
  z: number
  score: number
  position?: { x: number; y: number; z: number } // For compatibility with some APIs
}

export interface PoseData {
  score: number
  keypoints: PoseKeypoint[]
  timestamp: number
  formCorrections?: string[]
  isRepCompleted?: boolean
}

export interface ExerciseFormKeypoint {
  name: string
  importance: number // 1-10 scale of importance
  position: { x: number; y: number; z: number }
}

export interface ExerciseFormAngle {
  name: string
  joints: [string, string, string] // Three joints that form an angle
  targetAngle: number
  tolerance: number
  importance: number // 1-10 scale of importance
}

export interface ExerciseForm {
  exerciseId: string
  name: string
  keypoints: ExerciseFormKeypoint[]
  angles: ExerciseFormAngle[]
}

export interface PoseDetectionFrame {
  width: number
  height: number
  orientation: "portrait" | "landscape"
  timestamp: number
  pixelFormat: string
  pixelDensity: number
  data: Uint8Array
}

export interface VisionCameraFrameInfo {
  width: number
  height: number
  bytesPerRow: number
  orientation: "portrait" | "landscape"
  timestamp: number
}

export interface KeypointPair {
  from: string
  to: string
}

export type ModelType = "posenet" | "movenet" | "blazepose" | "custom"

export interface ModelConfig {
  type: ModelType
  modelJson?: string
  modelWeights?: string[]
  inputShape?: [number, number]
  inputTensorName?: string
  outputTensorName?: string
  scoreThreshold?: number
}

export interface TensorFlowPoseKeypoint {
  name: string
  x: number
  y: number
  score: number
}

export interface TensorFlowPoseData {
  score: number
  keypoints: TensorFlowPoseKeypoint[]
  timestamp: number
}
