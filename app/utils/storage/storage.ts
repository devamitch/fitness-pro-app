import Config from "@/config"
import { MMKV } from "react-native-mmkv"

export const storage = new MMKV({
  id: `${Config.app.name}-storage`,
  encryptionKey: Config.persistence.encryptionKey,
})

// Storage keys
export enum StorageKeys {
  AUTH_TOKEN = "auth_token",
  USER_DATA = "user_data",
  USER_PREFERENCES = "user_preferences",
  THEME_MODE = "theme_mode",
  LANGUAGE = "language",
  EXERCISE_FORMS = "exercise_forms",
  POSE_DETECTION_SETTINGS = "pose_detection_settings",
  VOICE_COMMANDS_ENABLED = "voice_commands_enabled",
  ONBOARDING_COMPLETED = "onboarding_completed",
  LAST_WORKOUT_DATE = "last_workout_date",
  WORKOUT_HISTORY = "workout_history",
  QUERY_CLIENT = "query_client",
}

// Storage interface for use with libraries
export const mmkvStorage = {
  setItem: (key: string, value: string): boolean => {
    storage.set(key, value)
    return true
  },
  getItem: (key: string): string | null => {
    const value = storage.getString(key)
    return value || null
  },
  removeItem: (key: string): void => {
    storage.delete(key)
  },
}

/**
 * Loads a string from storage.
 *
 * @param key The key to fetch.
 */
export function loadString(key: string): string | null {
  try {
    return storage.getString(key) ?? null
  } catch {
    // not sure why this would fail... even reading the RN docs I'm unclear
    return null
  }
}

/**
 * Saves a string to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export function saveString(key: string, value: string): boolean {
  try {
    storage.set(key, value)
    return true
  } catch {
    return false
  }
}

/**
 * Loads something from storage and runs it thru JSON.parse.
 *
 * @param key The key to fetch.
 */
export function load<T>(key: string): T | null {
  let almostThere: string | null = null
  try {
    almostThere = loadString(key)
    return JSON.parse(almostThere ?? "") as T
  } catch {
    return (almostThere as T) ?? null
  }
}

/**
 * Saves an object to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export function save(key: string, value: unknown): boolean {
  try {
    saveString(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Removes something from storage.
 *
 * @param key The key to kill.
 */
export function remove(key: string): void {
  try {
    storage.delete(key)
  } catch {}
}

/**
 * Burn it all to the ground.
 */
export function clear(): void {
  try {
    storage.clearAll()
  } catch {}
}

export const zustandStorage = {
  // Set a value
  set: (key: string, value: any) => {
    try {
      if (typeof value === "string") {
        storage.set(key, value)
      } else {
        storage.set(key, JSON.stringify(value))
      }
      return true
    } catch (e: any) {
      console.error(`Error setting ${key} in storage:`, e)
      return false
    }
  },

  // Get a value
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const value = storage.getString(key)
      if (value === undefined) return defaultValue

      try {
        return JSON.parse(value) as T
      } catch {
        return value as unknown as T
      }
    } catch (e: any) {
      console.error(`Error getting ${key} from storage:`, e)
      return defaultValue
    }
  },

  // Delete a value
  delete: (key: string) => {
    try {
      storage.delete(key)
      return true
    } catch (e: any) {
      console.error(`Error deleting ${key} from storage:`, e)
      return false
    }
  },

  // Clear all storage
  clear: () => {
    try {
      storage.clearAll()
      return true
    } catch (e: any) {
      console.error("Error clearing storage:", e)
      return false
    }
  },

  // Get all keys
  getAllKeys: (): string[] => {
    return storage.getAllKeys()
  },
}
