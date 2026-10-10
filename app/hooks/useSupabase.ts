"use client"

import { supabase } from "@/services/supabase"
import { useAuthStore } from "@/stores/authStore"
import { useEffect, useState } from "react"

export function useSupabase() {
  const { user, setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    async function getInitialSession() {
      try {
        setIsLoading(true)

        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (session?.user) {
          setUser(session?.user)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error occurred"))
        console.error("Error getting initial session:", err)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    })

    // Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    supabase,
    user,
    isLoading,
    error,
  }
}
