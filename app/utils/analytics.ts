/* eslint-disable import/namespace */
import { supabase } from "@/services/supabase"
import { useAuthStore } from "@/stores/authStore"
import { Platform } from "react-native"
import { mmkv } from "../../utils/mmkv"

// Define event types for type safety
export type AnalyticsEvent =
  | "app_open"
  | "app_close"
  | "screen_view"
  | "workout_started"
  | "workout_completed"
  | "exercise_started"
  | "exercise_completed"
  | "user_login"
  | "user_signup"
  | "user_logout"
  | "subscription_viewed"
  | "subscription_purchased"
  | "feature_used"
  | "error_occurred"
  | "notification_received"
  | "notification_opened"
  | "search_performed"
  | "content_shared"
  | "settings_changed"

// Queue for offline events
const EVENTS_QUEUE_KEY = "analytics_events_queue"

class Analytics {
  private isInitialized = false
  private sessionId = ""
  private appVersion = process.env.APP_VERSION || "1.0.0"
  private deviceInfo = {
    platform: Platform.OS,
    version: Platform.Version,
    isTablet: Platform.isTV || false,
  }

  // Initialize analytics
  initialize() {
    if (this.isInitialized) return

    // Generate session ID
    this.sessionId = Date.now().toString()

    // Track app open
    this.trackEvent("app_open")

    this.isInitialized = true

    // Try to send any queued events
    this.sendQueuedEvents()
  }

  // Track an event
  trackEvent(event: AnalyticsEvent, properties: Record<string, any> = {}) {
    if (!this.isInitialized) {
      this.initialize()
    }

    const user = useAuthStore.getState().user

    const eventData = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: user?.id || "anonymous",
      app_version: this.appVersion,
      device: this.deviceInfo,
    }

    // Try to send immediately if possible
    this.sendEvent(eventData).catch(() => {
      // If sending fails, queue for later
      this.queueEvent(eventData)
    })
  }

  // Track screen view
  trackScreen(screenName: string, properties: Record<string, any> = {}) {
    this.trackEvent("screen_view", {
      screen_name: screenName,
      ...properties,
    })
  }

  // Send event to analytics backend
  private async sendEvent(eventData: any): Promise<boolean> {
    try {
      const { error } = await supabase.from("analytics_events").insert([eventData])

      if (error) throw error

      return true
    } catch (error) {
      console.error("Failed to send analytics event:", error)
      return false
    }
  }

  // Queue event for later sending
  private queueEvent(eventData: any) {
    try {
      const queuedEvents = this.getQueuedEvents()
      queuedEvents.push(eventData)

      // Store back in MMKV
      mmkv.set(EVENTS_QUEUE_KEY, JSON.stringify(queuedEvents))
    } catch (error) {
      console.error("Failed to queue analytics event:", error)
    }
  }

  // Get queued events
  private getQueuedEvents(): any[] {
    try {
      const queuedEventsJson = mmkv.getString(EVENTS_QUEUE_KEY)
      if (!queuedEventsJson) return []

      return JSON.parse(queuedEventsJson)
    } catch (error) {
      console.error("Failed to get queued analytics events:", error)
      return []
    }
  }

  // Send queued events
  async sendQueuedEvents(): Promise<{ sent: number; failed: number }> {
    const queuedEvents = this.getQueuedEvents()
    if (queuedEvents.length === 0) return { sent: 0, failed: 0 }

    let sent = 0
    let failed = 0

    // Try to send each event
    for (const event of queuedEvents) {
      const success = await this.sendEvent(event)
      if (success) {
        sent++
      } else {
        failed++
      }
    }

    // Remove sent events from queue
    if (sent > 0) {
      const remainingEvents = queuedEvents.slice(sent)
      mmkv.set(EVENTS_QUEUE_KEY, JSON.stringify(remainingEvents))
    }

    return { sent, failed }
  }
}

export const analytics = new Analytics()
