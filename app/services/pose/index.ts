import { Platform } from "react-native"
import { mediaPipeAndroid } from "./mediaPipe.android"
import { mediaPipeIOS } from "./mediaPipe.ios"
import { tensorflowMedia } from "./tensorflowMedia"

// Export the appropriate implementation based on platform
export const mediaPipe = Platform.OS === "ios" ? mediaPipeIOS : mediaPipeAndroid

// Export TensorFlow implementation as an alternative
export { tensorflowMedia }

// Export common types
export type {
  PoseKeypoint,
  PoseData,
  ExerciseForm,
  ModelConfig,
  ModelType,
  TensorFlowPoseData,
  TensorFlowPoseKeypoint,
} from "./types"

// Export utility functions
export {
  calculateAngle,
  calculateDistance,
  calculatePoseSimilarity,
  normalizeKeypoints,
  filterKeypoints,
} from "./utils"
