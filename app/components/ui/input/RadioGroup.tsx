"use client"

import { TouchableOpacity } from "react-native"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"

export interface RadioOption {
  label: string
  value: string
}

export interface RadioGroupProps {
  options: RadioOption[]
  value?: string
  onChange: (value: string) => void
  label?: string
  error?: string
  disabled?: boolean
  direction?: "row" | "column"
}

export const RadioGroup = ({
  options,
  value,
  onChange,
  label,
  error,
  disabled = false,
  direction = "column",
}: RadioGroupProps) => {
  const theme = useTheme()

  const handleSelect = (optionValue: string) => {
    if (!disabled) {
      onChange(optionValue)
    }
  }

  return (
    <Box width="100%">
      {label && (
        <Text variant="caption" color="textSecondary" marginBottom="xs">
          {label}
        </Text>
      )}

      <Box flexDirection={direction} flexWrap="wrap" gap={direction === "column" ? "sm" : "md"}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.7}
            onPress={() => handleSelect(option.value)}
            disabled={disabled}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Box
              width={20}
              height={20}
              borderWidth={2}
              borderColor={error ? "error" : value === option.value ? "primary" : "border"}
              borderRadius="rounded"
              alignItems="center"
              justifyContent="center"
              opacity={disabled ? 0.5 : 1}
            >
              {value === option.value && (
                <Box width={10} height={10} borderRadius="rounded" backgroundColor="primary" />
              )}
            </Box>

            <Text marginLeft="sm" color={disabled ? "textMuted" : "text"}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Box>

      {error && (
        <Text variant="caption" color="error" marginTop="xs">
          {error}
        </Text>
      )}
    </Box>
  )
}
