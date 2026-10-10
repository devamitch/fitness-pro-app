"use client"

import { useState } from "react"
import { Image, StyleSheet, type ImageSourcePropType } from "react-native"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme, type Theme } from "../../../theme"

export interface AvatarProps {
  source?: ImageSourcePropType
  name?: string
  size?: "small" | "medium" | "large" | number
  variant?: "circle" | "rounded" | "square"
  backgroundColor?: keyof Theme["colors"]
}

export const Avatar = ({
  source,
  name,
  size = "medium",
  variant = "circle",
  backgroundColor = "primary",
}: AvatarProps) => {
  const theme = useTheme()
  const [imageError, setImageError] = useState(false)

  // Get size in pixels
  const getSizeInPixels = () => {
    if (typeof size === "number") return size

    switch (size) {
      case "small":
        return 32
      case "large":
        return 64
      case "medium":
      default:
        return 48
    }
  }

  // Get border radius based on variant
  const getBorderRadius = () => {
    const sizeInPixels = getSizeInPixels()

    switch (variant) {
      case "circle":
        return sizeInPixels / 2
      case "rounded":
        return theme.borderRadii.md
      case "square":
        return 0
    }
  }

  // Get initials from name
  const getInitials = () => {
    if (!name) return ""

    const nameParts = name.split(" ")
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase()
    }

    return nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase()
  }

  const sizeInPixels = getSizeInPixels()
  const borderRadius = getBorderRadius()

  return (
    <Box
      width={sizeInPixels}
      height={sizeInPixels}
      borderRadius={variant === "circle" ? "rounded" : variant === "rounded" ? "md" : "none"}
      backgroundColor={backgroundColor}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      {source && !imageError ? (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: sizeInPixels,
              height: sizeInPixels,
              borderRadius,
            },
          ]}
          onError={() => setImageError(true)}
        />
      ) : (
        <Text
          color="white"
          style={{
            fontSize: sizeInPixels * 0.4,
            fontWeight: "bold",
          }}
        >
          {getInitials()}
        </Text>
      )}
    </Box>
  )
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
  },
})
