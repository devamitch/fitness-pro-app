// "use client"

// import { storage } from "@/utils/storage"
// import { createContext, useContext } from "react"
// import { create } from "zustand"
// import { createJSONStorage, persist } from "zustand/middleware"

// // Define theme colors
// export type ThemeColors = {
//   primary: string
//   secondary: string
//   accent: string
//   background: {
//     primary: string
//     secondary: string
//     tertiary: string
//   }
//   text: {
//     primary: string
//     secondary: string
//     tertiary: string
//     inverse: string
//   }
//   card: {
//     background: string
//     border: string
//   }
//   status: {
//     success: string
//     warning: string
//     error: string
//     info: string
//   }
//   glass: {
//     // Add glass properties
//     background: string
//     border: string
//     tint: string
//   }
//   overlay: string // Add overlay property
//   shadow: string
// }

// // Define theme type
// export type Theme = {
//   dark: boolean
//   colors: ThemeColors
//   spacing: {
//     none: number
//     xxs: number
//     xs: number
//     sm: number
//     md: number
//     lg: number
//     xl: number
//     xxl: number
//     xxxl: number
//   }
//   borderRadii: {
//     none: number
//     sm: number
//     md: number
//     lg: number
//     xl: number
//     xxl: number
//     rounded: number
//   }
//   textVariants: {
//     defaults: {
//       fontFamily: string
//       fontSize: number
//       lineHeight: number
//       color: string
//     }
//     header: {
//       fontFamily: string
//       fontSize: number
//       lineHeight: number
//       color: string
//     }
//     subheader: {
//       fontFamily: string
//       fontSize: number
//       lineHeight: number
//       color: string
//     }
//     title: {
//       fontFamily: string
//       fontSize: number
//       lineHeight: number
//       color: string
//     }
//     subtitle: {
//       fontFamily: string
//       fontSize: number
//       lineHeight: number
//       color: string
//     }
//     body: {
//       fontFamily: string
//       fontSize: number
//       lineHeight: number
//       color: string
//     }
//     bodyBold: {
//       fontFamily: string
//       fontSize: number
//       lineHeight: number
//       color: string
//     }
//     button: {
//       fontFamily: string
//       fontSize: number
//       lineHeight: number
//       color: string
//     }
//     caption: {
//       fontFamily: string
//       fontSize: number
//       lineHeight: number
//       color: string
//     }
//     footnote: {
//       fontFamily: string
//       fontSize: number
//       lineHeight: number
//       color: string
//     }
//     moonlight: {
//       fontFamily: string
//       fontSize: number
//       lineHeight: number
//       letterSpacing: number
//       color: string
//     }
//   }
//   cardVariants: {
//     defaults: {
//       backgroundColor: string
//       borderRadius: string
//       padding: string
//     }
//     primary: {
//       backgroundColor: string
//       shadowColor: string
//       shadowOffset: { width: number; height: number }
//       shadowOpacity: number
//       shadowRadius: number
//       elevation: number
//     }
//     secondary: {
//       backgroundColor: string
//       borderWidth: number
//       borderColor: string
//     }
//     interactive: {
//       backgroundColor: string
//       shadowColor: string
//       shadowOffset: { width: number; height: number }
//       shadowOpacity: number
//       shadowRadius: number
//       elevation: number
//     }
//   }
//   buttonVariants: {
//     defaults: {
//       borderRadius: string
//       padding: string
//       justifyContent: string
//       alignItems: string
//       flexDirection: string
//     }
//     primary: {
//       backgroundColor: string
//     }
//     secondary: {
//       backgroundColor: string
//     }
//     outline: {
//       backgroundColor: string
//       borderWidth: number
//       borderColor: string
//     }
//     disabled: {
//       backgroundColor: string
//     }
//   }
//   breakpoints: {
//     phone: number
//     tablet: number
//   }
// }

