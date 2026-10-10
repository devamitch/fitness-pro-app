"use client"

import { TouchableOpacity } from "react-native"
import { Check } from "lucide-react-native"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"

export interface CheckboxProps {
  label?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  error?: string
}

export const Checkbox = ({ label, checked, onChange, disabled = false, error }: CheckboxProps) => {
  const theme = useTheme()

  const handlePress = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  return (
    <Box>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        disabled={disabled}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <Box
          width={24}
          height={24}
          borderWidth={2}
          borderColor={error ? "error" : checked ? "primary" : "border"}
          borderRadius="sm"
          backgroundColor={checked ? "primary" : "transparent"}
          alignItems="center"
          justifyContent="center"
          opacity={disabled ? 0.5 : 1}
        >
          {checked && <Check size={16} color={theme.colors.white} />}
        </Box>

        {label && (
          <Text marginLeft="sm" color={disabled ? "textMuted" : "text"}>
            {label}
          </Text>
        )}
      </TouchableOpacity>

      {error && (
        <Text variant="caption" color="error" marginTop="xs">
          {error}
        </Text>
      )}
    </Box>
  )
}
