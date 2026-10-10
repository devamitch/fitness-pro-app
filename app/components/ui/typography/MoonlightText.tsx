import type { ReactNode } from "react"
import { Text, type TextProps } from "./Text"

export interface MoonlightTextProps extends Omit<TextProps, "variant"> {
  children: ReactNode
}

export const MoonlightText = ({ color, style, ...rest }: MoonlightTextProps) => {
  return <Text variant="moonlight" color={color} style={style} {...rest} />
}
