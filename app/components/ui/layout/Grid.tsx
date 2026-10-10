"use client"

import React from "react"

import type { ReactNode } from "react"
import { StyleSheet } from "react-native"
import { Box, type BoxProps } from "./Box"
import type { Theme } from "../../../theme"
import { useTheme } from "../../../theme"

export interface GridProps extends BoxProps {
  columns?: number
  spacing?: keyof Theme["spacing"]
  children: ReactNode
}

export const Grid = ({ columns = 2, spacing = "md", children, ...rest }: GridProps) => {
  const theme = useTheme()
  const gap = theme.spacing[spacing]

  return (
    <Box flexDirection="row" flexWrap="wrap" marginHorizontal={-gap / 2} marginVertical={-gap / 2} {...rest}>
      {React.Children.map(children, (child) => (
        <Box
          style={[
            styles.column,
            {
              width: `${100 / columns}%`,
              padding: gap / 2,
            },
          ]}
        >
          {child}
        </Box>
      ))}
    </Box>
  )
}

const styles = StyleSheet.create({
  column: {
    flexGrow: 0,
    flexShrink: 0,
  },
})
