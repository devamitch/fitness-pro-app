import { createText } from "@shopify/restyle"
import type { ReactNode } from "react"
import type { TextProps as RNTextProps } from "react-native"
import type { TextVariants, Theme } from "../../../theme"

const RestyleText = createText<Theme>()

export interface TextProps extends RNTextProps {
  variant?: TextVariants
  color?: keyof Theme["colors"]
  children: ReactNode
}

export const Text = ({ variant = "body", color, style, ...rest }: TextProps) => {
  return <RestyleText variant={variant} color={color} style={style} {...rest} />
}
