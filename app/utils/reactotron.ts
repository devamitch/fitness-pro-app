import { Platform } from "react-native"
import Reactotron from "reactotron-react-native"
import { reactotronReactQuery } from "reactotron-react-query"
import { zustandStorage } from "../../utils/mmkv"
import { queryClient } from "./queryClient"

// Create a custom MMKV adapter for Reactotron
const mmkvPlugin = {
  async setItem(key: string, value: string) {
    zustandStorage.set(key, value)
    return true
  },
  async getItem(key: string) {
    return zustandStorage.getString(key) || null
  },
  async removeItem(key: string) {
    zustandStorage.delete(key)
    return true
  },
}

// Configure Reactotron
export const setupReactotron = () => {
  const reactotron = Reactotron.configure({
    name: "FitnessPro",
    host: Platform.OS === "ios" ? "localhost" : "10.0.2.2",
  })
    .useReactNative({
      asyncStorage: false, // Using MMKV instead
      networking: {
        ignoreUrls: /symbolicate/,
      },
      editor: false,
      errors: { veto: () => false },
      overlay: false,
    })
    .use(reactotronReactQuery(queryClient))
    .setAsyncStorageHandler(mmkvPlugin)
    .connect()

  // Add Reactotron to the global scope
  if (reactotron) {
    console.tron = reactotron

    // Clear log on startup
    reactotron.clear?.()
  }

  return reactotron
}

// Add console.tron to the global types
declare global {
  interface Console {
    tron: typeof Reactotron
  }
}
