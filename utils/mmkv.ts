import { MMKV } from "react-native-mmkv"

// Create the storage instance
export const mmkv = new MMKV({
  id: "fitness-app-storage",
  encryptionKey: "fitness-app-secure-key",
})

// Helper methods for common operations
export const zustandStorage = {
  // Set a value
  set: (key: string, value: any) => {
    try {
      if (typeof value === "string") {
        mmkv.set(key, value)
      } else {
        mmkv.set(key, JSON.stringify(value))
      }
      return true
    } catch (e: any) {
      console.error(`Error setting ${key} in storage:`, e)
      return false
    }
  },

  // Get a value
  get: <T extends unknown>(key: string, defaultValue?: T): T | undefined => {
    try {
      const value = mmkv.getString(key)
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
      mmkv.delete(key)
      return true
    } catch (e: any) {
      console.error(`Error deleting ${key} from storage:`, e)
      return false
    }
  },

  // Clear all storage
  clear: () => {
    try {
      mmkv.clearAll()
      return true
    } catch (e: any) {
      console.error("Error clearing storage:", e)
      return false
    }
  },

  // Get all keys
  getAllKeys: (): string[] => {
    return mmkv.getAllKeys()
  },
}
