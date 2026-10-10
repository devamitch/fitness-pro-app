"use client"

import type { ReactNode } from "react"
import { TouchableOpacity } from "react-native"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export interface AppBarProps {
  title: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  onLeftPress?: () => void
  onRightPress?: () => void
  transparent?: boolean
  variant?: "default" | "large"
}

export const AppBar = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  transparent = false,
  variant = "default",
}: AppBarProps) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Box
      paddingTop={insets.top}
      backgroundColor={transparent ? "transparent" : "cardBackground"}
      borderBottomWidth={transparent ? 0 : 1}
      borderBottomColor="border"
    >
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="md"
        paddingVertical={variant === "large" ? "lg" : "md"}
      >
        <Box width={40} alignItems="flex-start">
          {leftIcon && (
            <TouchableOpacity onPress={onLeftPress} disabled={!onLeftPress}>
              {leftIcon}
            </TouchableOpacity>
          )}
        </Box>

        <Box flex={1} alignItems="center">
          <Text variant={variant === "large" ? "title" : "subtitle"} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </Box>

        <Box width={40} alignItems="flex-end">
          {rightIcon && (
            <TouchableOpacity onPress={onRightPress} disabled={!onRightPress}>
              {rightIcon}
            </TouchableOpacity>
          )}
        </Box>
      </Box>
    </Box>
  )
}
