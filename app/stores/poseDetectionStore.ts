import supabase from "@/services/supabase"
import * as poseDetection from "@tensorflow-models/pose-detection"
import * as tf from "@tensorflow/tfjs"
import { cameraWithTensors } from "@tensorflow/tfjs-react-native"
import { Camera } from "react-native-vision-camera"
// import { Camera } from "expo-camera"
import { create } from "zustand"

// Export TensorCamera for use in components
export const TensorCamera = cameraWithTensors(Camera)

// Define pose detection models
export enum PoseDetectionModel {
  MoveNet = "MoveNet",
  BlazePose = "BlazePose",
  PoseNet = "PoseNet",
}

// Define store state
interface PoseDetectionState {
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  detector: poseDetection.PoseDetector | null
  model: PoseDetectionModel
  targetPoses: Record<string, poseDetection.Pose[]>
  currentPose: poseDetection.Pose | null

  // Configuration
  minPoseScore: number
  enableSmoothing: boolean

  // Methods
  initialize: (config: {
    model: PoseDetectionModel
    enableSmoothing?: boolean
    minPoseScore?: number
  }) => Promise<boolean>

  detectPose: (image: tf.Tensor3D, flipHorizontal?: boolean) => Promise<poseDetection.Pose | null>

  comparePoses: (detectedPose: poseDetection.Pose, targetPose: poseDetection.Pose) => number

  loadTargetPoses: (exerciseId: string) => Promise<poseDetection.Pose[]>

  saveTargetPose: (exerciseId: string, pose: poseDetection.Pose) => Promise<boolean>
}

