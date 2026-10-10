import {
  Inter_700Bold as interBold,
  Inter_500Medium as interMedium,
  Inter_400Regular as interRegular,
} from "@expo-google-fonts/inter"
import {
  Montserrat_700Bold as montserratBold,
  Montserrat_500Medium as montserratMedium,
  Montserrat_400Regular as montserratRegular,
} from "@expo-google-fonts/montserrat"
import {
  SpaceGrotesk_700Bold as spaceGroteskBold,
  SpaceGrotesk_300Light as spaceGroteskLight,
  SpaceGrotesk_500Medium as spaceGroteskMedium,
  SpaceGrotesk_400Regular as spaceGroteskRegular,
  SpaceGrotesk_600SemiBold as spaceGroteskSemiBold,
} from "@expo-google-fonts/space-grotesk"
import { Platform } from "react-native"

// All fonts that need to be loaded by Expo
export const customFontsToLoad = {
  // Space Grotesk
  spaceGroteskLight,
  spaceGroteskRegular,
  spaceGroteskMedium,
  spaceGroteskSemiBold,
  spaceGroteskBold,
  // Inter
  interRegular,
  interMedium,
  interBold,
  // Montserrat
  montserratRegular,
  montserratMedium,
  montserratBold,
}

// Define all available fonts
const fonts = {
  spaceGrotesk: {
    // Cross-platform Google font
    light: "spaceGroteskLight",
    normal: "spaceGroteskRegular",
    medium: "spaceGroteskMedium",
    semiBold: "spaceGroteskSemiBold",
    bold: "spaceGroteskBold",
  },
  inter: {
    // Cross-platform Google font
    normal: "interRegular",
    medium: "interMedium",
    bold: "interBold",
  },
  montserrat: {
    // Cross-platform Google font
    normal: "montserratRegular",
    medium: "montserratMedium",
    bold: "montserratBold",
  },
  helveticaNeue: {
    // iOS only font
    thin: "HelveticaNeue-Thin",
    light: "HelveticaNeue-Light",
    normal: "Helvetica Neue",
    medium: "HelveticaNeue-Medium",
  },
  courier: {
    // iOS only font
    normal: "Courier",
  },
  sansSerif: {
    // Android only font
    thin: "sans-serif-thin",
    light: "sans-serif-light",
    normal: "sans-serif",
    medium: "sans-serif-medium",
  },
  monospace: {
    // Android only font
    normal: "monospace",
  },
}

export const typography = {
  /**
   * The fonts are available to use, but prefer using the semantic name.
   */
  fonts,
  /**
   * The primary font. Used in most places.
   */
  primary: fonts.inter,
  /**
   * An alternate font used for headings and titles.
   */
  heading: fonts.montserrat,
  /**
   * The legacy font from the original implementation.
   */
  legacy: fonts.spaceGrotesk,
  /**
   * An alternate font used for perhaps titles and stuff.
   */
  secondary: Platform.select({ ios: fonts.helveticaNeue, android: fonts.sansSerif }),
  /**
   * Lets get fancy with a monospace font!
   */
  code: Platform.select({ ios: fonts.courier, android: fonts.monospace }),
}

// For backwards compatibility
export const fontConfig = {
  montserrat: fonts.montserrat,
  inter: fonts.inter,
  spaceGrotesk: fonts.spaceGrotesk,
}
