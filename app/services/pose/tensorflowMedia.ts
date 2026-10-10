import { storage } from "@/utils/storage"
import * as tf from "@tensorflow/tfjs"
import { bundleResourceIO, decodeJpeg } from "@tensorflow/tfjs-react-native"
import { Platform } from "react-native"
import type { ModelConfig, ModelType, TensorFlowPoseData } from "./types"

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
      const cachedConfig = storage.getString("tf_model_config")
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
        storage.set("tf_model_config", JSON.stringify(this.modelConfig))
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

  // Process a frame with TensorFlow.js
  async processFrame(
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
    // Implementation details omitted for brevity
    return {
      score: 0,
      keypoints: [],
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
    // Implementation details omitted for brevity
    return {
      score: 0,
      keypoints: [],
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
    // Implementation details omitted for brevity
    return {
      score: 0,
      keypoints: [],
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
