import * as tf from "@tensorflow/tfjs"
import { bundleResourceIO, decodeJpeg } from "@tensorflow/tfjs-react-native"
import { Platform } from "react-native"
import { runOnJS } from "react-native-reanimated"
import { mmkv } from "../../utils/mmkv"

// Define types for pose data
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

// Define model types
export type ModelType = "posenet" | "movenet" | "blazepose" | "custom"

// Define model config
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

class TensorFlowMediaService {
  private isInitialized = false
  private model: tf.GraphModel | tf.LayersModel | null = null
  private modelConfig: ModelConfig | null = null
  private lastPrediction: any = null
  private processingFrame = false
  private frameSkipCount = 0
  private frameSkipRate = 3 // Process every 3rd frame by default

  constructor() {
    // Try to load cached model config
    this.loadCachedModelConfig()
  }

  // Load cached model config
  private loadCachedModelConfig(): void {
    try {
      const cachedConfig = mmkv.getString("tf_model_config")
      if (cachedConfig) {
        this.modelConfig = JSON.parse(cachedConfig)
      }
    } catch (error) {
      console.error("Error loading cached model config:", error)
    }
  }

  // Save model config to cache
  private saveModelConfig(): void {
    if (this.modelConfig) {
      try {
        mmkv.set("tf_model_config", JSON.stringify(this.modelConfig))
      } catch (error) {
        console.error("Error saving model config to cache:", error)
      }
    }
  }

  // Initialize TensorFlow.js
  async initialize(modelConfig?: ModelConfig): Promise<boolean> {
    if (this.isInitialized && !modelConfig) {
      return true
    }

    try {
      // Update model config if provided
      if (modelConfig) {
        this.modelConfig = modelConfig
        this.saveModelConfig()
      }

      // Initialize TensorFlow.js
      await tf.ready()
      console.log("TensorFlow.js is ready")

      // Load model if config is available
      if (this.modelConfig) {
        await this.loadModel(this.modelConfig)
      }

      this.isInitialized = true
      return true
    } catch (error) {
      console.error("Error initializing TensorFlow.js:", error)
      return false
    }
  }

  // Set frame skip rate
  setFrameSkipRate(rate: number): void {
    this.frameSkipRate = Math.max(0, rate)
  }

  // Load model based on config
  async loadModel(config: ModelConfig): Promise<boolean> {
    try {
      // Clean up previous model if exists
      if (this.model) {
        this.model.dispose()
        this.model = null
      }

      // Set model config
      this.modelConfig = config
      this.saveModelConfig()

      switch (config.type) {
        case "posenet":
          // Load PoseNet model
          this.model = await tf.loadGraphModel(
            "https://tfhub.dev/tensorflow/tfjs-model/posenet/mobilenet/float/075/1/default/1",
            { fromTFHub: true },
          )
          break

        case "movenet":
          // Load MoveNet model
          this.model = await tf.loadGraphModel(
            "https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4",
            {
              fromTFHub: true,
            },
          )
          break

        case "blazepose":
          // Load BlazePose model
          this.model = await tf.loadGraphModel(
            "https://tfhub.dev/mediapipe/tfjs-model/blazepose/detector/1",
            {
              fromTFHub: true,
            },
          )
          break

        case "custom":
          // Load custom model from bundled resources
          if (config.modelJson && config.modelWeights) {
            const modelJSON = require(config.modelJson)
            const modelWeights = config.modelWeights.map((weight) => require(weight))
            this.model = await tf.loadLayersModel(bundleResourceIO(modelJSON, modelWeights))
          } else {
            throw new Error("Custom model requires modelJson and modelWeights")
          }
          break

        default:
          throw new Error(`Unsupported model type: ${config.type}`)
      }

      console.log(`TensorFlow model loaded: ${config.type}`)
      return true
    } catch (error) {
      console.error("Error loading TensorFlow model:", error)
      return false
    }
  }

  // Create a frame processor for TensorFlow.js
  createFrameProcessor(
    onPrediction: (prediction: any) => void,
    options: {
      skipFrames?: number
      modelType?: ModelType
      scoreThreshold?: number
    } = {},
  ): (frame: any) => void {
    // Update frame skip rate if provided
    if (options.skipFrames !== undefined) {
      this.frameSkipRate = options.skipFrames
    }

    // Return the frame processor function
    return (frame: any) => {
      "worklet"

      // Skip frames to improve performance
      if (this.frameSkipRate > 0) {
        if (this.frameSkipCount < this.frameSkipRate) {
          this.frameSkipCount++
          return
        }
        this.frameSkipCount = 0
      }

      // Avoid processing multiple frames simultaneously
      if (this.processingFrame) {
        return
      }

      // Process the frame with TensorFlow.js
      runOnJS(this.processFrame)(frame, onPrediction, options)
    }
  }

