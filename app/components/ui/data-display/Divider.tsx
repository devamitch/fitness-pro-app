import { Box } from "../layout/Box"
import type { Theme } from "@/app/theme/theme" // Assuming the theme is located here

export interface DividerProps {
  orientation?: "horizontal" | "vertical"
  thickness?: number
  color?: keyof Theme["colors"]
  spacing?: keyof Theme["spacing"]
}

export const Divider = ({
  orientation = "horizontal",
  thickness = 1,
  color = "divider",
  spacing = "md",
}: DividerProps) => {
  return (
    <Box
      width={orientation === "horizontal" ? "100%" : thickness}
      height={orientation === "vertical" ? "100%" : thickness}
      backgroundColor={color}
      marginVertical={orientation === "horizontal" ? spacing : "none"}
      marginHorizontal={orientation === "vertical" ? spacing : "none"}
    />
  )
}
