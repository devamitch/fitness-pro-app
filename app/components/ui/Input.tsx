"use client"

import type React from "react"
import { forwardRef } from "react"
import { View, TextInput, StyleSheet, type TextInputProps, type ViewStyle, type TextStyle } from "react-native"
import { Text } from "./Text"
import { useTheme } from "@/hooks/useTheme"

export interface InputProps extends TextInputProps {
  label?: string
  error?: string
  containerStyle?: ViewStyle
  labelStyle?: TextStyle
  inputStyle?: TextStyle
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, labelStyle, inputStyle, leftIcon, rightIcon, ...props }, ref) => {
    const { colors } = useTheme()

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text variant="caption" style={[styles.label, { color: colors.text }, labelStyle]}>
            {label}
          </Text>
        )}
        <View
          style={[
            styles.inputContainer,
            {
              borderColor: error ? colors.error : colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: colors.text,
                paddingLeft: leftIcon ? 0 : 16,
                paddingRight: rightIcon ? 0 : 16,
              },
              inputStyle,
            ]}
            placeholderTextColor={colors.textSecondary}
            {...props}
          />
          {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
        </View>
        {error && (
          <Text variant="caption" style={[styles.error, { color: colors.error }]}>
            {error}
          </Text>
        )}
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    height: 56,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  iconContainer: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    marginTop: 4,
  },
})
