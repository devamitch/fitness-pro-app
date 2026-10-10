import { NativeModules } from "react-native"
import { storage, StorageKeys } from "../../utils/storage"
import type { PoseData, ExerciseForm } from "./types"
import { calculateAngle } from "./utils"

/**
 * MediaPipe Manager
 *
 * This class handles the MediaPipe API to perform pose detection and exercise form analysis.
 */
export class MediaPipeManager {
  private isAvailable = false
  private isInitialized = false
  private exerciseForms: Record<string, ExerciseForm> = {}
  private nativeModule: any = null

  constructor() {
    this.checkAvailability()
    this.loadExerciseForms()
  }

  /**
   * Check if the MediaPipe module is available
   */
  private checkAvailability(): boolean {
    try {
      this.nativeModule = NativeModules.MediaPipeModule
      this.isAvailable = !!this.nativeModule
      return this.isAvailable
    } catch (error) {
      console.error("[MediaPipeManager] MediaPipe module not available:", error)
      this.isAvailable = false
      return false
    }
  }

  /**
   * Load exercise forms from storage
   */
  private loadExerciseForms(): void {
    try {
      const savedForms = storage.get<Record<string, ExerciseForm>>(StorageKeys.EXERCISE_FORMS)
      if (savedForms) {
        this.exerciseForms = savedForms
      }
    } catch (error) {
      console.error("[MediaPipeManager] Failed to load exercise forms:", error)
    }
  }

  /**
   * Save exercise forms to storage
   */
  private saveExerciseForms(): void {
    try {
      storage.set(StorageKeys.EXERCISE_FORMS, this.exerciseForms)
    } catch (error) {
      console.error("[MediaPipeManager] Failed to save exercise forms:", error)
    }
  }

