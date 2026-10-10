"use client"

import { useEffect } from "react"
import { Linking } from "react-native"
import { handleDeepLink } from "./advancedNavigationUtilities"

interface DeepLinkHandlerProps {
  enabled?: boolean
}

export const DeepLinkHandler = ({ enabled = true }: DeepLinkHandlerProps) => {
  useEffect(() => {
    if (!enabled) return

    // Handle deep links when the app is already open
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url)
    })

    // Handle deep links that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url)
      }
    })

    return () => {
      subscription.remove()
    }
  }, [enabled])

  // This component doesn't render anything
  return null
}
