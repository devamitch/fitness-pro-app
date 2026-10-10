import { useColorScheme } from "react-native"
import { useThemeStore } from "../stores/themeStore"
import { lightTheme, darkTheme } from "../theme"

export const useAppTheme = () => {
  const { mode } = useThemeStore()
  const systemColorScheme = useColorScheme()

  const isDark = mode === "system" ? systemColorScheme === "dark" : mode === "dark"

  return {
    theme: isDark ? darkTheme : lightTheme,
    isDark,
  }
}
