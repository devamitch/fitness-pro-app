"use client"

import { useState, useEffect } from "react"
import NetInfo from "@react-native-community/netinfo"
import { offlineManager } from "@/utils/offlineManager"

export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(true)
  const [isPendingSync, setIsPendingSync] = useState(false)

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable
      setIsOnline(!!online)

      // If we're coming back online, trigger sync
      if (online && !isOnline) {
        syncOfflineData()
      }
    })

    // Check if we have pending operations
    checkPendingOperations()

    return () => {
      unsubscribe()
    }
  }, [isOnline])

  const checkPendingOperations = async () => {
    const hasPending = await offlineManager.hasPendingOperations()
    setIsPendingSync(hasPending)
  }

  const syncOfflineData = async () => {
    if (isOnline) {
      setIsPendingSync(true)
      try {
        await offlineManager.syncOfflineData()
      } catch (error) {
        console.error("Error syncing offline data:", error)
      } finally {
        setIsPendingSync(false)
      }
    }
  }

  const saveOfflineOperation = async (operation: string, data: any) => {
    await offlineManager.saveOperation(operation, data)
    setIsPendingSync(true)

    // Try to sync immediately if online
    if (isOnline) {
      syncOfflineData()
    }
  }

  return {
    isOnline,
    isPendingSync,
    syncOfflineData,
    saveOfflineOperation,
  }
}
