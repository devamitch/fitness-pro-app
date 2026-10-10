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

export const customFontsToLoad = {
  montserratRegular,
  montserratMedium,
  montserratBold,
  interRegular,
  interMedium,
  interBold,
}

export const fontConfig = {
  montserrat: {
    regular: "montserratRegular",
    medium: "montserratMedium",
    bold: "montserratBold",
  },
  inter: {
    regular: "interRegular",
    medium: "interMedium",
    bold: "interBold",
  },
}
