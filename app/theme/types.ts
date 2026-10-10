import type { StyleProp } from "react-native"
import type { Theme } from "./theme"

// Define theme mode
export type ThemeMode = "light" | "dark" | "system"

// Export variant types
export type TextVariants = keyof Theme["textVariants"]
export type ButtonVariants = keyof Theme["buttonVariants"]
export type CardVariants = keyof Theme["cardVariants"]

// Define ThemedStyle types
export type ThemedStyle<T> = (theme: Theme) => T
export type ThemedStyleArray<T> = (
  | ThemedStyle<T>
  | StyleProp<T>
  | (StyleProp<T> | ThemedStyle<T>)[]
)[]

// Re-export from theme
export type { Theme, ThemeColors } from "./theme"
