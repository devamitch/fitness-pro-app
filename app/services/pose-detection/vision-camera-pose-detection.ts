import type { Frame } from "react-native-vision-camera"
import { runAsync, runAsyncCameraFrame, VisionCameraProxy } from "vision-camera-worklets"
import type { PoseData, PoseKeypoint } from "./types"

// Register the worklets with VisionCamera
VisionCameraProxy.registerFrameProcessorPlugins({
  poseDetection: {
    call: (frame: Frame) => {
      "worklet"
      return runAsyncCameraFrame("poseDetection", frame)
    },
  },
})

/**
 * Vision Camera Pose Detection
 *
 * This class handles pose detection using Vision Camera's frame processor plugins.
 */
export class VisionCameraPoseDetection {
  private isInitialized = false

  /**
   * Initialize pose detection
   */
  public async initialize(
    options: {
      modelComplexity?: number
      minPoseDetectionConfidence?: number
      minPoseTrackingConfidence?: number
      minPosePresenceConfidence?: number
    } = {},
  ): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      // Initialize the native pose detection module
      await runAsync("initializePoseDetection", options)
      this.isInitialized = true
      return true
    } catch (error) {
      console.error("[VisionCameraPoseDetection] Failed to initialize:", error)
      return false
    }
  }

  /**
   * Detect poses in a frame
   */
  public async detectInFrame(frame: Frame): Promise<PoseData | null> {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return null
    }

    try {
      // Run pose detection on the frame
      const result = await frame.processor.poseDetection()

      if (!result || !result.pose) return null

      // Transform the result to our PoseData format
      const keypoints: PoseKeypoint[] = result.pose.keypoints.map((kp: any) => ({
        name: kp.name,
        x: kp.x,
        y: kp.y,
        z: kp.z || 0,
        score: kp.score || 0.5,
      }))

      return {
        score: result.pose.score || 0,
        keypoints,
        timestamp: Date.now(),
      }
    } catch (error) {
      console.error("[VisionCameraPoseDetection] Failed to detect in frame:", error)
      return null
    }
  }

  /**
   * Release resources
   */
  public async release(): Promise<void> {
    if (!this.isInitialized) return

    try {
      await runAsync("releasePoseDetection")
      this.isInitialized = false
    } catch (error) {
      console.error("[VisionCameraPoseDetection] Failed to release:", error)
    }
  }
}
