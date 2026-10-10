"use client"

import type React from "react"

import { useState, forwardRef } from "react"
import { TextInput, StyleSheet, type TextInputProps } from "react-native"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"

export interface TextFieldProps extends Omit<TextInputProps, "placeholderTextColor"> {
  label?: string
  error?: string
  helper?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, helper, leftIcon, rightIcon, style, ...rest }, ref) => {
    const theme = useTheme()
    const [isFocused, setIsFocused] = useState(false)

    const handleFocus = (e: any) => {
      setIsFocused(true)
      rest.onFocus?.(e)
    }

    const handleBlur = (e: any) => {
      setIsFocused(false)
      rest.onBlur?.(e)
    }

    const getBorderColor = () => {
      if (error) return theme.colors.error
      if (isFocused) return theme.colors.primary
      return theme.colors.border
    }

    return (
      <Box width="100%">
        {label && (
          <Text variant="caption" color="textSecondary" marginBottom="xs">
            {label}
          </Text>
        )}

        <Box
          flexDirection="row"
          alignItems="center"
          borderWidth={1}
          borderColor={getBorderColor()}
          borderRadius="md"
          paddingHorizontal="sm"
          backgroundColor="cardBackground"
        >
          {leftIcon && (
            <Box marginRight="xs" justifyContent="center">
              {leftIcon}
            </Box>
          )}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                flex: 1,
                paddingVertical: theme.spacing.sm,
              },
              style,
            ]}
            placeholderTextColor={theme.colors.textMuted}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
          />

          {rightIcon && (
            <Box marginLeft="xs" justifyContent="center">
              {rightIcon}
            </Box>
          )}
        </Box>

        {(error || helper) && (
          <Text variant="caption" color={error ? "error" : "textMuted"} marginTop="xs">
            {error || helper}
          </Text>
        )}
      </Box>
    )
  },
)

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    padding: 0,
  },
})
