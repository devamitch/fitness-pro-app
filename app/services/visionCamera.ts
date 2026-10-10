import { storage } from "@/utils/storage"
import type React from "react"
import { runOnJS } from "react-native-reanimated"
import { Camera, useCameraDevices, useFrameProcessor } from "react-native-vision-camera"
import { mediaPipe } from "./mediaPipe"

// Define frame processor options
export interface FrameProcessorOptions {
  skipFrames?: number
  minPoseScore?: number
  minKeypointScore?: number
  enableSmoothing?: boolean
}

class VisionCameraService {
  private hasPermission = false
  private isInitialized = false
  private frameProcessorOptions: FrameProcessorOptions = {
    skipFrames: 3,
    minPoseScore: 0.5,
    minKeypointScore: 0.5,
    enableSmoothing: true,
  }

  // Check camera permission
  async checkPermission(): Promise<boolean> {
    try {
      const status = await Camera.getCameraPermissionStatus()
      this.hasPermission = status === "authorized"
      return this.hasPermission
    } catch (error) {
      console.error("Error checking camera permission:", error)
      return false
    }
  }

  // Request camera permission
  async requestPermission(): Promise<boolean> {
    try {
      const status = await Camera.requestCameraPermission()
      this.hasPermission = status === "authorized"
      return this.hasPermission
    } catch (error) {
      console.error("Error requesting camera permission:", error)
      return false
    }
  }

