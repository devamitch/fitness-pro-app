import { supabase } from "@/services/supabase"
import { Platform } from "react-native"
import { mmkv } from "../../utils/mmkv"

interface AppVersion {
  version: string
  buildNumber: number
  minSupportedBuildNumber: number
  releaseNotes: string
  forceUpdate: boolean
  url: string
}

class UpdateChecker {
  private currentVersion = process.env.APP_VERSION || "1.0.0"
  private currentBuildNumber = 1 // This should be dynamically set from your build process
  private lastCheckTime = 0
  private CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours
  private LAST_CHECK_KEY = "last_update_check"

  constructor() {
    // Load last check time
    const lastCheck = mmkv.getString(this.LAST_CHECK_KEY)
    if (lastCheck) {
      this.lastCheckTime = Number.parseInt(lastCheck, 10)
    }
  }

  // Check if an update is available
  async checkForUpdate(): Promise<{
    hasUpdate: boolean
    forceUpdate: boolean
    version?: string
    releaseNotes?: string
    updateUrl?: string
  }> {
    // Don't check too frequently
    const now = Date.now()
    if (now - this.lastCheckTime < this.CHECK_INTERVAL) {
      return { hasUpdate: false, forceUpdate: false }
    }

    try {
      // Update last check time
      this.lastCheckTime = now
      mmkv.set(this.LAST_CHECK_KEY, now.toString())

      // Fetch latest version info
      const { data, error } = await supabase
        .from("app_versions")
        .select("*")
        .eq("platform", Platform.OS)
        .order("buildNumber", { ascending: false })
        .limit(1)
        .single()

      if (error) throw error

      const latestVersion = data as AppVersion

      // Check if update is needed
      if (latestVersion.buildNumber > this.currentBuildNumber) {
        return {
          hasUpdate: true,
          forceUpdate:
            latestVersion.forceUpdate ||
            latestVersion.minSupportedBuildNumber > this.currentBuildNumber,
          version: latestVersion.version,
          releaseNotes: latestVersion.releaseNotes,
          updateUrl: latestVersion.url,
        }
      }

      return { hasUpdate: false, forceUpdate: false }
    } catch (error) {
      console.error("Error checking for updates:", error)
      return { hasUpdate: false, forceUpdate: false }
    }
  }

  // Force check for update regardless of time interval
  async forceCheck() {
    // Reset last check time
    this.lastCheckTime = 0
    return this.checkForUpdate()
  }

  // Get current app version
  getCurrentVersion() {
    return {
      version: this.currentVersion,
      buildNumber: this.currentBuildNumber,
    }
  }
}

export const updateChecker = new UpdateChecker()
