import * as FileSystem from "expo-file-system"
import { Image } from "react-native"
import { storage } from "./storage"

interface CacheItem {
  key: string
  value: any
  timestamp: number
  expiry: number | null // null means no expiry
}

class CacheManager {
  private CACHE_PREFIX = "cache:"
  private IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory}images/`

  constructor() {
    // Ensure image cache directory exists
    this.ensureImageCacheDir()
  }

  // Set a value in cache with optional expiry time in milliseconds
  set(key: string, value: any, expiryMs?: number): void {
    const cacheKey = this.CACHE_PREFIX + key
    const item: CacheItem = {
      key,
      value,
      timestamp: Date.now(),
      expiry: expiryMs ? Date.now() + expiryMs : null,
    }

    storage.set(cacheKey, JSON.stringify(item))
  }

  // Get a value from cache
  get<T>(key: string, defaultValue?: T): T | undefined {
    const cacheKey = this.CACHE_PREFIX + key
    const itemJson = storage.getString(cacheKey)

    if (!itemJson) return defaultValue

    try {
      const item: CacheItem = JSON.parse(itemJson)

      // Check if expired
      if (item.expiry && Date.now() > item.expiry) {
        this.remove(key)
        return defaultValue
      }

      return item.value as T
    } catch (e) {
      console.error(`Error parsing cache item ${key}:`, e)
      return defaultValue
    }
  }

  // Remove an item from cache
  remove(key: string): void {
    const cacheKey = this.CACHE_PREFIX + key
    storage.delete(cacheKey)
  }

  // Clear all cached items
  clear(): void {
    const allKeys = storage.getAllKeys()
    const cacheKeys = allKeys.filter((key) => key.startsWith(this.CACHE_PREFIX))

    cacheKeys.forEach((key) => {
      storage.delete(key)
    })
  }

  // Clear expired items
  clearExpired(): void {
    const allKeys = storage.getAllKeys()
    const cacheKeys = allKeys.filter((key) => key.startsWith(this.CACHE_PREFIX))

    cacheKeys.forEach((key) => {
      const itemJson = storage.getString(key)
      if (!itemJson) return

      try {
        const item: CacheItem = JSON.parse(itemJson)
        if (item.expiry && Date.now() > item.expiry) {
          storage.delete(key)
        }
      } catch {
        // If we can't parse it, it's probably corrupted, so remove it
        storage.delete(key)
      }
    })
  }

  // Image caching methods
  private async ensureImageCacheDir(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.IMAGE_CACHE_DIR)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.IMAGE_CACHE_DIR, { intermediates: true })
      }
    } catch (e) {
      console.error("Failed to create image cache directory:", e)
    }
  }

  // Get cached image URI or download and cache
  async getCachedImageUri(url: string, expiryMs = 7 * 24 * 60 * 60 * 1000): Promise<string> {
    try {
      // Create a hash of the URL to use as filename
      const filename = this.hashUrl(url)
      const filePath = `${this.IMAGE_CACHE_DIR}${filename}`

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath)

      if (fileInfo.exists) {
        // Check if expired
        const metadata = this.get<{ timestamp: number }>(`image_meta:${filename}`)
        if (metadata && expiryMs && Date.now() - metadata.timestamp > expiryMs) {
          // Expired, download again
          return this.downloadImage(url, filePath, filename)
        }

        // Not expired, return cached path
        return filePath
      }

      // Not cached, download
      return this.downloadImage(url, filePath, filename)
    } catch (e) {
      console.error(`Error getting cached image for ${url}:`, e)
      return url // Fallback to original URL
    }
  }

  // Download and cache an image
  private async downloadImage(url: string, filePath: string, filename: string): Promise<string> {
    try {
      // Download the file
      const { uri } = await FileSystem.downloadAsync(url, filePath)

      // Save metadata
      this.set(`image_meta:${filename}`, { timestamp: Date.now() })

      // Preload image for better performance
      Image.prefetch(uri)

      return uri
    } catch (e) {
      console.error(`Error downloading image from ${url}:`, e)
      return url // Fallback to original URL
    }
  }

  // Clear image cache
  async clearImageCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.IMAGE_CACHE_DIR, { idempotent: true })
      await this.ensureImageCacheDir()

      // Clear metadata
      const allKeys = storage.getAllKeys()
      const imageMetaKeys = allKeys.filter((key) =>
        key.startsWith(this.CACHE_PREFIX + "image_meta:"),
      )
      imageMetaKeys.forEach((key) => storage.delete(key))
    } catch (e) {
      console.error("Error clearing image cache:", e)
    }
  }

  // Hash a URL to create a filename
  private hashUrl(url: string): string {
    let hash = 0
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `${Math.abs(hash)}.jpg`
  }
}

export const cacheManager = new CacheManager()
