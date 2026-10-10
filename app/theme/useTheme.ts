// import { useTheme as useRestyleTheme } from "@shopify/restyle"
// import { useColorScheme } from "react-native"
// import type { Theme } from "."
// import { useThemeStore } from "./store"

// export const useTheme = () => {
//   const theme = useRestyleTheme<Theme>()
//   const systemColorScheme = useColorScheme()
//   const { mode, isDarkMode, setMode, toggleMode } = useThemeStore()

//   return {
//     ...theme,
//     mode,
//     isDarkMode: isDarkMode(systemColorScheme),
//     setMode,
//     toggleMode,
//   }
// }

import { useTheme as useRestyleTheme } from "@shopify/restyle"
import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from "react-native"
import { useColorScheme } from "react-native"
import { useThemeStore } from "./store"
import type { Theme } from "./theme"
import type { ThemedStyle } from "./types"

export const useTheme = () => {
  const theme = useRestyleTheme<Theme>()
  const systemColorScheme = useColorScheme()
  const { mode, isDarkMode, setMode, toggleMode } = useThemeStore()

  // Function to apply themed styles
  const themed = <T extends ViewStyle | TextStyle | ImageStyle>(
    styles: ThemedStyle<T> | ThemedStyle<T>[] | StyleProp<T> | (StyleProp<T> | ThemedStyle<T>)[],
  ): T | (T | undefined)[] => {
    if (typeof styles === "function") {
      return (styles as ThemedStyle<T>)(theme)
    }

    if (Array.isArray(styles)) {
      return styles.map((style) => {
        if (typeof style === "function") {
          return (style as ThemedStyle<T>)(theme)
        }
        return style as T
      })
    }

    return styles as T
  }

  return {
    ...theme,
    mode,
    isDarkMode: isDarkMode(systemColorScheme),
    setMode,
    toggleMode,
    themed,
  }
}
