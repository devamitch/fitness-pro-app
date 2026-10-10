import { storage } from "@/utils/storage"
import { NativeModules } from "react-native"
import type { ExerciseForm, PoseData } from "./types"
import { calculateAngle } from "./utils"

class MediaPipeAndroidService {
  private isAvailable = false
  private isInitialized = false
  private lastPose: PoseData | null = null
  private exerciseForms: Record<string, ExerciseForm> = {}

  constructor() {
    // Check if MediaPipe is available on this device
    this.checkAvailability()
    // Load cached exercise forms
    this.loadExerciseForms()
  }

  // Check if MediaPipe is available
  private async checkAvailability(): Promise<boolean> {
    try {
      // Check if the native module is available
      this.isAvailable = !!NativeModules.MediaPipeModule
      return this.isAvailable
    } catch (error) {
      console.error("Error checking MediaPipe availability:", error)
      this.isAvailable = false
      return false
    }
  }

  // Load cached exercise forms
  private loadExerciseForms(): void {
    try {
      const cachedForms = storage.getString("exercise_forms")
      if (cachedForms) {
        this.exerciseForms = JSON.parse(cachedForms)
      }
    } catch (error) {
      console.error("Error loading cached exercise forms:", error)
    }
  }

  // Save exercise forms to cache
  private saveExerciseForms(): void {
    try {
      storage.set("exercise_forms", JSON.stringify(this.exerciseForms))
    } catch (error) {
      console.error("Error saving exercise forms to cache:", error)
    }
  }

  // Initialize MediaPipe
  async initialize(options: { modelComplexity?: number } = {}): Promise<boolean> {
    if (!this.isAvailable) {
      console.warn("MediaPipe is not available on this device")
      return false
    }

    if (this.isInitialized) {
      return true
    }

    try {
      if (NativeModules.MediaPipeModule) {
        await NativeModules.MediaPipeModule.initialize({
          modelComplexity: options.modelComplexity || 1, // 0: Lite, 1: Full, 2: Heavy
          enableSegmentation: false,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })
        this.isInitialized = true
        return true
      }

      return false
    } catch (error) {
      console.error("Error initializing MediaPipe:", error)
      return false
    }
  }

  // Start pose detection
  async startPoseDetection(
    options: {
      minPoseScore?: number
      minKeypointScore?: number
      smoothing?: boolean
    } = {},
  ): Promise<boolean> {
    if (!this.isAvailable || !this.isInitialized) {
      console.warn("MediaPipe is not available or not initialized")
      return false
    }

    try {
      if (NativeModules.MediaPipeModule) {
        await NativeModules.MediaPipeModule.startPoseDetection({
          minPoseScore: options.minPoseScore || 0.5,
          minKeypointScore: options.minKeypointScore || 0.5,
          smoothing: options.smoothing !== false,
        })
        return true
      }

      return false
    } catch (error) {
      console.error("Error starting pose detection:", error)
      return false
    }
  }

  // Stop pose detection
  async stopPoseDetection(): Promise<boolean> {
    if (!this.isAvailable || !this.isInitialized) {
      return false
    }

    try {
      if (NativeModules.MediaPipeModule) {
        await NativeModules.MediaPipeModule.stopPoseDetection()
        return true
      }

      return false
    } catch (error) {
      console.error("Error stopping pose detection:", error)
      return false
    }
  }

  // Get current pose data
  async getCurrentPose(): Promise<PoseData | null> {
    if (!this.isAvailable || !this.isInitialized) {
      return null
    }

    try {
      if (NativeModules.MediaPipeModule) {
        const poseData = await NativeModules.MediaPipeModule.getCurrentPose()
        this.lastPose = poseData
        return poseData
      }

      return null
    } catch (error) {
      console.error("Error getting current pose:", error)
      return null
    }
  }

  // Process a single image
  async processSingleImage(
    imageUri: string,
    options: {
      minPoseScore?: number
      minKeypointScore?: number
    } = {},
  ): Promise<PoseData | null> {
    if (!this.isAvailable || !this.isInitialized) {
      return null
    }

    try {
      if (NativeModules.MediaPipeModule) {
        const poseData = await NativeModules.MediaPipeModule.processSingleImage(imageUri, {
          minPoseScore: options.minPoseScore || 0.5,
          minKeypointScore: options.minKeypointScore || 0.5,
        })
        return poseData
      }

      return null
    } catch (error) {
      console.error("Error processing image:", error)
      return null
    }
  }

  // Get keypoint names
  getKeypointNames(): string[] {
    return [
      "nose",
      "left_eye_inner",
      "left_eye",
      "left_eye_outer",
      "right_eye_inner",
      "right_eye",
      "right_eye_outer",
      "left_ear",
      "right_ear",
      "mouth_left",
      "mouth_right",
      "left_shoulder",
      "right_shoulder",
      "left_elbow",
      "right_elbow",
      "left_wrist",
      "right_wrist",
      "left_pinky",
      "right_pinky",
      "left_index",
      "right_index",
      "left_thumb",
      "right_thumb",
      "left_hip",
      "right_hip",
      "left_knee",
      "right_knee",
      "left_ankle",
      "right_ankle",
      "left_heel",
      "right_heel",
      "left_foot_index",
      "right_foot_index",
    ]
  }

  // Add or update exercise form
  addExerciseForm(form: ExerciseForm): void {
    this.exerciseForms[form.exerciseId] = form
    this.saveExerciseForms()
  }

