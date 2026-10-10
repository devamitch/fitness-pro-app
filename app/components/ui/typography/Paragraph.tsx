import type { ReactNode } from "react"
import { Text, type TextProps } from "./Text"

export interface ParagraphProps extends Omit<TextProps, "variant"> {
  bold?: boolean
  children: ReactNode
}

export const Paragraph = ({ bold = false, ...rest }: ParagraphProps) => {
  return <Text variant={bold ? "bodyBold" : "body"} {...rest} />
}
