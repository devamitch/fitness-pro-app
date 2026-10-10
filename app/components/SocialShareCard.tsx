"use client"

import { IMAGES } from "@/assets/images"
import { customFontsToLoad } from "@/config/fonts"
import {
  Canvas,
  Image,
  Path,
  Text as SkiaText,
  useFont,
  useImage,
} from "@shopify/react-native-skia"
import { BlurView } from "expo-blur"
import * as MediaLibrary from "expo-media-library"
import * as Sharing from "expo-sharing"
import { Copy, Download, Facebook, Instagram, Share2, Twitter, X } from "lucide-react-native"
import type React from "react"
import { useState } from "react"
import {
  Alert,
  Clipboard,
  Linking,
  Platform,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from "react-native-reanimated"
import { captureRef } from "react-native-view-shot"
import { useAuthStore } from "../stores/authStore"
import { useTheme } from "../theme/theme"
import { GlassMorphicCard } from "./GlassMorphicCard"
import { Text } from "./Text"

interface SocialShareCardProps {
  visible: boolean
  onClose: () => void
  title: string
  subtitle?: string
  imageUri?: string
  stats?: {
    label: string
    value: string
  }[]
  shareText?: string
  shareUrl?: string
}

export const SocialShareCard: React.FC<SocialShareCardProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  imageUri,
  stats,
  shareText,
  shareUrl,
}) => {
  const theme = useTheme()
  const { user } = useAuthStore()
  const [shareCardRef, setShareCardRef] = useState<View | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  // Load font and image for Skia
  const font = useFont(customFontsToLoad.montserratRegular)
  const boldFont = useFont(customFontsToLoad.interBold)
  const logoImage = useImage(IMAGES.logo)
  const backgroundImage = useImage(imageUri)

  // Handle share
  const handleShare = async () => {
    try {
      await Share.share({
        title: title,
        message: shareText || `Check out my ${title} on FitnessApp!`,
        url: shareUrl,
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  // Handle save image
  const handleSaveImage = async () => {
    if (!shareCardRef) return

    try {
      setIsGeneratingImage(true)

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to save images to your gallery.",
        )
        setIsGeneratingImage(false)
        return
      }

      // Capture view as image
      const uri = await captureRef(shareCardRef, {
        format: "png",
        quality: 1,
      })

      // Save to gallery
      await MediaLibrary.saveToLibraryAsync(uri)

      Alert.alert("Success", "Image saved to your gallery!")
    } catch (error) {
      console.error("Error saving image:", error)
      Alert.alert("Error", "Failed to save image. Please try again.")
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Handle share to specific platform
  const handleShareToPlatform = async (platform: string) => {
    if (!shareCardRef) return

    try {
      setIsGeneratingImage(true)

      // Capture view as image
      const uri = await captureRef(shareCardRef, {
        format: "png",
        quality: 1,
      })

      // Share based on platform
      switch (platform) {
        case "instagram":
          if (Platform.OS === "ios") {
            // On iOS, save to camera roll and suggest opening Instagram
            await MediaLibrary.saveToLibraryAsync(uri)
            Alert.alert(
              "Image Saved",
              "The image has been saved to your camera roll. You can now open Instagram and share it from there.",
              [
                { text: "OK" },
                {
                  text: "Open Instagram",
                  onPress: () => {
                    // Try to open Instagram
                    Linking.openURL("instagram://")
                  },
                },
              ],
            )
          } else {
            // On Android, use Sharing API
            await Sharing.shareAsync(uri, {
              mimeType: "image/png",
              dialogTitle: "Share to Instagram",
            })
          }
          break

        case "twitter":
          // Use Sharing API
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Share to Twitter",
          })
          break

        case "facebook":
          // Use Sharing API
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Share to Facebook",
          })
          break

        default:
          // Use generic sharing
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Share Image",
          })
      }
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error)
      Alert.alert("Error", `Failed to share to ${platform}. Please try again.`)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Handle copy link
  const handleCopyLink = () => {
    if (shareUrl) {
      Clipboard.setString(shareUrl)
      Alert.alert("Link Copied", "The link has been copied to your clipboard.")
    }
  }

  // Render share card preview
  const renderShareCardPreview = () => {
    if (!font || !boldFont) return null

    return (
      <View
        ref={(ref) => setShareCardRef(ref)}
        style={[styles.shareCardPreview, { backgroundColor: theme.colors.background.primary }]}
      >
        <Canvas style={styles.canvas}>
          {/* Background */}
          <Path
            path="M 0 0 H 600 V 600 H 0 Z"
            color={theme.colors.background.primary}
            style="fill"
          />

          {/* Background Image if available */}
          {backgroundImage && (
            <Image
              image={backgroundImage}
              fit="cover"
              x={0}
              y={0}
              width={600}
              height={300}
              opacity={0.7}
            />
          )}

          {/* Gradient Overlay */}
          <Path
            path="M 0 250 H 600 V 600 H 0 Z"
            color={theme.colors.background.primary}
            style="fill"
          />

          {/* Title */}
          <SkiaText text={title} x={40} y={350} font={boldFont} color={theme.colors.text.primary} />

          {/* Subtitle */}
          {subtitle && (
            <SkiaText
              text={subtitle}
              x={40}
              y={380}
              font={font}
              color={theme.colors.text.secondary}
            />
          )}

          {/* Stats */}
          {stats &&
            stats.map((stat, index) => (
              <>
                <SkiaText
                  key={`value-${index}`}
                  text={stat.value}
                  x={40 + index * 150}
                  y={440}
                  font={boldFont}
                  color={theme.colors.primary}
                />
                <SkiaText
                  key={`label-${index}`}
                  text={stat.label}
                  x={40 + index * 150}
                  y={465}
                  font={font}
                  color={theme.colors.text.tertiary}
                />
              </>
            ))}

          {/* Logo */}
          {logoImage && <Image image={logoImage} x={500} y={500} width={80} height={80} />}

          {/* Username */}
          <SkiaText
            text={`@${user?.username || "user"}`}
            x={40}
            y={540}
            font={font}
            color={theme.colors.text.tertiary}
          />
        </Canvas>
      </View>
    )
  }

  if (!visible) return null

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[StyleSheet.absoluteFill, styles.overlay]}
    >
      <BlurView
        intensity={30}
        tint={theme.dark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        entering={SlideInUp.springify()}
        exiting={SlideOutDown.springify()}
        style={styles.container}
      >
        <GlassMorphicCard style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="subtitle">Share Your Achievement</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={styles.previewContainer}>{renderShareCardPreview()}</View>

          {/* Share Options */}
          <View style={styles.shareOptions}>
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => handleShareToPlatform("instagram")}
              disabled={isGeneratingImage}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: "#E1306C" }]}>
                <Instagram size={20} color="#FFFFFF" />
              </View>
              <Text variant="caption">Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => handleShareToPlatform("twitter")}
              disabled={isGeneratingImage}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: "#1DA1F2" }]}>
                <Twitter size={20} color="#FFFFFF" />
              </View>
              <Text variant="caption">Twitter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => handleShareToPlatform("facebook")}
              disabled={isGeneratingImage}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: "#4267B2" }]}>
                <Facebook size={20} color="#FFFFFF" />
              </View>
              <Text variant="caption">Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={handleSaveImage}
              disabled={isGeneratingImage}
            >
              <View
                style={[styles.shareIconContainer, { backgroundColor: theme.colors.secondary }]}
              >
                <Download size={20} color="#FFFFFF" />
              </View>
              <Text variant="caption">Save</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: theme.colors.card.border }]}
              onPress={handleCopyLink}
              disabled={!shareUrl}
            >
              <Copy size={20} color={theme.colors.text.primary} />
              <Text variant="button" style={{ marginLeft: 8 }}>
                Copy Link
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleShare}
              disabled={isGeneratingImage}
            >
              <Share2 size={20} color={theme.colors.text.inverse} />
              <Text variant="button" style={{ color: theme.colors.text.inverse, marginLeft: 8 }}>
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </GlassMorphicCard>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  canvas: {
    height: 600,
    width: 600,
  },
  card: {
    padding: 20,
  },
  closeButton: {
    padding: 4,
  },
  container: {
    maxWidth: 500,
    padding: 20,
    width: "100%",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  overlay: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  shareCardPreview: {
    borderRadius: 12,
    height: 300,
    overflow: "hidden",
    width: 300,
  },
  shareIconContainer: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginBottom: 8,
    width: 40,
  },
  shareOption: {
    alignItems: "center",
  },
  shareOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
})
