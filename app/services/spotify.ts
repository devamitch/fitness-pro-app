import { useAuthStore } from "@/stores/authStore"
import { storage } from "@/utils/storage"
import { Platform } from "react-native"
import { supabase } from "./supabase"

// Define types for Spotify tracks
export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  album: string
  duration: number
  uri: string
  imageUrl: string
}

// Define types for Spotify playlists
export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  trackCount: number
  imageUrl: string
  uri: string
}

class SpotifyService {
  private isInitialized = false
  private isConnected = false
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private expiresAt = 0

  private CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ''
  private REDIRECT_URI = Platform.select({
    ios: 'fitnessapp://spotify-auth',
    android: 'fitnessapp://spotify-auth',
    default: 'fitnessapp://spotify-auth'
  })

  constructor() {
    // Load saved tokens
    this.loadTokens()
  }

  // Load saved tokens
  private loadTokens(): void {
    const accessToken = storage.getString('spotify_access_token')
    const refreshToken = storage.getString('spotify_refresh_token')
    const expiresAt = storage.getString('spotify_expires_at')

    if (accessToken) this.accessToken = accessToken
    if (refreshToken) this.refreshToken = refreshToken
    if (expiresAt) this.expiresAt = Number.parseInt(expiresAt, 10)

    this.isConnected = !!this.accessToken && Date.now() < this.expiresAt
  }

  // Save tokens
  private saveTokens(): void {
    if (this.accessToken) storage.set('spotify_access_token', this.accessToken)
    if (this.refreshToken) storage.set('spotify_refresh_token', this.refreshToken)
    if (this.expiresAt) storage.set('spotify_expires_at', this.expiresAt.toString())
  }

  // Initialize Spotify
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true
    }

    try {
      // Check if tokens need refresh
      if (this.isConnected && Date.now() > this.expiresAt - 300000) { // Refresh if less than 5 minutes left
        await this.refreshAccessToken()
      }

      this.isInitialized = true
      return true
    } catch (error) {
      console.error('Error initializing Spotify:', error)
      return false
    }
  }

  // Get auth URL for connecting to Spotify
  getAuthUrl(): string {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing'
    ]

    const url = `https://accounts.spotify.com/authorize?client_id=${this.CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(' '))}`

    return url
  }

  // Handle auth callback
  async handleAuthCallback(code: string): Promise<boolean> {
    try {
      // In a real implementation, we would exchange the code for tokens
      // For this example, we'll simulate a successful auth

      this.accessToken = `mock_access_token_${Date.now()}`
      this.refreshToken = `mock_refresh_token_${Date.now()}`
      this.expiresAt = Date.now() + 3600000 // 1 hour

      this.saveTokens()
      this.isConnected = true

      // Save connection to server
      await this.saveConnectionToServer()

      return true
    } catch (error) {
      console.error('Error handling Spotify auth callback:', error)
      return false
    }
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<boolean> {
    try {
      if (!this.refreshToken) {
        return false
      }

      // In a real implementation, we would refresh the token
      // For this example, we'll simulate a successful refresh

      this.accessToken = `mock_access_token_${Date.now()}`
      this.expiresAt = Date.now() + 3600000 // 1 hour

      this.saveTokens()
      this.isConnected = true

      return true
    } catch (error) {
      console.error('Error refreshing Spotify access token:', error)
      this.isConnected = false
      return false
    }
  }

  // Save connection to server
  private async saveConnectionToServer(): Promise<boolean> {
    try {
      const user = useAuthStore.getState().user

      if (!user) {
        return false
      }

      const { error } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: user.id,
          integration_type: 'spotify',
          is_connected: true,
          connected_at: new Date().toISOString(),
          metadata: {
            refresh_token_exists: !!this.refreshToken
          }
        })

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error saving Spotify connection to server:', error)
      return false
    }
  }

  // Check if connected to Spotify
  isSpotifyConnected(): boolean {
    return this.isConnected
  }

  // Disconnect from Spotify
  async disconnect(): Promise<boolean> {
    try {
      this.accessToken = null
      this.refreshToken = null
      this.expiresAt = 0
      this.isConnected = false

      storage.delete('spotify_access_token')
      storage.delete('spotify_refresh_token')
      storage.delete('spotify_expires_at')

      // Update server
      const user = useAuthStore.getState().user

      if (user) {
        await supabase
          .from('user_integrations')
          .update({
            is_connected: false,
            disconnected_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('integration_type', 'spotify')
      }

      return true
    } catch (error) {
      console.error('Error disconnecting from Spotify:', error)
      return false
    }
  }

  // Get workout playlists
  async getWorkoutPlaylists(): Promise<SpotifyPlaylist[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Spotify')
    }

    try {
      // In a real implementation, we would fetch from Spotify API
      // For this example, we'll return mock data

      return [
        {
          id: 'playlist1',
          name: 'High Intensity Workout',
          description: 'Energetic tracks to power through your HIIT session',
          trackCount: 25,
          imageUrl: 'https://i.scdn.co/image/ab67706c0000da84fcb8b92f2615d3261b8eb146',
          uri: 'spotify:playlist:mock1'
        },
        {
          id: 'playlist2',
          name: 'Cardio Boost',
          description: 'Perfect for running, cycling, or any cardio workout',
          trackCount: 30,
          imageUrl: 'https://i.scdn.co/image/ab67706c0000da8465a5a4edb0fd3bf96e62d212',
          uri: 'spotify:playlist:mock2'
        },
        {
          id: 'playlist3',
          name: 'Strength Training',
          description: 'Heavy beats for lifting heavy weights',
          trackCount: 20,
          imageUrl: 'https://i.scdn.co/image/ab67706c0000da84b436b5879f7dbca408c9e5c0',
          uri: 'spotify:playlist:mock3'
        },
        {
          id: 'playlist4',
          name: 'Yoga & Stretching',
          description: 'Calm and focused music for yoga sessions',
          trackCount: 15,\
          imageUrl: 'https://i.scdn.co/image/ab67706c0000da84e1c0c62d5dc55fe05b1f