  /**
   * Initialize the MediaPipe module
   */
  public async initialize(options: { modelComplexity?: number } = {}): Promise<boolean> {
    if (!this.isAvailable) {
      console.warn("[MediaPipeManager] MediaPipe is not available on this device")
      return false
    }

    if (this.isInitialized) return true

    try {
      const success = await this.nativeModule.initialize({
        modelComplexity: options.modelComplexity || 1,
        enableSegmentation: false,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      this.isInitialized = success
      return success
    } catch (error) {
      console.error("[MediaPipeManager] Failed to initialize MediaPipe:", error)
      return false
    }
  }

  /**
   * Get an exercise form
   */
  public async getExerciseForm(exerciseId: string): Promise<ExerciseForm | null> {
    return this.exerciseForms[exerciseId] || null
  }

  /**
   * Save an exercise form
   */
  public async saveExerciseForm(form: ExerciseForm): Promise<void> {
    this.exerciseForms[form.exerciseId] = form
    this.saveExerciseForms()
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
    const form = this.exerciseForms[exerciseId]
    if (!form || !pose) {
      return {
        score: 0,
        feedback: ["No reference form available for this exercise"],
        incorrectKeypoints: [],
        incorrectAngles: [],
      }
    }

    let totalScore = 0
    let totalWeight = 0
    const feedback: string[] = []
    const incorrectKeypoints: string[] = []
    const incorrectAngles: string[] = []

    // Compare keypoints
    for (const refKeypoint of form.keypoints) {
      const poseKeypoint = pose.keypoints.find((kp) => kp.name === refKeypoint.name)

      if (poseKeypoint && poseKeypoint.score > 0.5) {
        // Calculate position difference
        const xDiff = Math.abs(poseKeypoint.x - refKeypoint.position.x)
        const yDiff = Math.abs(poseKeypoint.y - refKeypoint.position.y)
        const zDiff = Math.abs(poseKeypoint.z - refKeypoint.position.z)

        // Calculate distance (normalized)
        const distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff + zDiff * zDiff) / 2

        // Convert to score (1 - distance)
        const keypointScore = Math.max(0, 1 - distance)

        // Weight by importance
        totalScore += keypointScore * refKeypoint.importance
        totalWeight += refKeypoint.importance

        // Add correction if needed
        if (keypointScore < 0.7) {
          incorrectKeypoints.push(refKeypoint.name)
          feedback.push(`Adjust your ${refKeypoint.name.replace("_", " ")} position.`)
        }
      }
    }

    // Compare angles
    for (const refAngle of form.angles) {
      const [joint1, joint2, joint3] = refAngle.joints

      const kp1 = pose.keypoints.find((kp) => kp.name === joint1)
      const kp2 = pose.keypoints.find((kp) => kp.name === joint2)
      const kp3 = pose.keypoints.find((kp) => kp.name === joint3)

      if (kp1 && kp2 && kp3 && kp1.score > 0.5 && kp2.score > 0.5 && kp3.score > 0.5) {
        const angle = calculateAngle(kp1, kp2, kp3)

        // Calculate difference from target angle
        const angleDiff = Math.abs(angle - refAngle.targetAngle)

        // Check if within tolerance
        const isCorrect = angleDiff <= refAngle.tolerance

        // Convert to score
        const angleScore = Math.max(0, 1 - angleDiff / 180)

        // Weight by importance
        totalScore += angleScore * refAngle.importance
        totalWeight += refAngle.importance

        // Add correction if needed
        if (!isCorrect) {
          incorrectAngles.push(refAngle.name)

          const direction = angle > refAngle.targetAngle ? "decrease" : "increase"
          feedback.push(`${direction} the angle of your ${refAngle.name.replace("_", " ")}.`)
        }
      }
    }

    // Calculate final score
    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0

    return {
      score: Math.round(finalScore),
      feedback: feedback.slice(0, 3), // Limit to top 3 corrections
      incorrectKeypoints,
      incorrectAngles,
    }
  }

  /**
   * Detect exercise repetition
   */
  public detectRepetition(
    currentPose: PoseData,
    previousPoses: PoseData[],
    exerciseType: string,
  ): { isRepCompleted: boolean; repQuality: number } {
    if (previousPoses.length < 5) {
      return { isRepCompleted: false, repQuality: 0 }
    }

    // Handle different exercise types
    switch (exerciseType.toLowerCase()) {
      case "squat":
        return this.detectSquatRepetition(currentPose, previousPoses)
      case "pushup":
        return this.detectPushupRepetition(currentPose, previousPoses)
      case "lunge":
        return this.detectLungeRepetition(currentPose, previousPoses)
      case "bicep_curl":
        return this.detectBicepCurlRepetition(currentPose, previousPoses)
      default:
        return { isRepCompleted: false, repQuality: 0 }
    }
  }

  /**
   * Detect squat repetition
   */
  private detectSquatRepetition(
    currentPose: PoseData,
    previousPoses: PoseData[],
  ): { isRepCompleted: boolean; repQuality: number } {
    // Implementation of squat detection logic
    return { isRepCompleted: false, repQuality: 0 }
  }

  /**
   * Detect pushup repetition
   */
  private detectPushupRepetition(
    currentPose: PoseData,
    previousPoses: PoseData[],
  ): { isRepCompleted: boolean; repQuality: number } {
    // Implementation of pushup detection logic
    return { isRepCompleted: false, repQuality: 0 }
  }

  /**
   * Detect lunge repetition
   */
  private detectLungeRepetition(
    currentPose: PoseData,
    previousPoses: PoseData[],
  ): { isRepCompleted: boolean; repQuality: number } {
    // Implementation of lunge detection logic
    return { isRepCompleted: false, repQuality: 0 }
  }

  /**
   * Detect bicep curl repetition
   */
  private detectBicepCurlRepetition(
    currentPose: PoseData,
    previousPoses: PoseData[],
  ): { isRepCompleted: boolean; repQuality: number } {
    // Implementation of bicep curl detection logic
    return { isRepCompleted: false, repQuality: 0 }
  }

  /**
   * Calculate calories burned
   */
  public calculateCaloriesBurned(
    exerciseType: string,
    duration: number, // in seconds
    userWeight: number, // in kg
    intensity: number, // 0-1 scale
  ): number {
    // MET values (Metabolic Equivalent of Task)
    const metValues: Record<string, number> = {
      squat: 5,
      pushup: 3.8,
      lunge: 4,
      plank: 3.5,
      burpee: 8,
      jumping_jack: 8,
      mountain_climber: 8,
      deadlift: 6,
      bench_press: 3.5,
      rowing: 7,
      running: 9.8,
      cycling: 8.5,
      swimming: 8,
      walking: 3.5,
      yoga: 2.5,
      pilates: 3,
      bicep_curl: 3.5,
      default: 4,
    }

    // Get MET value for the exercise
    const met = metValues[exerciseType.toLowerCase()] || metValues.default

    // Adjust MET based on intensity
    const adjustedMet = met * (0.8 + intensity * 0.4)

    // Calculate calories burned
    // Formula: calories = MET * weight (kg) * duration (hours)
    const durationHours = duration / 3600
    const calories = adjustedMet * userWeight * durationHours

    return Math.round(calories)
  }
}
