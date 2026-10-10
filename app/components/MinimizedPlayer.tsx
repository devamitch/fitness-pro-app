"use client"

import { IMAGES } from "@/assets/images"
import * as Haptics from "expo-haptics"
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react-native"
import type React from "react"
import { useEffect } from "react"
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useSpotifyStore } from "../services/spotify"
import { useTheme } from "../theme/theme"
import { GlassMorphicCard } from "./GlassMorphicCard"
import { Text } from "./Text"

const { width } = Dimensions.get("window")

interface MinimizedPlayerProps {
  isVisible: boolean
  onClose: () => void
  onExpand: () => void
}

export const MinimizedPlayer: React.FC<MinimizedPlayerProps> = ({
  isVisible,
  onClose,
  onExpand,
}) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { isConnected, isPlaying, currentTrack, togglePlay, skipNext, skipPrevious } =
    useSpotifyStore()

  // Animation values
  const translateY = useSharedValue(100)
  const scale = useSharedValue(0.9)
  const opacity = useSharedValue(0)
  const progressWidth = useSharedValue(0)

  // Update animation values when visibility changes
  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      })
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      })
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      })
    } else {
      translateY.value = withSpring(100, {
        damping: 15,
        stiffness: 150,
      })
      scale.value = withSpring(0.9, {
        damping: 15,
        stiffness: 150,
      })
      opacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      })
    }
  }, [isVisible])

  // Update progress bar
  useEffect(() => {
    if (currentTrack && isPlaying) {
      const interval = setInterval(() => {
        progressWidth.value = withTiming(
          Math.min((currentTrack.playbackPosition / currentTrack.duration) * 100, 100),
          {
            duration: 1000,
          },
        )
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [currentTrack, isPlaying])

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      opacity: opacity.value,
    }
  })

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    }
  })

  // Handle play/pause
  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    togglePlay()
  }

  // Handle next track
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    skipNext()
  }

  // Handle previous track
  const handlePrevious = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    skipPrevious()
  }

  // Handle close
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onClose()
  }

  if (!isConnected || !currentTrack) return null

  return (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        { bottom: insets.bottom ? insets.bottom + 10 : 20 },
      ]}
    >
      <GlassMorphicCard style={styles.playerCard}>
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[styles.progressBar, { backgroundColor: theme.colors.primary }, progressStyle]}
          />
        </View>

        <TouchableOpacity style={styles.content} onPress={onExpand}>
          {/* Album art */}
          <Image
            source={currentTrack.imageUri ? { uri: currentTrack.imageUri } : IMAGES.logo}
            style={styles.albumArt}
          />

          {/* Track info */}
          <View style={styles.trackInfo}>
            <Text variant="subtitle" numberOfLines={1} style={styles.trackName}>
              {currentTrack.name}
            </Text>
            <Text variant="caption" numberOfLines={1} style={styles.artistName}>
              {currentTrack.artist.name}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={handlePrevious}>
              <SkipBack size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
              {isPlaying ? (
                <Pause size={20} color={theme.colors.text.inverse} />
              ) : (
                <Play size={20} color={theme.colors.text.inverse} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleNext}>
              <SkipForward size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={16} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      </GlassMorphicCard>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  albumArt: {
    borderRadius: 8,
    height: 40,
    width: 40,
  },
  artistName: {
    fontSize: 12,
    opacity: 0.7,
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    marginLeft: 8,
    width: 24,
  },
  container: {
    left: 20,
    position: "absolute",
    right: 20,
    zIndex: 1000,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    padding: 12,
  },
  controlButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
  },
  playButton: {
    alignItems: "center",
    backgroundColor: "#0A84FF",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginHorizontal: 8,
    width: 36,
  },
  playerCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
  progressContainer: {
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    height: 2,
    width: "100%",
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackName: {
    fontSize: 14,
  },
})
