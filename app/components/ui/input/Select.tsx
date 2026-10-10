"use client"

import { useState } from "react"
import { TouchableOpacity, Modal, FlatList, StyleSheet } from "react-native"
import { ChevronDown, Check } from "lucide-react-native"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"

export interface SelectOption {
  label: string
  value: string
}

export interface SelectProps {
  label?: string
  placeholder?: string
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export const Select = ({
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  error,
  disabled = false,
}: SelectProps) => {
  const theme = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find((option) => option.value === value)

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleSelect = (option: SelectOption) => {
    onChange(option.value)
    handleClose()
  }

  const getBorderColor = () => {
    if (error) return theme.colors.error
    if (disabled) return theme.colors.buttonDisabled
    return theme.colors.border
  }

  return (
    <Box width="100%">
      {label && (
        <Text variant="caption" color="textSecondary" marginBottom="xs">
          {label}
        </Text>
      )}

      <TouchableOpacity activeOpacity={disabled ? 1 : 0.7} onPress={handleOpen} disabled={disabled}>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          borderWidth={1}
          borderColor={getBorderColor()}
          borderRadius="md"
          padding="sm"
          backgroundColor={disabled ? "buttonDisabled" : "cardBackground"}
          opacity={disabled ? 0.5 : 1}
        >
          <Text color={selectedOption ? "text" : "textMuted"} numberOfLines={1} ellipsizeMode="tail">
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          <ChevronDown size={20} color={theme.colors.textMuted} />
        </Box>
      </TouchableOpacity>

      {error && (
        <Text variant="caption" color="error" marginTop="xs">
          {error}
        </Text>
      )}

      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
          <Box
            width="90%"
            maxHeight="70%"
            backgroundColor="cardBackground"
            borderRadius="lg"
            padding="md"
            style={styles.modalContent}
          >
            <Text variant="subtitle" marginBottom="md">
              {label || "Select an option"}
            </Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelect(item)} style={styles.option}>
                  <Box flexDirection="row" alignItems="center" justifyContent="space-between" paddingVertical="sm">
                    <Text>{item.label}</Text>
                    {item.value === value && <Check size={20} color={theme.colors.primary} />}
                  </Box>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <Box height={1} backgroundColor="divider" />}
            />
          </Box>
        </TouchableOpacity>
      </Modal>
    </Box>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  option: {
    paddingVertical: 4,
  },
})
