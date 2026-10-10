import { Box, type BoxProps } from "./Box"
import type { Theme } from "../../../theme"

export interface SpacerProps extends BoxProps {
  size?: keyof Theme["spacing"]
  axis?: "horizontal" | "vertical"
}

export const Spacer = ({ size = "md", axis = "vertical", ...rest }: SpacerProps) => {
  return <Box width={axis === "horizontal" ? size : "auto"} height={axis === "vertical" ? size : "auto"} {...rest} />
}
