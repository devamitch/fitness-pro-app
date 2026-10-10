"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/services/supabase"
import { useAuthStore } from "@/stores/authStore"
import { healthConnect } from "@/services/healthConnect"

export interface HealthMetric {
  id: string
  date: string
  type: "weight" | "steps" | "heartRate" | "sleep" | "water" | "calories"
  value: number
  unit: string
  source: "manual" | "healthConnect" | "appleHealth"
  notes?: string
}

export function useHealthMetrics() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isHealthConnected, setIsHealthConnected] = useState(false)
  const { user } = useAuthStore()

  // Check health connection status on mount
  useEffect(() => {
    checkHealthConnection()
  }, [])

  // Fetch metrics when user changes
  useEffect(() => {
    if (user) {
      fetchMetrics()
    } else {
      setMetrics([])
    }
  }, [user])

  const checkHealthConnection = async () => {
    try {
      const isConnected = await healthConnect.isConnected()
      setIsHealthConnected(isConnected)
    } catch (err) {
      console.error("Error checking health connection:", err)
      setIsHealthConnected(false)
    }
  }

  const connectHealth = async () => {
    try {
      setIsLoading(true)
      const result = await healthConnect.connect()
      setIsHealthConnected(result)

      if (result) {
        // Sync data after successful connection
        await syncHealthData()
      }

      return result
    } catch (err) {
      console.error("Error connecting to health service:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const syncHealthData = async () => {
    if (!user || !isHealthConnected) return false

    try {
      setIsLoading(true)

      // Get data from health service
      const healthData = await healthConnect.fetchLatestData()

      // Save to database
      if (healthData.length > 0) {
        const { error: saveError } = await supabase.from("health_metrics").upsert(
          healthData.map((item) => ({
            ...item,
            user_id: user.id,
            source: healthConnect.getSourceName(),
          })),
        )

        if (saveError) throw saveError

        // Refresh metrics
        await fetchMetrics()
      }

      return true
    } catch (err) {
      console.error("Error syncing health data:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMetrics = async (type?: HealthMetric["type"], limit = 100) => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(limit)

      if (type) {
        query = query.eq("type", type)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setMetrics(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch health metrics"))
      console.error("Error fetching health metrics:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const saveMetric = async (metric: Omit<HealthMetric, "id" | "source">) => {
    if (!user) return null

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: saveError } = await supabase
        .from("health_metrics")
        .insert([{ ...metric, user_id: user.id, source: "manual" }])
        .select()

      if (saveError) throw saveError

      setMetrics((prev) => [...(data || []), ...prev])
      return data?.[0] || null
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to save health metric"))
      console.error("Error saving health metric:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMetric = async (id: string) => {
    if (!user) return false

    try {
      setIsLoading(true)
      setError(null)

      const { error: deleteError } = await supabase.from("health_metrics").delete().eq("id", id).eq("user_id", user.id)

      if (deleteError) throw deleteError

      setMetrics((prev) => prev.filter((metric) => metric.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to delete health metric"))
      console.error("Error deleting health metric:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    metrics,
    isLoading,
    error,
    isHealthConnected,
    fetchMetrics,
    saveMetric,
    deleteMetric,
    connectHealth,
    syncHealthData,
  }
}
