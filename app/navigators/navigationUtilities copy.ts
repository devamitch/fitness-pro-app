"use client"

import { createNavigationContainerRef } from "@react-navigation/native"
import { BackHandler, Linking, Platform } from "react-native"
import { useEffect, useRef, useState } from "react"
import type { RootStackParamList } from "./types"

// Create a navigation ref that can be used outside of the navigator context
export const navigationRef = createNavigationContainerRef<RootStackParamList>()

/**
 * Hook that handles Android back button presses
 */
export function useBackButtonHandler(canExit: (routeName: string) => boolean) {
  const canExitRef = useRef(Platform.OS !== "android" ? () => false : canExit)

  useEffect(() => {
    canExitRef.current = canExit
  }, [canExit])

  useEffect(() => {
    const onBackPress = () => {
      if (!navigationRef.isReady()) return false

      const routeName = getActiveRouteName(navigationRef.getRootState())

      if (canExitRef.current(routeName)) {
        BackHandler.exitApp()
        return true
      }

      if (navigationRef.canGoBack()) {
        navigationRef.goBack()
        return true
      }

      return false
    }

    BackHandler.addEventListener("hardwareBackPress", onBackPress)
    return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress)
  }, [])
}

/**
 * Custom hook for persisting navigation state
 */
export function useNavigationPersistence(storage: typeof import("../utils/storage"), persistenceKey: string) {
  const [initialNavigationState, setInitialNavigationState] = useState()
  const [isRestored, setIsRestored] = useState(false)
  const routeNameRef = useRef<string>()

  const onNavigationStateChange = (state: any) => {
    const previousRouteName = routeNameRef.current
    if (state) {
      const currentRouteName = getActiveRouteName(state)

      if (previousRouteName !== currentRouteName) {
        // Track screens (analytics, etc)
        if (__DEV__) {
          console.log(currentRouteName)
        }
      }

      routeNameRef.current = currentRouteName
      storage.save(persistenceKey, state)
    }
  }

  const restoreState = async () => {
    try {
      const initialUrl = await Linking.getInitialURL()

      if (!initialUrl) {
        const state = await storage.load(persistenceKey)
        if (state) setInitialNavigationState(state)
      }
    } finally {
      setIsRestored(true)
    }
  }

  useEffect(() => {
    if (!isRestored) restoreState()
  }, [isRestored])

  return { onNavigationStateChange, restoreState, isRestored, initialNavigationState }
}

// Navigation without the navigation prop
export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never)
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack()
  }
}

export function resetRoot(state = { index: 0, routes: [] }) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot(state)
  }
}

function getActiveRouteName(state: any): string | undefined {
  const route = state?.routes[state?.index]

  if (route?.state) {
    // Dive into nested navigators
    return getActiveRouteName(route.state)
  }

  return route?.name
}

declare const __DEV__: boolean