  // Get exercise form
  getExerciseForm(exerciseId: string): ExerciseForm | null {
    return this.exerciseForms[exerciseId] || null
  }

  // Compare pose with reference form
  comparePoseWithForm(
    pose: PoseData,
    exerciseId: string,
  ): {
    score: number
    feedback: string[]
    incorrectKeypoints: string[]
    incorrectAngles: string[]
  } {
    const form = this.getExerciseForm(exerciseId)
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

  // Detect exercise repetition
  detectRepetition(
    currentPose: PoseData,
    previousPoses: PoseData[],
    exerciseType: string,
  ): { isRepCompleted: boolean; repQuality: number } {
    if (previousPoses.length < 5) {
      return { isRepCompleted: false, repQuality: 0 }
    }

    // Implementation depends on the exercise type
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

  // Detect squat repetition
  private detectSquatRepetition(
    currentPose: PoseData,
    previousPoses: PoseData[],
  ): { isRepCompleted: boolean; repQuality: number } {
    // Get hip keypoints
    const hipKeypoint = currentPose.keypoints.find(
      (kp) => kp.name === "left_hip" || kp.name === "right_hip",
    )
    const kneeKeypoint = currentPose.keypoints.find(
      (kp) => kp.name === "left_knee" || kp.name === "right_knee",
    )

    if (!hipKeypoint || !kneeKeypoint) {
      return { isRepCompleted: false, repQuality: 0 }
    }

    // Get previous hip positions
    const previousHipPositions = previousPoses
      .map((pose) => pose.keypoints.find((kp) => kp.name === hipKeypoint.name))
      .filter((kp): kp is NonNullable<typeof kp> => kp !== undefined)
      .map((kp) => kp.y)

    // Check if we've completed a down-up movement
    const currentY = hipKeypoint.y
    const minY = Math.min(...previousHipPositions)
    const maxY = Math.max(...previousHipPositions)
    const range = maxY - minY

    // Calculate depth of squat (how low they went)
    const depthPercentage = range > 0 ? (maxY - minY) / maxY : 0
    const depthQuality = Math.min(1, depthPercentage / 0.3) // 0.3 is a good depth for a squat

    // If we've moved from low position back to high position
    if (
      previousHipPositions[0] > minY + range * 0.7 && // Started high
      previousHipPositions.some((y) => y < minY + range * 0.3) && // Went low
      currentY > minY + range * 0.7 // Back to high
    ) {
      // Calculate rep quality based on depth and form
      const formQuality = this.calculateSquatFormQuality(currentPose, previousPoses)
      const repQuality = (depthQuality * 0.6 + formQuality * 0.4) * 100

      return { isRepCompleted: true, repQuality: Math.round(repQuality) }
    }

    return { isRepCompleted: false, repQuality: 0 }
  }

  // Calculate squat form quality
  private calculateSquatFormQuality(currentPose: PoseData, previousPoses: PoseData[]): number {
    // Check if knees are aligned with feet
    const leftKnee = currentPose.keypoints.find((kp) => kp.name === "left_knee")
    const rightKnee = currentPose.keypoints.find((kp) => kp.name === "right_knee")
    const leftAnkle = currentPose.keypoints.find((kp) => kp.name === "left_ankle")
    const rightAnkle = currentPose.keypoints.find((kp) => kp.name === "right_ankle")
    const leftHip = currentPose.keypoints.find((kp) => kp.name === "left_hip")
    const rightHip = currentPose.keypoints.find((kp) => kp.name === "right_hip")

    if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle || !leftHip || !rightHip) {
      return 0.5 // Default if we can't calculate
    }

    // Check knee alignment (knees should be above ankles)
    const leftKneeAlignment = Math.abs(leftKnee.x - leftAnkle.x) / Math.abs(leftHip.x - leftAnkle.x)
    const rightKneeAlignment =
      Math.abs(rightKnee.x - rightAnkle.x) / Math.abs(rightHip.x - rightAnkle.x)
    const kneeAlignmentScore = 1 - Math.min(1, (leftKneeAlignment + rightKneeAlignment) / 2)

    // Check back angle (should be relatively straight)
    const backAngle = calculateAngle(
      currentPose.keypoints.find((kp) => kp.name === "left_shoulder") || leftHip,
      leftHip,
      leftKnee,
    )
    const backAngleScore = 1 - Math.min(1, Math.abs(backAngle - 45) / 45)

    // Combine scores
    return kneeAlignmentScore * 0.6 + backAngleScore * 0.4
  }

  // Detect pushup repetition
  private detectPushupRepetition(
    currentPose: PoseData,
    previousPoses: PoseData[],
  ): { isRepCompleted: boolean; repQuality: number } {
    // Implementation details omitted for brevity
    return { isRepCompleted: false, repQuality: 0 }
  }

  // Detect lunge repetition
  private detectLungeRepetition(
    currentPose: PoseData,
    previousPoses: PoseData[],
  ): { isRepCompleted: boolean; repQuality: number } {
    // Implementation details omitted for brevity
    return { isRepCompleted: false, repQuality: 0 }
  }

  // Detect bicep curl repetition
  private detectBicepCurlRepetition(
    currentPose: PoseData,
    previousPoses: PoseData[],
  ): { isRepCompleted: boolean; repQuality: number } {
    // Implementation details omitted for brevity
    return { isRepCompleted: false, repQuality: 0 }
  }

  // Calculate calories burned based on exercise and duration
  calculateCaloriesBurned(
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

export const mediaPipeAndroid = new MediaPipeAndroidService()
