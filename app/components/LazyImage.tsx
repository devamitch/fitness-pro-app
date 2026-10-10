"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Image,
  View,
  StyleSheet,
  ActivityIndicator,
  type ImageProps,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { BlurView } from "expo-blur"
import * as FileSystem from "expo-file-system"
import { cacheManager } from "../utils/cacheManager"
import { useTheme } from "../theme/theme"

interface LazyImageProps extends Omit<ImageProps, "source"> {
  source: { uri: string } | number
  placeholderColor?: string
  thumbnailSource?: { uri: string } | number
  containerStyle?: StyleProp<ViewStyle>
  showLoader?: boolean
  blurRadius?: number
}

export const LazyImage: React.FC<LazyImageProps> = ({
  source,
  placeholderColor,
  thumbnailSource,
  containerStyle,
  showLoader = true,
  blurRadius = 5,
  style,
  ...props
}) => {
  const theme = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [imageSource, setImageSource] = useState<{ uri: string } | number | null>(null)
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true
    const loadImage = async () => {
      try {
        // Handle number sources (local images) directly
        if (typeof source === "number") {
          if (isMounted) {
            setImageSource(source)
            setIsLoading(false)
          }
          return
        }

        const { uri } = source
        if (!uri) return

        // Generate cache key from URI
        const cacheKey = `image_${uri.replace(/[^a-zA-Z0-9]/g, "_")}`

        // Try to get from cache first
        const cachedImage = await cacheManager.get<string>(cacheKey)
        if (cachedImage && isMounted) {
          setImageSource({ uri: cachedImage })
          setIsLoading(false)
          return
        }

        // Download and cache the image
        const fileExt = uri.substring(uri.lastIndexOf(".") + 1) || "jpg"
        const filePath = `${FileSystem.cacheDirectory}${cacheKey}.${fileExt}`

        const fileInfo = await FileSystem.getInfoAsync(filePath)
        if (fileInfo.exists) {
          // Use cached file
          if (isMounted) {
            setImageSource({ uri: fileInfo.uri })
            setIsLoading(false)
          }
          // Update cache
          await cacheManager.set(cacheKey, fileInfo.uri)
        } else {
          // Download file
          const downloadResult = await FileSystem.downloadAsync(uri, filePath)
          if (downloadResult.status === 200 && isMounted) {
            setImageSource({ uri: downloadResult.uri })
            setIsLoading(false)
            // Update cache
            await cacheManager.set(cacheKey, downloadResult.uri)
          }
        }
      } catch (error) {
        console.error("Error loading image:", error)
        // Fallback to original source on error
        if (isMounted) {
          setImageSource(typeof source === "number" ? source : { uri: source.uri })
          setIsLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      isMounted = false
    }
  }, [source])

  const renderPlaceholder = () => {
    if (thumbnailSource && !thumbnailLoaded) {
      return (
        <View style={[StyleSheet.absoluteFill, styles.thumbnailContainer]}>
          <Image
            source={thumbnailSource}
            style={[StyleSheet.absoluteFill, styles.thumbnail]}
            blurRadius={blurRadius}
            onLoad={() => setThumbnailLoaded(true)}
          />
          <BlurView intensity={25} style={StyleSheet.absoluteFill} />
          {showLoader && <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />}
        </View>
      )
    }

    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.placeholder,
          { backgroundColor: placeholderColor || theme.colors.background.tertiary },
        ]}
      >
        {showLoader && <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />}
      </View>
    )
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {isLoading && renderPlaceholder()}
      {imageSource && (
        <Image source={imageSource} style={[styles.image, style]} onLoad={() => setIsLoading(false)} {...props} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnail: {
    resizeMode: "cover",
  },
  loader: {
    position: "absolute",
  },
})