  // Process a frame with TensorFlow.js
  private async processFrame(
    frame: any,
    onPrediction: (prediction: any) => void,
    options: {
      modelType?: ModelType
      scoreThreshold?: number
    } = {},
  ): Promise<void> {
    if (!this.isInitialized || !this.model) {
      console.warn("TensorFlow.js is not initialized or model is not loaded")
      return
    }

    // Set processing flag
    this.processingFrame = true

    try {
      // Get frame data
      const imageData = frame.getData()

      // Convert frame data to tensor
      let imageTensor

      if (Platform.OS === "ios") {
        // For iOS, we need to decode the JPEG data
        const jpegData = new Uint8Array(imageData)
        imageTensor = decodeJpeg(jpegData)
      } else {
        // For Android, we can create a tensor directly
        const { width, height } = frame
        imageTensor = tf.tensor3d(imageData, [height, width, 3])
      }

      // Preprocess the image tensor based on model type
      const preprocessedTensor = this.preprocessTensor(
        imageTensor,
        options.modelType || this.modelConfig?.type || "posenet",
      )

      // Run inference
      const prediction = await this.runInference(preprocessedTensor, options)

      // Post-process the prediction
      const processedPrediction = this.postProcessPrediction(prediction, frame, options)

      // Store the last prediction
      this.lastPrediction = processedPrediction

      // Call the callback with the prediction
      onPrediction(processedPrediction)

      // Clean up tensors
      tf.dispose([imageTensor, preprocessedTensor])
    } catch (error) {
      console.error("Error processing frame with TensorFlow.js:", error)
    } finally {
      // Reset processing flag
      this.processingFrame = false
    }
  }

  // Preprocess tensor based on model type
  private preprocessTensor(tensor: tf.Tensor3D, modelType: ModelType): tf.Tensor {
    switch (modelType) {
      case "posenet":
        // Resize to 257x257 (PoseNet default)
        return tf.tidy(() => {
          return tf.image.resizeBilinear(tensor, [257, 257]).div(127.5).sub(1.0).expandDims(0)
        })

      case "movenet":
        // Resize to 192x192 (MoveNet default)
        return tf.tidy(() => {
          return tf.image.resizeBilinear(tensor, [192, 192]).div(127.5).sub(1.0).expandDims(0)
        })

      case "blazepose":
        // Resize to 256x256 (BlazePose default)
        return tf.tidy(() => {
          return tf.image.resizeBilinear(tensor, [256, 256]).div(255.0).expandDims(0)
        })

      case "custom":
        // Use custom input shape if provided
        const inputShape = this.modelConfig?.inputShape || [224, 224]
        return tf.tidy(() => {
          return tf.image
            .resizeBilinear(tensor, [inputShape[0], inputShape[1]])
            .div(255.0)
            .expandDims(0)
        })

      default:
        // Default preprocessing
        return tf.tidy(() => {
          return tf.image.resizeBilinear(tensor, [224, 224]).div(255.0).expandDims(0)
        })
    }
  }

  // Run inference with the model
  private async runInference(tensor: tf.Tensor, options: any): Promise<any> {
    if (!this.model) {
      throw new Error("Model is not loaded")
    }

    // Run inference based on model type
    const modelType = options.modelType || this.modelConfig?.type || "posenet"

    switch (modelType) {
      case "posenet":
        return this.model.predict(tensor) as tf.Tensor

      case "movenet":
        return this.model.predict(tensor) as tf.Tensor

      case "blazepose":
        return this.model.predict(tensor) as tf.Tensor

      case "custom":
        // Use custom input/output tensor names if provided
        if (this.modelConfig?.inputTensorName && this.modelConfig?.outputTensorName) {
          const feeds: Record<string, tf.Tensor> = {}
          feeds[this.modelConfig.inputTensorName] = tensor
          return (this.model as tf.GraphModel).executeAsync(feeds, [
            this.modelConfig.outputTensorName,
          ])
        } else {
          return this.model.predict(tensor) as tf.Tensor
        }

      default:
        return this.model.predict(tensor) as tf.Tensor
    }
  }

