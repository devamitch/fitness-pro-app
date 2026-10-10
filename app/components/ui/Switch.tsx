"use client"

import type React from "react"
import { Switch as RNSwitch, type SwitchProps as RNSwitchProps, StyleSheet, View, type ViewStyle } from "react-native"
import { useTheme } from "@/hooks/useTheme"
import { Text } from "./Text"

export interface SwitchProps extends RNSwitchProps {
  label?: string
  description?: string
  containerStyle?: ViewStyle
}

export const Switch: React.FC<SwitchProps> = ({ label, description, containerStyle, ...props }) => {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.textContainer}>
        {label && <Text variant="body">{label}</Text>}
        {description && (
          <Text variant="caption" style={{ color: colors.textSecondary }}>
            {description}
          </Text>
        )}
      </View>
      <RNSwitch
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={props.value ? colors.background : colors.background}
        ios_backgroundColor={colors.border}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
})
