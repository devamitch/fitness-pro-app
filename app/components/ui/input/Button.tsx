"use client"

import type React from "react"

import type { ReactNode } from "react"
import { TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native"
import { createRestyleComponent, createVariant, spacing, type SpacingProps } from "@shopify/restyle"
import type { Theme, ButtonVariants } from "../../../theme"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"

const ButtonContainer = createRestyleComponent<
  SpacingProps<Theme> & {
    variant?: ButtonVariants
  } & React.ComponentProps<typeof Box>,
  Theme
>([spacing, createVariant({ themeKey: "buttonVariants" })], Box)

export interface ButtonProps extends Omit<React.ComponentProps<typeof ButtonContainer>, "onPress"> {
  title: string
  onPress: () => void
  variant?: ButtonVariants
  disabled?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Button = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  ...rest
}: ButtonProps) => {
  const theme = useTheme()

  const textColor = variant === "outline" ? theme.colors.primary : theme.colors.buttonText

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.7} style={styles.touchable}>
      <ButtonContainer
        variant={disabled ? "disabled" : variant}
        opacity={disabled ? 0.5 : 1}
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        {...rest}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {leftIcon && <Box marginRight="xs">{leftIcon}</Box>}
            <Text variant="button" color={textColor}>
              {title}
            </Text>
            {rightIcon && <Box marginLeft="xs">{rightIcon}</Box>}
          </>
        )}
      </ButtonContainer>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  touchable: {
    alignSelf: "flex-start",
  },
})