  // Post-process prediction based on model type
  private postProcessPrediction(prediction: any, frame: any, options: any): any {
    const modelType = options.modelType || this.modelConfig?.type || "posenet"
    const scoreThreshold = options.scoreThreshold || this.modelConfig?.scoreThreshold || 0.5
    const { width, height } = frame

    switch (modelType) {
      case "posenet":
        return this.postProcessPoseNetOutput(prediction, width, height, scoreThreshold)

      case "movenet":
        return this.postProcessMoveNetOutput(prediction, width, height, scoreThreshold)

      case "blazepose":
        return this.postProcessBlazePoseOutput(prediction, width, height, scoreThreshold)

      case "custom":
        // Return raw prediction for custom models
        return prediction

      default:
        return prediction
    }
  }

  // Post-process PoseNet output
  private postProcessPoseNetOutput(
    prediction: tf.Tensor,
    frameWidth: number,
    frameHeight: number,
    scoreThreshold: number,
  ): TensorFlowPoseData {
    // Extract heatmaps and offsets from prediction
    const heatmapTensor = prediction[0]
    const offsetsTensor = prediction[1]

    // Convert tensors to arrays
    const heatmapData = heatmapTensor.dataSync()
    const offsetsData = offsetsTensor.dataSync()

    // Get dimensions
    const [, height, width, numKeypoints] = heatmapTensor.shape

    // Find keypoints
    const keypoints: TensorFlowPoseKeypoint[] = []
    let totalScore = 0

    // PoseNet keypoint names
    const keypointNames = [
      "nose",
      "leftEye",
      "rightEye",
      "leftEar",
      "rightEar",
      "leftShoulder",
      "rightShoulder",
      "leftElbow",
      "rightElbow",
      "leftWrist",
      "rightWrist",
      "leftHip",
      "rightHip",
      "leftKnee",
      "rightKnee",
      "leftAnkle",
      "rightAnkle",
    ]

    for (let i = 0; i < numKeypoints; i++) {
      // Find the highest heatmap value for this keypoint
      let maxVal = Number.NEGATIVE_INFINITY
      let maxRow = 0
      let maxCol = 0

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const index = row * width * numKeypoints + col * numKeypoints + i
          if (heatmapData[index] > maxVal) {
            maxVal = heatmapData[index]
            maxRow = row
            maxCol = col
          }
        }
      }

      // Get offset for this keypoint
      const offsetY = offsetsData[maxRow * width * numKeypoints * 2 + maxCol * numKeypoints * 2 + i]
      const offsetX =
        offsetsData[
          maxRow * width * numKeypoints * 2 + maxCol * numKeypoints * 2 + i + numKeypoints
        ]

      // Calculate position
      const y = (maxRow / height) * frameHeight + offsetY
      const x = (maxCol / width) * frameWidth + offsetX

