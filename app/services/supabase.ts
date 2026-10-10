import type { Database } from "@/types/supabase"
import { storage } from "@/utils/storage"
import { createClient } from "@supabase/supabase-js"
import "react-native-url-polyfill/auto"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { offlineManager } from "../utils/offlineManager"
import { supabaseSync } from "./supabaseSync"

// Create a custom storage adapter using MMKV
const MMKVStorageAdapter = {
  getItem: (key: string) => {
    const value = storage.getString(key)
    return value === undefined ? null : value
  },
  setItem: (key: string, value: string) => {
    storage.set(key, value)
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: MMKVStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Initialize Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: MMKVStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Define Supabase state
interface SupabaseState {
  isInitialized: boolean
  isOnline: boolean
  pendingSyncCount: number
  lastSyncTime: number | null

  // Methods
  initialize: () => Promise<void>
  syncData: () => Promise<void>
  getPendingSyncCount: () => number
  getLastSyncTime: () => number | null

  // Database operations with offline support
  insert: <T extends Record<string, any>>(
    table: string,
    data: T,
    options?: { onSuccess?: () => void; onError?: (error: any) => void },
  ) => Promise<{ error: any; data: T | null }>

  update: <T extends Record<string, any>>(
    table: string,
    column: string,
    value: any,
    updates: Partial<T>,
    options?: { onSuccess?: () => void; onError?: (error: any) => void },
  ) => Promise<{ error: any; data: T | null }>

  delete: (
    table: string,
    column: string,
    value: any,
    options?: { onSuccess?: () => void; onError?: (error: any) => void },
  ) => Promise<{ error: any }>

  fetch: <T>(
    table: string,
    query?: {
      column?: string
      value?: any
      limit?: number
      order?: { column: string; ascending?: boolean }
    },
    options?: { forceRefresh?: boolean; cacheTTL?: number },
  ) => Promise<{ data: T[] | null; error: any }>
}

// Create Supabase store
export const useSupabaseStore = create<SupabaseState>()(
  persist(
    immer((set, get) => ({
      isInitialized: false,
      isOnline: true,
      pendingSyncCount: 0,
      lastSyncTime: null,

      initialize: async () => {
        try {
          // Initialize offline manager
          await offlineManager.initialize()

          // Initialize supabase sync
          await supabaseSync.initialize()

          // Set online status
          const isOnline = await offlineManager.isOnline()

          set((state) => {
            state.isInitialized = true
            state.isOnline = isOnline
            state.pendingSyncCount = supabaseSync.getPendingCount()
            state.lastSyncTime = supabaseSync.getLastSyncTime()
          })

          // If online, try to sync data
          if (isOnline) {
            get().syncData()
          }
        } catch (error) {
          console.error("Failed to initialize Supabase store:", error)
        }
      },

      syncData: async () => {
        try {
          await supabaseSync.syncAll()

          set((state) => {
            state.pendingSyncCount = supabaseSync.getPendingCount()
            state.lastSyncTime = supabaseSync.getLastSyncTime()
          })
        } catch (error) {
          console.error("Failed to sync data:", error)
        }
      },

      getPendingSyncCount: () => {
        return supabaseSync.getPendingCount()
      },

      getLastSyncTime: () => {
        return supabaseSync.getLastSyncTime()
      },

      insert: async <T extends Record<string, any>>(
        table: string,
        data: T,
        options?: { onSuccess?: () => void; onError?: (error: any) => void },
      ) => {
        try {
          // Check if online
          const isOnline = await offlineManager.isOnline()

          if (isOnline) {
            // Online - insert directly
            const { data: result, error } = await supabase.from(table).insert(data).select()

            if (error) {
              options?.onError?.(error)
              return { error, data: null }
            }

            options?.onSuccess?.()
            return { error: null, data: (result?.[0] as T) || null }
          } else {
            // Offline - add to sync queue
            supabaseSync.addOperation(table, "insert", data)

            set((state) => {
              state.pendingSyncCount = supabaseSync.getPendingCount()
            })

            options?.onSuccess?.()
            return { error: null, data }
          }
        } catch (error) {
          options?.onError?.(error)
          return { error, data: null }
        }
      },

      update: async <T extends Record<string, any>>(
        table: string,
        column: string,
        value: any,
        updates: Partial<T>,
        options?: { onSuccess?: () => void; onError?: (error: any) => void },
      ) => {
        try {
          // Check if online
          const isOnline = await offlineManager.isOnline()

          if (isOnline) {
            // Online - update directly
            const { data: result, error } = await supabase
              .from(table)
              .update(updates)
              .eq(column, value)
              .select()

            if (error) {
              options?.onError?.(error)
              return { error, data: null }
            }

            options?.onSuccess?.()
            return { error: null, data: (result?.[0] as T) || null }
          } else {
            // Offline - add to sync queue
            supabaseSync.addOperation(table, "update", {
              column,
              value,
              updates,
            })

            set((state) => {
              state.pendingSyncCount = supabaseSync.getPendingCount()
            })

            options?.onSuccess?.()
            return { error: null, data: { [column]: value, ...updates } as T }
          }
        } catch (error) {
          options?.onError?.(error)
          return { error, data: null }
        }
      },

      delete: async (
        table: string,
        column: string,
        value: any,
        options?: { onSuccess?: () => void; onError?: (error: any) => void },
      ) => {
        try {
          // Check if online
          const isOnline = await offlineManager.isOnline()

          if (isOnline) {
            // Online - delete directly
            const { error } = await supabase.from(table).delete().eq(column, value)

            if (error) {
              options?.onError?.(error)
              return { error }
            }

            options?.onSuccess?.()
            return { error: null }
          } else {
            // Offline - add to sync queue
            supabaseSync.addOperation(table, "delete", {
              column,
              value,
            })

            set((state) => {
              state.pendingSyncCount = supabaseSync.getPendingCount()
            })

            options?.onSuccess?.()
            return { error: null }
          }
        } catch (error) {
          options?.onError?.(error)
          return { error }
        }
      },

      fetch: async (
        table: string,
        query?: {
          column?: string
          value?: any
          limit?: number
          order?: { column: string; ascending?: boolean }
        },
        options?: {
          forceRefresh?: boolean
          cacheTTL?: number
        },
      ) => {
        try {
          const cacheKey = `${table}_${JSON.stringify(query || {})}`

          // Try to get from cache first (unless force refresh)
          const forceRefresh = options?.forceRefresh
          const cacheTTL = options?.cacheTTL

          if (!forceRefresh) {
            const cached = storage.getString(cacheKey)
            if (cached) {
              const { data, timestamp } = JSON.parse(cached)

              // Check if cache is still valid
              const now = Date.now()
              const cacheTTLValue = cacheTTL || 5 * 60 * 1000 // 5 minutes default

              if (now - timestamp < cacheTTLValue) {
                return { data, error: null }
              }
            }
          }

          // Check if online
          const isOnline = await offlineManager.isOnline()

          if (!isOnline) {
            // Offline - return cached data if available
            const cached = storage.getString(cacheKey)
            if (cached) {
              const { data } = JSON.parse(cached)
              return { data, error: null }
            }

            return { data: null, error: new Error("Offline and no cached data available") }
          }

          // Online - fetch from Supabase
          let builder = supabase.from(table).select()

          if (query?.column && query?.value !== undefined) {
            builder = builder.eq(query.column, query.value)
          }

          if (query?.limit) {
            builder = builder.limit(query.limit)
          }

          if (query?.order) {
            const order = query.order
            const ascending = order.ascending ?? true
            builder = builder.order(order.column, {
              ascending: ascending,
            })
          }

          const { data, error } = await builder

          if (error) {
            return { data: null, error }
          }

          // Cache the result
          storage.set(
            cacheKey,
            JSON.stringify({
              data,
              timestamp: Date.now(),
            }),
          )

          return { data, error: null }
        } catch (error) {
          return { data: null, error }
        }
      },
    })),
    {
      name: "supabase-store",
      storage: createJSONStorage(() => MMKVStorageAdapter),
      partialize: (state) => ({
        lastSyncTime: state.lastSyncTime,
      }),
    },
  ),
)

// Helper functions for common Supabase operations
export const supabaseHelper = {
  // Fetch data with caching
  async fetchWithCache<T>(
    table: string,
    query: () => any,
    options?: {
      forceRefresh?: boolean
      cacheTTL?: number // in milliseconds
    },
  ): Promise<T[]> {
    const cacheKey = `supabase:${table}:${JSON.stringify(query)}`
    const forceRefresh = options?.forceRefresh
    const cacheTTL = options?.cacheTTL

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = storage.getString(cacheKey)
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData)
          // Check if cache is still valid
          if (Date.now() - timestamp < (cacheTTL || 0)) {
            return data as T[]
          }
        } catch (e) {
          console.error(`Error parsing cached data for ${cacheKey}:`, e)
        }
      }
    }

    // Fetch fresh data
    const { data, error } = await query()

    if (error) {
      throw error
    }

    // Cache the result
    storage.set(
      cacheKey,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    )

    return data as T[]
  },

  // Clear cache for a specific table
  clearTableCache(table: string): void {
    const prefix = `supabase:${table}:`
    const allKeys = storage.getAllKeys()

    allKeys.forEach((key) => {
      if (key.startsWith(prefix)) {
        storage.delete(key)
      }
    })
  },

  // Clear all Supabase cache
  clearAllCache(): void {
    const prefix = "supabase:"
    const allKeys = storage.getAllKeys()

    allKeys.forEach((key) => {
      if (key.startsWith(prefix)) {
        storage.delete(key)
      }
    })
  },

  // Initialize Supabase
  initialize: async () => {
    await useSupabaseStore.getState().initialize()
  },

  // Sync data
  syncData: async () => {
    await useSupabaseStore.getState().syncData()
  },

  // Insert data
  insert: async <T extends Record<string, any>>(
    table: string,
    data: T,
    options?: { onSuccess?: () => void; onError?: (error: any) => void },
  ) => {
    return await useSupabaseStore.getState().insert(table, data, options)
  },

  // Update data
  update: async <T extends Record<string, any>>(
    table: string,
    column: string,
    value: any,
    updates: Partial<T>,
    options?: { onSuccess?: () => void; onError?: (error: any) => void },
  ) => {
    return await useSupabaseStore.getState().update(table, column, value, updates, options)
  },

  // Delete data
  delete: async (
    table: string,
    column: string,
    value: any,
    options?: { onSuccess?: () => void; onError?: (error: any) => void },
  ) => {
    return await useSupabaseStore.getState().delete(table, column, value, options)
  },

  // Fetch data
  fetch: async <T>(
    table: string,
    query?: {
      column?: string
      value?: any
      limit?: number
      order?: { column: string; ascending?: boolean }
    },
    options?: {
      forceRefresh?: boolean
      cacheTTL?: number
    },
  ) => {
    return await useSupabaseStore.getState().fetch<T>(table, query, options)
  },
  // Get pending sync count
  getPendingSyncCount: () => {
    return useSupabaseStore.getState().getPendingSyncCount()
  },
  // Get last sync time
  getLastSyncTime: () => {
    return useSupabaseStore.getState().getLastSyncTime()
  },
  // Check if online
  isOnline: async () => {
    return await offlineManager.isOnline()
  },
}

// Auth functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  })

  if (error) throw error
  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabaseClient.auth.signOut()
  if (error) throw error
}

export const resetPassword = async (email: string) => {
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email)
  if (error) throw error
}

export const updatePassword = async (password: string) => {
  const { error } = await supabaseClient.auth.updateUser({
    password,
  })

  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data, error } = await supabaseClient.auth.getUser()
  if (error) throw error
  return data.user
}

export const getSession = async () => {
  const { data, error } = await supabaseClient.auth.getSession()
  if (error) throw error
  return data.session
}

// User profile functions
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) throw error
  return data
}

export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabaseClient
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export default supabaseClient