export const usePoseDetectionStore = create<PoseDetectionState>((set, get) => ({
  isInitialized: false,
  isLoading: false,
  error: null,
  detector: null,
  model: PoseDetectionModel.MoveNet,
  targetPoses: {},
  currentPose: null,

  // Default configuration
  minPoseScore: 0.25,
  enableSmoothing: true,

  initialize: async (config) => {
    set({
      isLoading: true,
      error: null,
      model: config.model,
      minPoseScore: config.minPoseScore || 0.25,
      enableSmoothing: config.enableSmoothing !== undefined ? config.enableSmoothing : true,
    })

    try {
      // Initialize TensorFlow.js
      await tf.ready()
      console.log("TensorFlow.js ready")

      // Create detector based on selected model
      let detector

      switch (config.model) {
        case PoseDetectionModel.MoveNet:
          detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableSmoothing: config.enableSmoothing,
          })
          break

        case PoseDetectionModel.BlazePose:
          detector = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
            runtime: "tfjs",
            enableSmoothing: config.enableSmoothing,
            modelType: "lite",
          })
          break

        case PoseDetectionModel.PoseNet:
          detector = await poseDetection.createDetector(poseDetection.SupportedModels.PoseNet, {
            quantBytes: 2,
            architecture: "MobileNetV1",
            outputStride: 16,
            inputResolution: { width: 257, height: 257 },
            multiplier: 0.75,
          })
          break

        default:
          throw new Error(`Unsupported model: ${config.model}`)
      }

      set({
        detector,
        isInitialized: true,
        isLoading: false,
      })

      return true
    } catch (error) {
      set({
        error: `Failed to initialize pose detection: ${(error as Error)?.message}`,
        isLoading: false,
      })

      return false
    }
  },

  detectPose: async (image, flipHorizontal = false) => {
    const { detector, minPoseScore } = get()

    if (!detector) {
      console.error("Detector not initialized")
      return null
    }

    try {
      const poses = await detector.estimatePoses(image, {
        flipHorizontal,
      })

      // Get the pose with the highest score
      const pose = poses[0]

      if (pose && pose.score && pose.score >= minPoseScore) {
        set({ currentPose: pose })
        return pose
      }

      return null
    } catch (error) {
      console.error("Error detecting pose:", error)
      return null
    }
  },

  comparePoses: (detectedPose, targetPose) => {
    if (!detectedPose.keypoints || !targetPose.keypoints) return 0

    let totalScore = 0
    let totalKeypoints = 0

    // Compare each keypoint
    for (const targetKeypoint of targetPose.keypoints) {
      const detectedKeypoint = detectedPose.keypoints.find((kp) => kp.name === targetKeypoint.name)

      if (
        detectedKeypoint &&
        targetKeypoint.score &&
        detectedKeypoint.score &&
        targetKeypoint.score > 0.5 &&
        detectedKeypoint.score > 0.5
      ) {
        // Calculate distance between points (normalized to 0-1)
        const distance =
          Math.sqrt(
            Math.pow(detectedKeypoint.x - targetKeypoint.x, 2) +
              Math.pow(detectedKeypoint.y - targetKeypoint.y, 2),
          ) / Math.sqrt(2) // Normalize by diagonal

        // Convert distance to similarity (1 - distance)
        const similarity = Math.max(0, 1 - distance)

        // Weight by confidence scores
        const weightedSimilarity = similarity * targetKeypoint.score * detectedKeypoint.score

        totalScore += weightedSimilarity
        totalKeypoints += 1
      }
    }

    // Return average similarity
    return totalKeypoints > 0 ? totalScore / totalKeypoints : 0
  },

  loadTargetPoses: async (exerciseId) => {
    try {
      // Check if we already have the target poses in memory
      const { targetPoses } = get()
      if (targetPoses[exerciseId]) {
        return targetPoses[exerciseId]
      }

      // Fetch target poses from Supabase
      const { data, error } = await supabase
        .from("exercise_target_poses")
        .select("*")
        .eq("exercise_id", exerciseId)
        .order("sequence_number", { ascending: true })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        // If no target poses found, return empty array
        set((state) => ({
          targetPoses: {
            ...state.targetPoses,
            [exerciseId]: [],
          },
        }))

        return []
      }

      // Parse the poses from JSON
      const poses = data.map((item) => JSON.parse(item.pose_data))

      // Store in memory
      set((state) => ({
        targetPoses: {
          ...state.targetPoses,
          [exerciseId]: poses,
        },
      }))

      return poses
    } catch (error) {
      console.error("Error loading target poses:", error)
      return []
    }
  },

  saveTargetPose: async (exerciseId, pose) => {
    try {
      // Get the current sequence number
      const { data: existingPoses } = await supabase
        .from("exercise_target_poses")
        .select("sequence_number")
        .eq("exercise_id", exerciseId)
        .order("sequence_number", { ascending: false })
        .limit(1)

      const sequenceNumber =
        existingPoses && existingPoses.length > 0 ? existingPoses[0].sequence_number + 1 : 0

      // Save the pose to Supabase
      const { error } = await supabase.from("exercise_target_poses").insert({
        exercise_id: exerciseId,
        pose_data: JSON.stringify(pose),
        sequence_number: sequenceNumber,
        created_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      }

      // Update the in-memory target poses
      set((state) => {
        const currentPoses = state.targetPoses[exerciseId] || []

        return {
          targetPoses: {
            ...state.targetPoses,
            [exerciseId]: [...currentPoses, pose],
          },
        }
      })

      return true
    } catch (error) {
      console.error("Error saving target pose:", error)
      return false
    }
  },
}))

// Helper function to process camera frames
export const processFrame = async (
  detector: poseDetection.PoseDetector,
  images: IterableIterator<tf.Tensor3D>,
  flipHorizontal = false,
): Promise<poseDetection.Pose | null> => {
  const imageTensor = images.next().value

  if (!imageTensor) {
    return null
  }

  try {
    // Process the image and get pose results
    const poses = await detector.estimatePoses(imageTensor, {
      flipHorizontal,
    })

    // Dispose tensor to prevent memory leak
    tf.dispose(imageTensor)

    return poses[0] || null
  } catch (error) {
    console.error("Error processing frame:", error)

    // Dispose tensor to prevent memory leak
    tf.dispose(imageTensor)

    return null
  }
}