      // Add keypoint if score is above threshold
      if (maxVal > scoreThreshold) {
        keypoints.push({
          x: x / frameWidth, // Normalize to 0-1
          y: y / frameHeight, // Normalize to 0-1
          z: 0, // PoseNet doesn't provide z-coordinates
          score: maxVal,
          name: keypointNames[i] || `keypoint_${i}`,
        })
        totalScore += maxVal
      }
    }

    // Calculate average score
    const avgScore = keypoints.length > 0 ? totalScore / keypoints.length : 0

    return {
      score: avgScore,
      keypoints,
      timestamp: Date.now(),
    }
  }

  // Post-process MoveNet output
  private postProcessMoveNetOutput(
    prediction: tf.Tensor,
    frameWidth: number,
    frameHeight: number,
    scoreThreshold: number,
  ): TensorFlowPoseData {
    // MoveNet returns a 1x1x17x3 tensor
    // Where the last dimension is [y, x, confidence]
    const predictionData = prediction.dataSync()
    const numKeypoints = 17

    // MoveNet keypoint names
    const keypointNames = [
      "nose",
      "leftEye",
      "rightEye",
      "leftEar",
      "rightEar",
      "leftShoulder",
      "rightShoulder",
      "leftElbow",
      "rightElbow",
      "leftWrist",
      "rightWrist",
      "leftHip",
      "rightHip",
      "leftKnee",
      "rightKnee",
      "leftAnkle",
      "rightAnkle",
    ]

    const keypoints: TensorFlowPoseKeypoint[] = []
    let totalScore = 0

    for (let i = 0; i < numKeypoints; i++) {
      const y = predictionData[i * 3]
      const x = predictionData[i * 3 + 1]
      const score = predictionData[i * 3 + 2]

      if (score > scoreThreshold) {
        keypoints.push({
          x: x, // MoveNet already returns normalized coordinates (0-1)
          y: y,
          z: 0, // MoveNet doesn't provide z-coordinates
          score,
          name: keypointNames[i] || `keypoint_${i}`,
        })
        totalScore += score
      }
    }

    // Calculate average score
    const avgScore = keypoints.length > 0 ? totalScore / keypoints.length : 0

    return {
      score: avgScore,
      keypoints,
      timestamp: Date.now(),
    }
  }

  // Post-process BlazePose output
  private postProcessBlazePoseOutput(
    prediction: tf.Tensor,
    frameWidth: number,
    frameHeight: number,
    scoreThreshold: number,
  ): TensorFlowPoseData {
    // BlazePose has a more complex output format
    // This is a simplified version
    const predictionData = prediction.dataSync()

    // BlazePose has 33 keypoints
    const numKeypoints = 33

    // BlazePose keypoint names (simplified list)
    const keypointNames = [
      "nose",
      "leftEyeInner",
      "leftEye",
      "leftEyeOuter",
      "rightEyeInner",
      "rightEye",
      "rightEyeOuter",
      "leftEar",
      "rightEar",
      "mouthLeft",
      "mouthRight",
      "leftShoulder",
      "rightShoulder",
      "leftElbow",
      "rightElbow",
      "leftWrist",
      "rightWrist",
      "leftPinky",
      "rightPinky",
      "leftIndex",
      "rightIndex",
      "leftThumb",
      "rightThumb",
      "leftHip",
      "rightHip",
      "leftKnee",
      "rightKnee",
      "leftAnkle",
      "rightAnkle",
      "leftHeel",
      "rightHeel",
      "leftFootIndex",
      "rightFootIndex",
    ]

    const keypoints: TensorFlowPoseKeypoint[] = []
    let totalScore = 0

    // Extract keypoints from the prediction data
    // The exact format depends on the specific BlazePose model
    for (let i = 0; i < numKeypoints; i++) {
      // Assuming the format is [x, y, z, visibility] for each keypoint
      const baseIdx = i * 4
      const x = predictionData[baseIdx]
      const y = predictionData[baseIdx + 1]
      const z = predictionData[baseIdx + 2]
      const score = predictionData[baseIdx + 3]

      if (score > scoreThreshold) {
        keypoints.push({
          x: x, // BlazePose returns normalized coordinates (0-1)
          y: y,
          z: z,
          score,
          name: keypointNames[i] || `keypoint_${i}`,
        })
        totalScore += score
      }
    }

    // Calculate average score
    const avgScore = keypoints.length > 0 ? totalScore / keypoints.length : 0

    return {
      score: avgScore,
      keypoints,
      timestamp: Date.now(),
    }
  }

  // Get the last prediction
  getLastPrediction(): any {
    return this.lastPrediction
  }

  // Process a single image
  async processSingleImage(
    imageUri: string,
    options: {
      modelType?: ModelType
      scoreThreshold?: number
    } = {},
  ): Promise<any> {
    if (!this.isInitialized || !this.model) {
      console.warn("TensorFlow.js is not initialized or model is not loaded")
      return null
    }

    try {
      // Load image from URI
      const response = await fetch(imageUri)
      const imageData = await response.arrayBuffer()
      const imageTensor = decodeJpeg(new Uint8Array(imageData))

      // Get image dimensions
      const [height, width] = imageTensor.shape

      // Preprocess the image tensor
      const preprocessedTensor = this.preprocessTensor(
        imageTensor,
        options.modelType || this.modelConfig?.type || "posenet",
      )

      // Run inference
      const prediction = await this.runInference(preprocessedTensor, options)

      // Post-process the prediction
      const processedPrediction = this.postProcessPrediction(prediction, { width, height }, options)

      // Clean up tensors
      tf.dispose([imageTensor, preprocessedTensor])

      return processedPrediction
    } catch (error) {
      console.error("Error processing image with TensorFlow.js:", error)
      return null
    }
  }

  // Clean up resources
  dispose(): void {
    if (this.model) {
      this.model.dispose()
      this.model = null
    }
    this.isInitialized = false
  }
}

export const tensorflowMedia = new TensorFlowMediaService()