// // Light theme
// export const lightTheme: Theme = {
//   dark: false,
//   colors: {
//     primary: "#0A84FF",
//     secondary: "#32D74B",
//     accent: "#FF9500",
//     background: {
//       primary: "#F2F2F7",
//       secondary: "#FFFFFF",
//       tertiary: "#E5E5EA",
//     },
//     text: {
//       primary: "#000000",
//       secondary: "#3A3A3C",
//       tertiary: "#8E8E93",
//       inverse: "#FFFFFF",
//     },
//     card: {
//       background: "rgba(255, 255, 255, 0.8)", // Glassmorphic background
//       border: "rgba(255, 255, 255, 0.5)", // Subtle border
//     },
//     status: {
//       success: "#32D74B",
//       warning: "#FF9500",
//       error: "#FF3B30",
//       info: "#64D2FF",
//     },
//     glass: {
//       background: "rgba(255, 255, 255, 0.7)",
//       border: "rgba(255, 255, 255, 0.5)",
//       tint: "light",
//     },
//     overlay: "rgba(0, 0, 0, 0.1)", // Subtle overlay
//     shadow: "rgba(0, 0, 0, 0.1)",
//   },
//   spacing: {
//     none: 0,
//     xxs: 2,
//     xs: 4,
//     sm: 8,
//     md: 16,
//     lg: 24,
//     xl: 32,
//     xxl: 48,
//     xxxl: 64,
//   },
//   borderRadii: {
//     none: 0,
//     sm: 4,
//     md: 8,
//     lg: 12,
//     xl: 20,
//     xxl: 40,
//     rounded: 999,
//   },
//   textVariants: {
//     defaults: {
//       fontFamily: "Inter-Regular",
//       fontSize: 16,
//       lineHeight: 24,
//       color: "text",
//     },
//     header: {
//       fontFamily: "Montserrat-Bold",
//       fontSize: 32,
//       lineHeight: 40,
//       color: "text",
//     },
//     subheader: {
//       fontFamily: "Montserrat-Medium",
//       fontSize: 24,
//       lineHeight: 32,
//       color: "text",
//     },
//     title: {
//       fontFamily: "Montserrat-Bold",
//       fontSize: 20,
//       lineHeight: 28,
//       color: "text",
//     },
//     subtitle: {
//       fontFamily: "Montserrat-Medium",
//       fontSize: 18,
//       lineHeight: 26,
//       color: "text",
//     },
//     body: {
//       fontFamily: "Inter-Regular",
//       fontSize: 16,
//       lineHeight: 24,
//       color: "text",
//     },
//     bodyBold: {
//       fontFamily: "Inter-Bold",
//       fontSize: 16,
//       lineHeight: 24,
//       color: "text",
//     },
//     button: {
//       fontFamily: "Inter-Medium",
//       fontSize: 16,
//       lineHeight: 24,
//       color: "buttonText",
//     },
//     caption: {
//       fontFamily: "Inter-Regular",
//       fontSize: 14,
//       lineHeight: 20,
//       color: "textSecondary",
//     },
//     footnote: {
//       fontFamily: "Inter-Regular",
//       fontSize: 12,
//       lineHeight: 16,
//       color: "textMuted",
//     },
//     moonlight: {
//       fontFamily: "Moonlight",
//       fontSize: 36,
//       lineHeight: 44,
//       letterSpacing: 0.5,
//       color: "text",
//     },
//   },
//   cardVariants: {
//     defaults: {
//       backgroundColor: "cardBackground",
//       borderRadius: "md",
//       padding: "md",
//     },
//     primary: {
//       backgroundColor: "cardBackground",
//       shadowColor: "shadowColor",
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.1,
//       shadowRadius: 8,
//       elevation: 2,
//     },
//     secondary: {
//       backgroundColor: "cardBackgroundSecondary",
//       borderWidth: 1,
//       borderColor: "borderColor",
//     },
//     interactive: {
//       backgroundColor: "cardBackground",
//       shadowColor: "shadowColor",
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.15,
//       shadowRadius: 12,
//       elevation: 4,
//     },
//   },
//   buttonVariants: {
//     defaults: {
//       borderRadius: "md",
//       padding: "md",
//       justifyContent: "center",
//       alignItems: "center",
//       flexDirection: "row",
//     },
//     primary: {
//       backgroundColor: "primary",
//     },
//     secondary: {
//       backgroundColor: "secondary",
//     },
//     outline: {
//       backgroundColor: "transparent",
//       borderWidth: 1,
//       borderColor: "primary",
//     },
//     disabled: {
//       backgroundColor: "buttonDisabled",
//     },
//   },
//   breakpoints: {
//     phone: 0,
//     tablet: 768,
//   },
// }

