/**
 * This file imports configuration objects from either the config.dev.js file
 * or the config.prod.js file depending on whether we are in __DEV__ or not.
 *
 * Note that we do not gitignore these files. Unlike on web servers, just because
 * these are not checked into your repo doesn't mean that they are secure.
 * In fact, you're shipping a JavaScript bundle with every
 * config variable in plain text. Anyone who downloads your app can easily
 * extract them.
 *
 * If you doubt this, just bundle your app, and then go look at the bundle and
 * search it for one of your config variable values. You'll find it there.
 *
 * Read more here: https://reactnative.dev/docs/security#storing-sensitive-info
 */
import { Platform } from "react-native"
import BaseConfig from "./config.base"
import DevConfig from "./config.dev"
import ProdConfig from "./config.prod"

let ExtraConfig = ProdConfig

if (__DEV__) {
  ExtraConfig = DevConfig
}

const Config = {
  ...BaseConfig,
  ...ExtraConfig,
  api: {
    url: "https://api.yourfitnesssapp.com/v1",
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  },
  // App information
  app: {
    name: "FitnessTracker",
    version: "1.0.0",
    build: 1,
  },
  // Feature toggles
  features: {
    voiceCommands: true,
    offlineMode: true,
    poseDetection: true,
    socialSharing: true,
  },
  // Persistence configuration
  persistence: {
    encryptionKey: "your-encryption-key-here",
  },
  // Performance settings
  performance: {
    enableAnimationsLowMemory: false,
    lowMemoryThreshold: 100 * 1024 * 1024, // 100MB
    preloadAssets: true,
    useWebP: Platform.OS === "android",
  },
  // MediaPipe configuration
  mediaPipe: {
    modelComplexity: 1, // 0=Lite, 1=Full, 2=Heavy
    minPoseDetectionConfidence: 0.5,
    minPoseTrackingConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    frameSkipRate: 3, // Process every N frames
  },
  // Expo configuration
  expo: {
    projectId: "your-expo-project-id",
  },
  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
  },
}

export default Config
