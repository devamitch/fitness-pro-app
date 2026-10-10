import { storage } from "@/utils/storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { offlineManager } from "../utils/offlineManager"
import { supabase } from "./api"

// Define sync operation
interface SyncOperation {
  id: string
  table: string
  operation: "insert" | "update" | "delete"
  data: any
  timestamp: number
  retries: number
  status: "pending" | "processing" | "failed" | "completed"
}

// Define sync state
interface SyncState {
  operations: SyncOperation[]
  lastSyncTime: number | null
  isSyncing: boolean

  // Methods
  addOperation: (table: string, operation: "insert" | "update" | "delete", data: any) => string
  removeOperation: (id: string) => void
  updateOperationStatus: (id: string, status: SyncOperation["status"]) => void
  syncAll: () => Promise<void>
  initialize: () => Promise<void>
}

// Create sync store
export const useSyncStore = create<SyncState>()(
  persist(
    immer((set, get) => ({
      operations: [],
      lastSyncTime: null,
      isSyncing: false,

      addOperation: async (table, operation, data) => {
        const id = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        const syncOperation: SyncOperation = {
          id,
          table,
          operation,
          data,
          timestamp: Date.now(),
          retries: 0,
          status: "pending",
        }

        set((state) => {
          state.operations.push(syncOperation)
        })

        // If online, try to sync immediately
        if (await offlineManager.isOnline()) {
          get().syncAll()
        }

        return id
      },

      removeOperation: (id) => {
        set((state) => {
          state.operations = state.operations.filter((op) => op.id !== id)
        })
      },

      updateOperationStatus: (id, status) => {
        set((state) => {
          const operation = state.operations.find((op) => op.id === id)
          if (operation) {
            operation.status = status
            if (status === "failed") {
              operation.retries += 1
            }
          }
        })
      },

      syncAll: async () => {
        // If already syncing or no operations, return
        if (get().isSyncing || get().operations.length === 0) return

        // Check if online
        if (!(await offlineManager.isOnline())) return

        set((state) => {
          state.isSyncing = true
        })

        try {
          const operations = [...get().operations].filter((op) => op.status !== "completed")

          for (const operation of operations) {
            try {
              get().updateOperationStatus(operation.id, "processing")

              switch (operation.operation) {
                case "insert":
                  await supabase.from(operation.table).insert(operation.data)
                  break
                case "update":
                  await supabase
                    .from(operation.table)
                    .update(operation.data.updates)
                    .eq(operation.data.column, operation.data.value)
                  break
                case "delete":
                  await supabase
                    .from(operation.table)
                    .delete()
                    .eq(operation.data.column, operation.data.value)
                  break
              }

              get().updateOperationStatus(operation.id, "completed")
              get().removeOperation(operation.id)
            } catch (error) {
              console.error(`Failed to sync operation ${operation.id}:`, error)
              get().updateOperationStatus(operation.id, "failed")

              // Remove if too many retries (5)
              if (operation.retries >= 5) {
                get().removeOperation(operation.id)
              }
            }
          }

          set((state) => {
            state.lastSyncTime = Date.now()
          })
        } finally {
          set((state) => {
            state.isSyncing = false
          })
        }
      },

      initialize: async () => {
        // If online, try to sync immediately
        if (await offlineManager.isOnline()) {
          get().syncAll()
        }

        // Set up network listener
        offlineManager.initialize().then(() => {
          // When coming back online, try to sync
          if (offlineManager.isOnline()) {
            get().syncAll()
          }
        })
      },
    })),
    {
      name: "supabase-sync-storage",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = storage.getString(name)
          return value ? Promise.resolve(JSON.parse(value)) : Promise.resolve(null)
        },
        setItem: (name, value) => {
          storage.set(name, JSON.stringify(value))
          return Promise.resolve()
        },
        removeItem: (name) => {
          storage.delete(name)
          return Promise.resolve()
        },
      })),
    },
  ),
)

// Helper functions for common sync operations
export const supabaseSync = {
  // Initialize sync
  initialize: async () => {
    await useSyncStore.getState().initialize()
  },

  // Add operation
  addOperation: (table: string, operation: "insert" | "update" | "delete", data: any) => {
    return useSyncStore.getState().addOperation(table, operation, data)
  },

  // Sync all
  syncAll: async () => {
    await useSyncStore.getState().syncAll()
  },

  // Get pending operations count
  getPendingCount: () => {
    return useSyncStore.getState().operations.filter((op) => op.status !== "completed").length
  },

  // Get last sync time
  getLastSyncTime: () => {
    return useSyncStore.getState().lastSyncTime
  },

  // Check if syncing
  isSyncing: () => {
    return useSyncStore.getState().isSyncing
  },
}