// // Dark theme
// export const darkTheme: Theme = {
//   dark: true,
//   colors: {
//     primary: "#0A84FF",
//     secondary: "#32D74B",
//     accent: "#FF9500",
//     background: {
//       primary: "#1C1C1E",
//       secondary: "#2C2C2E",
//       tertiary: "#3A3A3C",
//     },
//     text: {
//       primary: "#FFFFFF",
//       secondary: "#E5E5EA",
//       tertiary: "#8E8E93",
//       inverse: "#000000",
//     },
//     card: {
//       background: "rgba(44, 44, 46, 0.8)", // Glassmorphic background
//       border: "rgba(58, 58, 60, 0.3)", // Subtle border
//     },
//     status: {
//       success: "#32D74B",
//       warning: "#FF9500",
//       error: "#FF453A",
//       info: "#64D2FF",
//     },
//     glass: {
//       background: "rgba(44, 44, 46, 0.7)",
//       border: "rgba(58, 58, 60, 0.5)",
//       tint: "dark",
//     },
//     overlay: "rgba(0, 0, 0, 0.5)", // Dark overlay
//     shadow: "rgba(0, 0, 0, 0.5)",
//   },
//   spacing: {
//     none: 0,
//     xxs: 2,
//     xs: 4,
//     sm: 8,
//     md: 16,
//     lg: 24,
//     xl: 32,
//     xxl: 48,
//     xxxl: 64,
//   },
//   borderRadii: {
//     none: 0,
//     sm: 4,
//     md: 8,
//     lg: 12,
//     xl: 20,
//     xxl: 40,
//     rounded: 999,
//   },
//   textVariants: {
//     defaults: {
//       fontFamily: "Inter-Regular",
//       fontSize: 16,
//       lineHeight: 24,
//       color: "text",
//     },
//     header: {
//       fontFamily: "Montserrat-Bold",
//       fontSize: 32,
//       lineHeight: 40,
//       color: "text",
//     },
//     subheader: {
//       fontFamily: "Montserrat-Medium",
//       fontSize: 24,
//       lineHeight: 32,
//       color: "text",
//     },
//     title: {
//       fontFamily: "Montserrat-Bold",
//       fontSize: 20,
//       lineHeight: 28,
//       color: "text",
//     },
//     subtitle: {
//       fontFamily: "Montserrat-Medium",
//       fontSize: 18,
//       lineHeight: 26,
//       color: "text",
//     },
//     body: {
//       fontFamily: "Inter-Regular",
//       fontSize: 16,
//       lineHeight: 24,
//       color: "text",
//     },
//     bodyBold: {
//       fontFamily: "Inter-Bold",
//       fontSize: 16,
//       lineHeight: 24,
//       color: "text",
//     },
//     button: {
//       fontFamily: "Inter-Medium",
//       fontSize: 16,
//       lineHeight: 24,
//       color: "buttonText",
//     },
//     caption: {
//       fontFamily: "Inter-Regular",
//       fontSize: 14,
//       lineHeight: 20,
//       color: "textSecondary",
//     },
//     footnote: {
//       fontFamily: "Inter-Regular",
//       fontSize: 12,
//       lineHeight: 16,
//       color: "textMuted",
//     },
//     moonlight: {
//       fontFamily: "Moonlight",
//       fontSize: 36,
//       lineHeight: 44,
//       letterSpacing: 0.5,
//       color: "text",
//     },
//   },
//   cardVariants: {
//     defaults: {
//       backgroundColor: "cardBackground",
//       borderRadius: "md",
//       padding: "md",
//     },
//     primary: {
//       backgroundColor: "cardBackground",
//       shadowColor: "shadowColor",
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.1,
//       shadowRadius: 8,
//       elevation: 2,
//     },
//     secondary: {
//       backgroundColor: "cardBackgroundSecondary",
//       borderWidth: 1,
//       borderColor: "borderColor",
//     },
//     interactive: {
//       backgroundColor: "cardBackground",
//       shadowColor: "shadowColor",
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.15,
//       shadowRadius: 12,
//       elevation: 4,
//     },
//   },
//   buttonVariants: {
//     defaults: {
//       borderRadius: "md",
//       padding: "md",
//       justifyContent: "center",
//       alignItems: "center",
//       flexDirection: "row",
//     },
//     primary: {
//       backgroundColor: "primary",
//     },
//     secondary: {
//       backgroundColor: "secondary",
//     },
//     outline: {
//       backgroundColor: "transparent",
//       borderWidth: 1,
//       borderColor: "primary",
//     },
//     disabled: {
//       backgroundColor: "buttonDisabled",
//     },
//   },
//   breakpoints: {
//     phone: 0,
//     tablet: 768,
//   },
// }

