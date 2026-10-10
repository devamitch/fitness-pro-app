import type React from "react"
import type { ReactNode } from "react"
import { TouchableOpacity } from "react-native"
import { createRestyleComponent, createVariant, spacing, type SpacingProps } from "@shopify/restyle"
import type { Theme, CardVariants } from "../../../theme"
import { Box } from "../layout/Box"

const CardContainer = createRestyleComponent<
  SpacingProps<Theme> & {
    variant?: CardVariants
  } & React.ComponentProps<typeof Box>,
  Theme
>([spacing, createVariant({ themeKey: "cardVariants" })], Box)

export interface CardProps extends Omit<React.ComponentProps<typeof CardContainer>, "onPress"> {
  children: ReactNode
  variant?: CardVariants
  onPress?: () => void
}

export const Card = ({ children, variant = "primary", onPress, ...rest }: CardProps) => {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={{ alignSelf: "stretch" }}>
        <CardContainer variant={variant} {...rest}>
          {children}
        </CardContainer>
      </TouchableOpacity>
    )
  }

  return (
    <CardContainer variant={variant} {...rest}>
      {children}
    </CardContainer>
  )
}
