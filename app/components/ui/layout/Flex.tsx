import { Box, type BoxProps } from "./Box"
import type { Theme } from "@/app/theme/theme"

export interface FlexProps extends BoxProps {
  direction?: "row" | "column" | "row-reverse" | "column-reverse"
  align?: "flex-start" | "flex-end" | "center" | "stretch" | "baseline"
  justify?: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly"
  wrap?: "wrap" | "nowrap" | "wrap-reverse"
  gap?: keyof Theme["spacing"]
}

export const Flex = ({
  direction = "row",
  align = "stretch",
  justify = "flex-start",
  wrap = "nowrap",
  gap,
  children,
  ...rest
}: FlexProps) => {
  return (
    <Box flexDirection={direction} alignItems={align} justifyContent={justify} flexWrap={wrap} gap={gap} {...rest}>
      {children}
    </Box>
  )
}
