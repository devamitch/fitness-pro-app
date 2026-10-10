import type { ReactNode } from "react"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import type { Theme } from "@/app/theme"

export interface BadgeProps {
  content: string | number
  color?: keyof Theme["colors"]
  variant?: "solid" | "outline" | "subtle"
  size?: "small" | "medium" | "large"
  max?: number
  showZero?: boolean
  children?: ReactNode
}

export const Badge = ({
  content,
  color = "primary",
  variant = "solid",
  size = "medium",
  max = 99,
  showZero = false,
  children,
}: BadgeProps) => {
  // Don't render if content is 0 and showZero is false
  if (content === 0 && !showZero && !children) {
    return null
  }

  // Format content
  const formattedContent = typeof content === "number" && content > max ? `${max}+` : content.toString()

  // Get size properties
  const getSizeProps = () => {
    switch (size) {
      case "small":
        return {
          minWidth: 16,
          height: 16,
          fontSize: 10,
          paddingHorizontal: "xxs",
        }
      case "large":
        return {
          minWidth: 24,
          height: 24,
          fontSize: 12,
          paddingHorizontal: "xs",
        }
      case "medium":
      default:
        return {
          minWidth: 20,
          height: 20,
          fontSize: 11,
          paddingHorizontal: "xxs",
        }
    }
  }

  // Get variant properties
  const getVariantProps = () => {
    switch (variant) {
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: color,
          textColor: color,
        }
      case "subtle":
        return {
          backgroundColor: `${color}20`,
          borderWidth: 0,
          textColor: color,
        }
      case "solid":
      default:
        return {
          backgroundColor: color,
          borderWidth: 0,
          textColor: "white",
        }
    }
  }

  const sizeProps = getSizeProps()
  const variantProps = getVariantProps()

  // Standalone badge
  if (!children) {
    return (
      <Box
        minWidth={sizeProps.minWidth}
        height={sizeProps.height}
        backgroundColor={variantProps.backgroundColor}
        borderWidth={variantProps.borderWidth}
        borderColor={variantProps.borderColor}
        borderRadius="rounded"
        alignItems="center"
        justifyContent="center"
        paddingHorizontal={sizeProps.paddingHorizontal}
      >
        <Text
          color={variantProps.textColor}
          style={{
            fontSize: sizeProps.fontSize,
            fontWeight: "bold",
          }}
        >
          {formattedContent}
        </Text>
      </Box>
    )
  }

  // Badge with children
  return (
    <Box position="relative">
      {children}
      <Box
        position="absolute"
        top={-5}
        right={-5}
        minWidth={sizeProps.minWidth}
        height={sizeProps.height}
        backgroundColor={variantProps.backgroundColor}
        borderWidth={variantProps.borderWidth}
        borderColor={variantProps.borderColor}
        borderRadius="rounded"
        alignItems="center"
        justifyContent="center"
        paddingHorizontal={sizeProps.paddingHorizontal}
        zIndex={1}
      >
        <Text
          color={variantProps.textColor}
          style={{
            fontSize: sizeProps.fontSize,
            fontWeight: "bold",
          }}
        >
          {formattedContent}
        </Text>
      </Box>
    </Box>
  )
}
