import supabase from "@/services/supabase"
import NetInfo from "@react-native-community/netinfo"
import { storage } from "./storage"

interface OfflineOperation {
  id: string
  operation: string
  data: any
  timestamp: number
}

class OfflineManager {
  private STORAGE_KEY = "offline_operations"

  // Initialize the offline manager
  async initialize(): Promise<void> {
    // Initialization logic if needed
    return Promise.resolve()
  }

  // Check if device is online
  async isOnline(): Promise<boolean> {
    const netInfo = await NetInfo.fetch()
    return !!netInfo.isConnected && !!netInfo.isInternetReachable
  }

  // Save an operation for later sync
  async saveOperation(operation: string, data: any): Promise<string> {
    const id = Date.now().toString()
    const newOperation: OfflineOperation = {
      id,
      operation,
      data,
      timestamp: Date.now(),
    }

    // Get existing operations
    const operations = this.getOperations()

    // Add new operation
    operations.push(newOperation)

    // Save back to storage
    storage.set(this.STORAGE_KEY, JSON.stringify(operations))

    return id
  }

  // Get all pending operations
  getOperations(): OfflineOperation[] {
    const stored = storage.getString(this.STORAGE_KEY)
    if (!stored) return []

    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error("Error parsing offline operations:", e)
      return []
    }
  }

  // Check if there are any pending operations
  async hasPendingOperations(): Promise<boolean> {
    return this.getOperations().length > 0
  }

  // Remove an operation by ID
  removeOperation(id: string): void {
    const operations = this.getOperations()
    const filtered = operations.filter((op) => op.id !== id)
    storage.set(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  // Sync all offline data
  async syncOfflineData(): Promise<{ success: number; failed: number }> {
    // Check if we're online
    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      throw new Error("Cannot sync while offline")
    }

    const operations = this.getOperations()
    let success = 0
    let failed = 0

    // Process each operation
    for (const op of operations) {
      try {
        await this.processOperation(op)
        this.removeOperation(op.id)
        success++
      } catch (error) {
        console.error(`Failed to process offline operation ${op.id}:`, error)
        failed++
      }
    }

    return { success, failed }
  }

  // Process a single operation
  private async processOperation(operation: OfflineOperation): Promise<void> {
    const { operation: type, data } = operation

    switch (type) {
      case "insert_workout":
        await supabase.from("workouts").insert([data])
        break

      case "update_workout":
        await supabase
          .from("workouts")
          .update(data.updates)
          .eq("id", data.id)
          .eq("user_id", data.user_id)
        break

      case "delete_workout":
        await supabase.from("workouts").delete().eq("id", data.id).eq("user_id", data.user_id)
        break

      // Add more operation types as needed

      default:
        throw new Error(`Unknown operation type: ${type}`)
    }
  }

  // Clear all pending operations (use with caution)
  clearAllOperations(): void {
    storage.delete(this.STORAGE_KEY)
  }
}

export const offlineManager = new OfflineManager()
