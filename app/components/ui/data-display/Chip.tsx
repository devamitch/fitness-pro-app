"use client"

import type { ReactNode } from "react"
import { TouchableOpacity } from "react-native"
import { X } from "lucide-react-native"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"
import type { Theme } from "../../../theme/theme"

export interface ChipProps {
  label: string
  onPress?: () => void
  onDelete?: () => void
  icon?: ReactNode
  color?: keyof Theme["colors"]
  variant?: "solid" | "outline"
  size?: "small" | "medium" | "large"
  disabled?: boolean
}

export const Chip = ({
  label,
  onPress,
  onDelete,
  icon,
  color = "primary",
  variant = "solid",
  size = "medium",
  disabled = false,
}: ChipProps) => {
  const theme = useTheme()

  // Get size properties
  const getSizeProps = () => {
    switch (size) {
      case "small":
        return {
          height: 24,
          paddingHorizontal: "xs",
          fontSize: 12,
          iconSize: 14,
        }
      case "large":
        return {
          height: 36,
          paddingHorizontal: "md",
          fontSize: 16,
          iconSize: 18,
        }
      case "medium":
      default:
        return {
          height: 32,
          paddingHorizontal: "sm",
          fontSize: 14,
          iconSize: 16,
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
          borderColor: disabled ? "buttonDisabled" : color,
          textColor: disabled ? "textMuted" : color,
        }
      case "solid":
      default:
        return {
          backgroundColor: disabled ? "buttonDisabled" : color,
          borderWidth: 0,
          textColor: "white",
        }
    }
  }

  const sizeProps = getSizeProps()
  const variantProps = getVariantProps()

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || !onPress} activeOpacity={0.7}>
      <Box
        flexDirection="row"
        alignItems="center"
        height={sizeProps.height}
        backgroundColor={variantProps.backgroundColor}
        borderWidth={variantProps.borderWidth}
        borderColor={variantProps.borderColor}
        borderRadius="rounded"
        paddingHorizontal={sizeProps.paddingHorizontal}
        opacity={disabled ? 0.5 : 1}
      >
        {icon && <Box marginRight="xs">{icon}</Box>}

        <Text color={variantProps.textColor} style={{ fontSize: sizeProps.fontSize }}>
          {label}
        </Text>

        {onDelete && (
          <TouchableOpacity onPress={onDelete} disabled={disabled} style={{ marginLeft: 4, padding: 2 }}>
            <X
              size={sizeProps.iconSize}
              color={variant === "solid" ? theme.colors.white : theme.colors[variantProps.textColor]}
            />
          </TouchableOpacity>
        )}
      </Box>
    </TouchableOpacity>
  )
}
