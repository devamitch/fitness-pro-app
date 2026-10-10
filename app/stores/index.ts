/* eslint-disable import/namespace */
import { useHealthStore } from "../services/healthConnect"
import { useSpotifyStore } from "../services/spotify"
// import { useThemeStore } from "../theme/theme"
import { useThemeStore } from "@/theme/store"
import { useApiCacheStore } from "../services/api"
import { useVisionCameraStore } from "../services/visionCamera"
import { useAuthStore } from "./authStore"
import { usePoseDetectionStore } from "./poseDetectionStore"
import { useTTSStore } from "./ttsStore"
import { useUserPreferencesStore } from "./userPreferencesStore"

// Export all stores
export {
  useApiCacheStore,
  useAuthStore,
  useHealthStore,
  usePoseDetectionStore,
  useSpotifyStore,
  useTTSStore,
  useThemeStore,
  useUserPreferencesStore,
  useVisionCameraStore,
}

// Root store type
export type RootStore = {
  auth: ReturnType<typeof useAuthStore.getState>
  theme: ReturnType<typeof useThemeStore.getState>
  userPreferences: ReturnType<typeof useUserPreferencesStore.getState>
  spotify: ReturnType<typeof useSpotifyStore.getState>
  health: ReturnType<typeof useHealthStore.getState>
  poseDetection: ReturnType<typeof usePoseDetectionStore.getState>
  visionCamera: ReturnType<typeof useVisionCameraStore.getState>
  apiCache: ReturnType<typeof useApiCacheStore.getState>
  tts: ReturnType<typeof useTTSStore.getState>
}

// Get root store
export const getRootStore = (): RootStore => ({
  auth: useAuthStore.getState(),
  theme: useThemeStore.getState(),
  userPreferences: useUserPreferencesStore.getState(),
  spotify: useSpotifyStore.getState(),
  health: useHealthStore.getState(),
  // iap: useIAPStore.getState(),
  poseDetection: usePoseDetectionStore.getState(),
  visionCamera: useVisionCameraStore.getState(),
  apiCache: useApiCacheStore.getState(),
  tts: useTTSStore.getState(),
})