// // Theme context
// export const ThemeContext = createContext<Theme>(lightTheme)

// // Theme hook
// export const useTheme = () => useContext(ThemeContext)

// // Theme store with Zustand
// type ThemeState = {
//   theme: "light" | "dark" | "system"
//   setTheme: (theme: "light" | "dark" | "system") => void
// }

// export const useThemeStore = create<ThemeState>()(
//   persist(
//     (set) => ({
//       theme: "system",
//       setTheme: (theme) => set({ theme }),
//     }),
//     {
//       name: "theme-storage",
//       storage: createJSONStorage(() => ({
//         getItem: (name) => {
//           const value = storage.getString(name)
//           return value ? Promise.resolve(JSON.parse(value)) : Promise.resolve(null)
//         },
//         setItem: (name, value) => {
//           storage.set(name, JSON.stringify(value))
//           return Promise.resolve()
//         },
//         removeItem: (name) => {
//           storage.delete(name)
//           return Promise.resolve()
//         },
//       })),
//     },
//   ),
// )

import { createTheme } from "@shopify/restyle"
import { palette } from "./palette"
import { spacing } from "./spacing"
import { spacingDark } from "./spacingDark"
import { typography } from "./typography"

// Define border radii
const borderRadii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
  xxl: 40,
  rounded: 999,
}

// Light theme colors
const lightColors = {
  primary: palette.primary[500],
  secondary: palette.green[500],
  accent: palette.amber[500],
  background: palette.neutral[50],
  cardBackground: palette.white,
  cardBackgroundSecondary: palette.neutral[100],
  text: palette.neutral[900],
  textSecondary: palette.neutral[700],
  textMuted: palette.neutral[500],
  textInverted: palette.white,
  border: palette.neutral[300],
  borderColor: palette.neutral[300],
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowColor: "rgba(0, 0, 0, 0.1)",
  divider: palette.neutral[200],
  buttonBackground: palette.primary[500],
  buttonText: palette.white,
  buttonDisabled: palette.neutral[300],
  success: palette.green[500],
  error: palette.red[500],
  warning: palette.amber[500],
  info: palette.primary[400],
  white: palette.white,
  black: palette.black,
  transparent: palette.transparent,

  // Glass effects
  glassBackground: "rgba(255, 255, 255, 0.7)",
  glassBorder: "rgba(255, 255, 255, 0.5)",
  glassTint: "light",
  overlay: "rgba(0, 0, 0, 0.1)",
}

