import type { Frame } from "react-native-vision-camera"
import type { PoseData, ExerciseForm } from "./types"

import { VisionCameraPoseDetection } from "./vision-camera-pose-detection"
import { MediaPipeManager } from "./media-pipe-manager"
import Config from "../../config"

// Create a singleton instance of the VisionCameraPoseDetection class
const visionCameraPoseDetection = new VisionCameraPoseDetection()

// Create a singleton instance of the MediaPipeManager class
const mediaPipeManager = new MediaPipeManager()

/**
 * VisionCameraPoseDetector service
 *
 * This is the main entry point for pose detection in the app.
 * It provides methods for detecting poses in Vision Camera frames.
 */
class PoseDetectionService {
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  /**
   * Initialize the pose detection service
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      // Initialize both backends
      await visionCameraPoseDetection.initialize({
        modelComplexity: Config.mediaPipe.modelComplexity,
        minPoseDetectionConfidence: Config.mediaPipe.minPoseDetectionConfidence,
        minPoseTrackingConfidence: Config.mediaPipe.minPoseTrackingConfidence,
        minPosePresenceConfidence: Config.mediaPipe.minPosePresenceConfidence,
      })

      await mediaPipeManager.initialize({
        modelComplexity: Config.mediaPipe.modelComplexity,
      })

      this.isInitialized = true
      return true
    } catch (error) {
      console.error("[PoseDetectionService] Failed to initialize:", error)
      return false
    }
  }

  /**
   * Detect poses in a VisionCamera frame
   */
  public async detectPosesInFrame(frame: Frame): Promise<PoseData | null> {
    if (!this.isInitialized) {
      try {
        const success = await this.initialize()
        if (!success) return null
      } catch (error) {
        console.error("[PoseDetectionService] Failed to initialize on-demand:", error)
        return null
      }
    }

    // Use the Vision Camera frame processor
    try {
      return await visionCameraPoseDetection.detectInFrame(frame)
    } catch (error) {
      console.error("[PoseDetectionService] Failed to detect poses in frame:", error)
      return null
    }
  }

  /**
   * Get / create exercise forms
   */
  public async getExerciseForm(exerciseId: string): Promise<ExerciseForm | null> {
    return mediaPipeManager.getExerciseForm(exerciseId)
  }

  /**
   * Save an exercise form
   */
  public async saveExerciseForm(form: ExerciseForm): Promise<void> {
    return mediaPipeManager.saveExerciseForm(form)
  }

  /**
   * Compare a pose with an exercise form
   */
  public comparePoseWithForm(
    pose: PoseData,
    exerciseId: string,
  ): {
    score: number
    feedback: string[]
    incorrectKeypoints: string[]
    incorrectAngles: string[]
  } {
    return mediaPipeManager.comparePoseWithForm(pose, exerciseId)
  }

  /**
   * Detect exercise repetition
   */
  public detectRepetition(
    currentPose: PoseData,
    previousPoses: PoseData[],
    exerciseType: string,
  ): { isRepCompleted: boolean; repQuality: number } {
    return mediaPipeManager.detectRepetition(currentPose, previousPoses, exerciseType)
  }

  /**
   * Calculate calories burned
   */
  public calculateCaloriesBurned(
    exerciseType: string,
    duration: number,
    userWeight: number,
    intensity: number,
  ): number {
    return mediaPipeManager.calculateCaloriesBurned(exerciseType, duration, userWeight, intensity)
  }
}

// Export a singleton instance
export const poseDetection = new PoseDetectionService()
