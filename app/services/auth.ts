import * as AppleAuthentication from "expo-apple-authentication"
import * as WebBrowser from "expo-web-browser"
import { useAuthStore } from "../stores/authStore"
import { supabase } from "./api"

// Initialize WebBrowser for Google Auth
WebBrowser.maybeCompleteAuthSession()

// Google Auth config
const googleClientId = {
  ios: "YOUR_IOS_CLIENT_ID",
  android: "YOUR_ANDROID_CLIENT_ID",
  web: "YOUR_WEB_CLIENT_ID",
}

// Social authentication service
export const socialAuth = {
  // Sign in with Apple
  signInWithApple: async () => {
    try {
      if (!AppleAuthentication.isAvailableAsync()) {
        throw new Error("Apple authentication is not available on this device")
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        })

        if (error) throw error

        // Update user in store
        if (data.user) {
          useAuthStore.getState().setUser({
            id: data.user.id,
            email: data.user.email || "",
            username: data.user.user_metadata.full_name || data.user.email?.split("@")[0] || "",
            avatarUrl: data.user.user_metadata.avatar_url,
          })
          useAuthStore.getState().setToken(data.session?.access_token || null)
        }

        return data
      } else {
        throw new Error("No identity token returned from Apple")
      }
    } catch (error) {
      console.error("Error signing in with Apple:", error)
      throw error
    }
  },

  // Sign in with Google
  useGoogleAuth: () => {
    // const [request, response, promptAsync] = Google.useAuthRequest({
    //   clientId: Platform.select(googleClientId),
    //   scopes: ["profile", "email"],
    // })

    const signInWithGoogle = async () => {
      try {
        // const result = await promptAsync()
        // if (result.type === "success") {
        //   const { authentication } = result
        //   if (authentication?.accessToken) {
        //     const { data, error } = await supabase.auth.signInWithOAuth({
        //       provider: "google",
        //       options: {
        //         queryParams: {
        //           access_token: authentication.accessToken,
        //         },
        //       },
        //     })
        //     if (error) throw error
        //     // Update user in store
        //     if (data.user) {
        //       useAuthStore.getState().setUser({
        //         id: data.user.id,
        //         email: data.user.email || "",
        //         username: data.user.user_metadata.full_name || data.user.email?.split("@")[0] || "",
        //         avatarUrl: data.user.user_metadata.avatar_url,
        //       })
        //       useAuthStore.getState().setToken(data.session?.access_token || null)
        //     }
        //     return data
        //   } else {
        //     throw new Error("No access token returned from Google")
        //   }
        // } else {
        //   throw new Error("Google authentication was cancelled or failed")
        // }
      } catch (error) {
        console.error("Error signing in with Google:", error)
        throw error
      }
    }

    return {
      // request,
      // response,
      signInWithGoogle,
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear user in store
      useAuthStore.getState().signOut()
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  },
}
