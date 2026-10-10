import type React from "react"
import { createRestyleComponent, createVariant, spacing, type SpacingProps } from "@shopify/restyle"
import type { Theme } from "../../../theme"
import { Box } from "./Box"

const variant = createVariant<Theme>({
  themeKey: "spacing",
  property: "gap",
})

export const Stack = createRestyleComponent<
  SpacingProps<Theme> & {
    gap?: keyof Theme["spacing"]
    direction?: "row" | "column"
  } & React.ComponentProps<typeof Box>,
  Theme
>([spacing, variant], Box)

export interface VStackProps extends Omit<React.ComponentProps<typeof Stack>, "direction"> {
  gap?: keyof Theme["spacing"]
}

export const VStack = ({ gap = "md", ...rest }: VStackProps) => {
  return <Stack direction="column" gap={gap} {...rest} />
}

export interface HStackProps extends Omit<React.ComponentProps<typeof Stack>, "direction"> {
  gap?: keyof Theme["spacing"]
}

export const HStack = ({ gap = "md", ...rest }: HStackProps) => {
  return <Stack direction="row" gap={gap} {...rest} />
}
