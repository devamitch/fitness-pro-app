"use client"
import { TouchableOpacity } from "react-native"
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from "lucide-react-native"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { useTheme } from "../../../theme"

type AlertType = "info" | "success" | "warning" | "error"

export interface AlertProps {
  type?: AlertType
  title?: string
  message: string
  onClose?: () => void
  action?: {
    label: string
    onPress: () => void
  }
}

export const Alert = ({ type = "info", title, message, onClose, action }: AlertProps) => {
  const theme = useTheme()

  // Get color and icon based on type
  const getTypeProps = () => {
    switch (type) {
      case "success":
        return {
          color: "success",
          icon: <CheckCircle size={20} color={theme.colors.success} />,
        }
      case "warning":
        return {
          color: "warning",
          icon: <AlertTriangle size={20} color={theme.colors.warning} />,
        }
      case "error":
        return {
          color: "error",
          icon: <AlertCircle size={20} color={theme.colors.error} />,
        }
      case "info":
      default:
        return {
          color: "info",
          icon: <Info size={20} color={theme.colors.info} />,
        }
    }
  }

  const { color, icon } = getTypeProps()

  return (
    <Box
      backgroundColor={`${color}20`} // 20% opacity version of the color
      borderLeftWidth={4}
      borderLeftColor={color}
      borderRadius="md"
      padding="md"
    >
      <Box flexDirection="row">
        <Box marginRight="sm">{icon}</Box>

        <Box flex={1}>
          {title && (
            <Text variant="subtitle" color={color} marginBottom="xs">
              {title}
            </Text>
          )}

          <Text color="text">{message}</Text>

          {action && (
            <TouchableOpacity onPress={action.onPress} style={{ marginTop: 8 }}>
              <Text color={color} variant="button">
                {action.label}
              </Text>
            </TouchableOpacity>
          )}
        </Box>

        {onClose && (
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <X size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </Box>
    </Box>
  )
}