  // Check microphone permission
  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const status = await Camera.getMicrophonePermissionStatus()
      return status === "authorized"
    } catch (error) {
      console.error("Error checking microphone permission:", error)
      return false
    }
  }

  // Request microphone permission
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const status = await Camera.requestMicrophonePermission()
      return status === "authorized"
    } catch (error) {
      console.error("Error requesting microphone permission:", error)
      return false
    }
  }

  // Get available cameras
  async getAvailableCameras(): Promise<Camera.CameraDevice[]> {
    try {
      const devices = await Camera.getAvailableCameraDevices()
      return devices
    } catch (error) {
      console.error("Error getting available cameras:", error)
      return []
    }
  }

  // Get preferred camera device
  async getPreferredCameraDevice(): Promise<Camera.CameraDevice | null> {
    try {
      const devices = await this.getAvailableCameras()

      if (devices.length === 0) {
        return null
      }

      // Get saved preference
      const savedDeviceId = storage.getString("preferred_camera_device")

      if (savedDeviceId) {
        const savedDevice = devices.find((device) => device.id === savedDeviceId)
        if (savedDevice) {
          return savedDevice
        }
      }

      // Default to back camera
      const backCamera = devices.find((device) => device.position === "back")
      if (backCamera) {
        return backCamera
      }

      // Fallback to first available
      return devices[0]
    } catch (error) {
      console.error("Error getting preferred camera device:", error)
      return null
    }
  }

  // Save preferred camera device
  savePreferredCameraDevice(deviceId: string): void {
    storage.set("preferred_camera_device", deviceId)
  }

  // Get camera format for a specific device
  async getCameraFormat(
    device: Camera.CameraDevice,
    options: {
      fps?: number
      hdr?: boolean
      videoStabilizationMode?: Camera.VideoStabilizationMode
    } = {},
  ): Promise<Camera.CameraDeviceFormat | null> {
    try {
      const formats = device.formats

      // Filter by HDR if specified
      let filteredFormats = formats
      if (options.hdr !== undefined) {
        filteredFormats = filteredFormats.filter(
          (format) => format.supportsPhotoHdr === options.hdr,
        )
      }

      // Filter by video stabilization if specified
      if (options.videoStabilizationMode) {
        filteredFormats = filteredFormats.filter((format) =>
          format.videoStabilizationModes.includes(options.videoStabilizationMode),
        )
      }

      // Filter by FPS if specified
      if (options.fps) {
        filteredFormats = filteredFormats.filter((format) => {
          const fpsRange = format.frameRateRanges.find(
            (range) => range.minFrameRate <= options.fps! && range.maxFrameRate >= options.fps!,
          )
          return !!fpsRange
        })
      }

      // Sort by resolution (highest first)
      filteredFormats.sort((a, b) => {
        const aRes = a.photoHeight * a.photoWidth
        const bRes = b.photoHeight * b.photoWidth
        return bRes - aRes
      })

      return filteredFormats[0] || null
    } catch (error) {
      console.error("Error getting camera format:", error)
      return null
    }
  }

  // Set frame processor options
  setFrameProcessorOptions(options: FrameProcessorOptions): void {
    this.frameProcessorOptions = {
      ...this.frameProcessorOptions,
      ...options,
    }
  }

  // Get frame processor options
  getFrameProcessorOptions(): FrameProcessorOptions {
    return this.frameProcessorOptions
  }

  // Initialize Vision Camera with MediaPipe
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true
    }

    try {
      // Check camera permission
      const hasPermission = await this.checkPermission()
      if (!hasPermission) {
        const granted = await this.requestPermission()
        if (!granted) {
          return false
        }
      }

      // Initialize MediaPipe
      const mediaPipeInitialized = await mediaPipe.initialize()

      this.isInitialized = mediaPipeInitialized
      return this.isInitialized
    } catch (error) {
      console.error("Error initializing Vision Camera:", error)
      return false
    }
  }

  // Create a frame processor for pose detection
  createPoseDetectionFrameProcessor(
    onPoseDetected: (pose: any) => void,
    options?: FrameProcessorOptions,
  ): (frame: any) => void {
    const processorOptions = {
      ...this.frameProcessorOptions,
      ...options,
    }

    let frameCount = 0

    return (frame: any) => {
      "worklet"

      // Skip frames to improve performance
      if (processorOptions.skipFrames && frameCount++ % processorOptions.skipFrames !== 0) {
        return
      }

      // Process the frame with MediaPipe
      // Note: In a real implementation, we would use a native module to process the frame
      // For this example, we'll simulate processing

      // Convert frame to image
      const image = {
        width: frame.width,
        height: frame.height,
        planes: frame.planes,
        timestamp: frame.timestamp,
      }

      // Run on JS thread
      runOnJS(this.processPoseFrame)(image, onPoseDetected, processorOptions)
    }
  }

  // Process pose frame
  private async processPoseFrame(
    image: any,
    onPoseDetected: (pose: any) => void,
    options: FrameProcessorOptions,
  ): Promise<void> {
    try {
      // In a real implementation, we would process the frame with MediaPipe
      // For this example, we'll simulate processing by getting the current pose
      const pose = await mediaPipe.getCurrentPose()

      if (pose && pose.score >= (options.minPoseScore || 0.5)) {
        onPoseDetected(pose)
      }
    } catch (error) {
      console.error("Error processing pose frame:", error)
    }
  }

  // Take a photo with pose detection
  async takePhotoWithPoseDetection(
    camera: React.RefObject<Camera>,
    options?: {
      flash?: "on" | "off" | "auto"
      qualityPrioritization?: "speed" | "quality"
      enableShutterSound?: boolean
    },
  ): Promise<{ photo: any; pose: any } | null> {
    if (!camera.current) {
      return null
    }

    try {
      // Take photo
      const photo = await camera.current.takePhoto({
        flash: options?.flash || "off",
        qualityPrioritization: options?.qualityPrioritization || "quality",
        enableShutterSound: options?.enableShutterSound !== false,
      })

      // Process photo with MediaPipe
      const pose = await mediaPipe.processSingleImage(photo.path)

      return { photo, pose }
    } catch (error) {
      console.error("Error taking photo with pose detection:", error)
      return null
    }
  }
}

export const visionCamera = new VisionCameraService()

// Custom hook for camera devices
export function useCameraDevicesWithPreference() {
  const devices = useCameraDevices()

  // Get preferred device from storage
  const preferredDeviceId = storage.getString("preferred_camera_device")

  if (!devices.back && !devices.front) {
    return { device: null, devices: {} }
  }

  // Use preferred device if available
  if (preferredDeviceId) {
    const allDevices = { ...devices }
    const preferredDevice = Object.values(allDevices).find((d) => d?.id === preferredDeviceId)

    if (preferredDevice) {
      return { device: preferredDevice, devices }
    }
  }

  // Default to back camera, fallback to front
  return { device: devices.back || devices.front, devices }
}

// Custom hook for pose detection frame processor
export function usePoseDetectionFrameProcessor(
  onPoseDetected: (pose: any) => void,
  options?: FrameProcessorOptions,
) {
  return useFrameProcessor(
    visionCamera.createPoseDetectionFrameProcessor(onPoseDetected, options),
    [onPoseDetected, options],
  )
}
