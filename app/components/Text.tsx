"use client"

import { isRTL, translate, type TxKeyPath } from "@/i18n"
// import { useTheme } from "@/theme/hooks"
import type { TextVariants, Theme } from "@/theme/types"
import { typography } from "@/theme/typography"
import { useTheme } from "@/theme/useTheme"
import { createText } from "@shopify/restyle"
import type { TOptions } from "i18next"
import { forwardRef, type ForwardedRef, type ReactNode } from "react"
import {
  Text as RNText,
  type TextProps as RNTextProps,
  type StyleProp,
  type TextStyle,
} from "react-native"

// Create the base Restyle Text component
const RestyleText = createText<Theme>()

// Define size styles
const $sizeStyles = {
  xxl: { fontSize: 36, lineHeight: 44 } satisfies TextStyle,
  xl: { fontSize: 24, lineHeight: 34 } satisfies TextStyle,
  lg: { fontSize: 20, lineHeight: 32 } satisfies TextStyle,
  md: { fontSize: 18, lineHeight: 26 } satisfies TextStyle,
  sm: { fontSize: 16, lineHeight: 24 } satisfies TextStyle,
  xs: { fontSize: 14, lineHeight: 21 } satisfies TextStyle,
  xxs: { fontSize: 12, lineHeight: 18 } satisfies TextStyle,
}

// Define font weight styles based on typography
type Weights = keyof typeof typography.primary
const $fontWeightStyles = Object.entries(typography.primary).reduce((acc, [weight, fontFamily]) => {
  return { ...acc, [weight]: { fontFamily } }
}, {}) as Record<Weights, TextStyle>

// Define font family styles
type FontFamily = "primary" | "heading" | "legacy" | "code"
const $fontFamilyStyles = {
  primary: typography.primary.normal,
  heading: typography.heading.normal,
  legacy: typography.legacy.normal,
  code: typography?.code?.normal,
}

// Define presets
type Presets = "default" | "bold" | "heading" | "subheading" | "formLabel" | "formHelper"

// Extended TextProps interface
export interface TextProps extends RNTextProps {
  /**
   * Font family to use
   */
  family?: FontFamily
  /**
   * Text which is looked up via i18n.
   */
  tx?: TxKeyPath
  /**
   * The text to display if not using `tx` or nested components.
   */
  text?: string
  /**
   * Optional options to pass to i18n. Useful for interpolation
   * as well as explicitly setting locale or translation fallbacks.
   */
  txOptions?: TOptions
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<TextStyle>
  /**
   * One of the different types of text presets.
   */
  preset?: Presets
  /**
   * Text weight modifier.
   */
  weight?: Weights
  /**
   * Text size modifier.
   */
  size?: keyof typeof $sizeStyles
  /**
   * Restyle text variant from theme
   */
  variant?: TextVariants
  /**
   * Text color from theme
   */
  color?: keyof Theme["colors"]
  /**
   * Children components.
   */
  children?: ReactNode
}

/**
 * A comprehensive Text component that combines features from multiple implementations:
 * - Shopify Restyle theming
 * - i18n translation support
 * - Custom presets, weights, and sizes
 * - RTL support
 */
export const Text = forwardRef(function Text(props: TextProps, ref: ForwardedRef<RNText>) {
  const {
    weight,
    size,
    tx,
    txOptions,
    text,
    children,
    style: $styleOverride,
    preset = "default",
    variant,
    color,
    family,
    ...rest
  } = props

  const theme = useTheme()

  // Handle i18n text translation
  const i18nText = tx && translate(tx, txOptions)
  const content = i18nText || text || children

  // If a variant is provided, use Restyle's Text component
  if (variant) {
    return (
      <RestyleText
        variant={variant}
        color={color}
        style={[
          // Apply RTL style if needed
          isRTL ? { writingDirection: "rtl" } : {},
          // Apply weight if provided
          weight && $fontWeightStyles[weight],
          // Apply size if provided
          size && $sizeStyles[size],
          // Apply custom style override
          $styleOverride,
        ]}
        {...rest}
        ref={ref as any}
      >
        {content}
      </RestyleText>
    )
  }

  // Otherwise, use the preset-based styling
  const getPresetStyle = (): TextStyle => {
    switch (preset) {
      case "bold":
        return {
          ...$sizeStyles.sm,
          ...$fontWeightStyles.bold,
          color: theme.colors.text,
        }
      case "heading":
        return {
          ...$sizeStyles.xxl,
          ...$fontWeightStyles.bold,
          color: theme.colors.text,
        }
      case "subheading":
        return {
          ...$sizeStyles.lg,
          ...$fontWeightStyles.medium,
          color: theme.colors.text,
        }
      case "formLabel":
        return {
          ...$sizeStyles.sm,
          ...$fontWeightStyles.medium,
          color: theme.colors.text,
        }
      case "formHelper":
        return {
          ...$sizeStyles.xs,
          ...$fontWeightStyles.normal,
          color: theme.colors.textSecondary,
        }
      case "default":
      default:
        return {
          ...$sizeStyles.sm,
          ...$fontWeightStyles.normal,
          color: theme.colors.text,
        }
    }
  }

  const $rtlStyle: TextStyle = isRTL ? { writingDirection: "rtl" } : {}

  const $styles: StyleProp<TextStyle> = [
    $rtlStyle,
    getPresetStyle(),
    weight && $fontWeightStyles[weight],
    family && { fontFamily: $fontFamilyStyles[family] },
    size && $sizeStyles[size],
    color && { color: theme.colors[color] },
    $styleOverride,
  ]

  return (
    <RNText {...rest} style={$styles} ref={ref}>
      {content}
    </RNText>
  )
})
