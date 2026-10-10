import type { ReactNode } from "react"
import { Text, type TextProps } from "./Text"
import type { Theme } from "../../../theme"

export interface HeadingProps extends Omit<TextProps, "variant"> {
  level?: 1 | 2 | 3 | 4 | 5
  color?: keyof Theme["colors"]
  children: ReactNode
}

export const Heading = ({ level = 1, color, style, ...rest }: HeadingProps) => {
  // Map heading levels to text variants
  const variantMap: Record<number, TextProps["variant"]> = {
    1: "header",
    2: "subheader",
    3: "title",
    4: "subtitle",
    5: "bodyBold",
  }

  return <Text variant={variantMap[level]} color={color} style={style} {...rest} />
}