// Dark theme colors
const darkColors = {
  primary: palette.primary[500],
  secondary: palette.green[500],
  accent: palette.amber[500],
  background: palette.neutral[900],
  cardBackground: palette.neutral[800],
  cardBackgroundSecondary: palette.neutral[700],
  text: palette.white,
  textSecondary: palette.neutral[300],
  textMuted: palette.neutral[500],
  textInverted: palette.black,
  border: palette.neutral[700],
  borderColor: palette.neutral[700],
  shadow: "rgba(0, 0, 0, 0.3)",
  shadowColor: "rgba(0, 0, 0, 0.3)",
  divider: palette.neutral[700],
  buttonBackground: palette.primary[500],
  buttonText: palette.white,
  buttonDisabled: palette.neutral[600],
  success: palette.green[500],
  error: palette.red[500],
  warning: palette.amber[500],
  info: palette.primary[400],
  white: palette.white,
  black: palette.black,
  transparent: palette.transparent,

  // Glass effects
  glassBackground: "rgba(44, 44, 46, 0.7)",
  glassBorder: "rgba(58, 58, 60, 0.5)",
  glassTint: "dark",
  overlay: "rgba(0, 0, 0, 0.5)",
}

// Define text variants
const textVariants = {
  defaults: {
    fontFamily: typography.primary.normal,
    fontSize: 16,
    lineHeight: 24,
    color: "text",
  },
  header: {
    fontFamily: typography.primary.bold,
    fontSize: 32,
    lineHeight: 40,
    color: "text",
  },
  subheader: {
    fontFamily: typography.primary.medium,
    fontSize: 24,
    lineHeight: 32,
    color: "text",
  },
  title: {
    fontFamily: typography.primary.bold,
    fontSize: 20,
    lineHeight: 28,
    color: "text",
  },
  subtitle: {
    fontFamily: typography.primary.medium,
    fontSize: 18,
    lineHeight: 26,
    color: "text",
  },
  body: {
    fontFamily: typography.primary.normal,
    fontSize: 16,
    lineHeight: 24,
    color: "text",
  },
  bodyBold: {
    fontFamily: typography.primary.bold,
    fontSize: 16,
    lineHeight: 24,
    color: "text",
  },
  button: {
    fontFamily: typography.primary.medium,
    fontSize: 16,
    lineHeight: 24,
    color: "buttonText",
  },
  caption: {
    fontFamily: typography.primary.normal,
    fontSize: 14,
    lineHeight: 20,
    color: "textSecondary",
  },
  footnote: {
    fontFamily: typography.primary.normal,
    fontSize: 12,
    lineHeight: 16,
    color: "textMuted",
  },
  moonlight: {
    fontFamily: "Moonlight",
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 0.5,
    color: "text",
  },
}

// Define card variants
const cardVariants = {
  defaults: {
    backgroundColor: "cardBackground",
    borderRadius: "md",
    padding: "md",
  },
  primary: {
    backgroundColor: "cardBackground",
    shadowColor: "shadowColor",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  secondary: {
    backgroundColor: "cardBackgroundSecondary",
    borderWidth: 1,
    borderColor: "borderColor",
  },
  interactive: {
    backgroundColor: "cardBackground",
    shadowColor: "shadowColor",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  glass: {
    backgroundColor: "glassBackground",
    borderColor: "glassBorder",
    borderWidth: 1,
    shadowColor: "shadowColor",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
}

// Define button variants
const buttonVariants = {
  defaults: {
    borderRadius: "md",
    padding: "md",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  primary: {
    backgroundColor: "primary",
  },
  secondary: {
    backgroundColor: "secondary",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "primary",
  },
  disabled: {
    backgroundColor: "buttonDisabled",
  },
}

// Create the base theme
const baseTheme = {
  borderRadii,
  breakpoints: {
    phone: 0,
    tablet: 768,
  },
  textVariants,
  cardVariants,
  buttonVariants,
}

// Create the light theme
export const lightTheme = createTheme({
  ...baseTheme,
  colors: lightColors,
  spacing,
  isDark: false,
})

// Create the dark theme
export const darkTheme = createTheme({
  ...baseTheme,
  colors: darkColors,
  spacing: spacingDark,
  isDark: true,
})

// Export types
export type Theme = typeof lightTheme
export type ThemeColors = typeof lightColors
