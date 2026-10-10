import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import type React from "react"
import { captureRef } from "react-native-view-shot"
import { mmkv } from "../../utils/mmkv"

class ScreenSnapshotManager {
  private SNAPSHOT_DIR = `${FileSystem.documentDirectory}snapshots/`
  private SNAPSHOTS_INDEX_KEY = "screen_snapshots_index"

  constructor() {
    this.ensureSnapshotDir()
  }

  // Ensure snapshot directory exists
  private async ensureSnapshotDir(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.SNAPSHOT_DIR)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.SNAPSHOT_DIR, { intermediates: true })
      }
    } catch (e) {
      console.error("Failed to create snapshot directory:", e)
    }
  }

  // Capture a snapshot of a component
  async captureSnapshot(
    ref: React.RefObject<any>,
    options: {
      name: string
      format?: "png" | "jpg" | "webm"
      quality?: number
      result?: "file" | "base64" | "data-uri"
      width?: number
      height?: number
    },
  ): Promise<string | null> {
    if (!ref.current) return null

    try {
      await this.ensureSnapshotDir()

      const timestamp = Date.now()
      const filename = `${options.name.replace(/\s+/g, "_")}_${timestamp}.${options.format || "png"}`
      const filePath = `${this.SNAPSHOT_DIR}${filename}`

      const uri = await captureRef(ref, {
        format: options.format || "png",
        quality: options.quality || 0.9,
        result: "file",
        width: options.width,
        height: options.height,
      })

      // Move to our directory
      await FileSystem.moveAsync({
        from: uri,
        to: filePath,
      })

      // Save to index
      this.saveToIndex({
        name: options.name,
        filename,
        path: filePath,
        timestamp,
        format: options.format || "png",
      })

      return filePath
    } catch (e) {
      console.error("Error capturing snapshot:", e)
      return null
    }
  }

  // Share a snapshot
  async shareSnapshot(path: string, options?: { title?: string }): Promise<boolean> {
    try {
      const canShare = await Sharing.isAvailableAsync()
      if (!canShare) {
        console.warn("Sharing is not available on this device")
        return false
      }

      await Sharing.shareAsync(path, {
        mimeType: "image/png",
        dialogTitle: options?.title || "Share Snapshot",
        UTI: "public.png",
      })

      return true
    } catch (e) {
      console.error("Error sharing snapshot:", e)
      return false
    }
  }

  // Get all snapshots
  getSnapshots(): SnapshotInfo[] {
    const indexJson = mmkv.getString(this.SNAPSHOTS_INDEX_KEY)
    if (!indexJson) return []

    try {
      return JSON.parse(indexJson)
    } catch (e) {
      console.error("Error parsing snapshots index:", e)
      return []
    }
  }

  // Delete a snapshot
  async deleteSnapshot(filename: string): Promise<boolean> {
    try {
      const snapshots = this.getSnapshots()
      const snapshot = snapshots.find((s) => s.filename === filename)

      if (!snapshot) return false

      // Delete file
      await FileSystem.deleteAsync(`${this.SNAPSHOT_DIR}${filename}`, { idempotent: true })

      // Update index
      const updatedSnapshots = snapshots.filter((s) => s.filename !== filename)
      mmkv.set(this.SNAPSHOTS_INDEX_KEY, JSON.stringify(updatedSnapshots))

      return true
    } catch (e) {
      console.error("Error deleting snapshot:", e)
      return false
    }
  }

  // Clear all snapshots
  async clearAllSnapshots(): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(this.SNAPSHOT_DIR, { idempotent: true })
      await this.ensureSnapshotDir()

      // Clear index
      mmkv.delete(this.SNAPSHOTS_INDEX_KEY)

      return true
    } catch (e) {
      console.error("Error clearing snapshots:", e)
      return false
    }
  }

  // Save snapshot info to index
  private saveToIndex(info: SnapshotInfo): void {
    const snapshots = this.getSnapshots()
    snapshots.push(info)

    // Sort by timestamp (newest first)
    snapshots.sort((a, b) => b.timestamp - a.timestamp)

    // Save back to storage
    mmkv.set(this.SNAPSHOTS_INDEX_KEY, JSON.stringify(snapshots))
  }
}

interface SnapshotInfo {
  name: string
  filename: string
  path: string
  timestamp: number
  format: string
}

export const screenSnapshotManager = new ScreenSnapshotManager()
