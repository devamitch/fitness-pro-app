import { Box, type BoxProps } from "./Box"

export interface ContainerProps extends BoxProps {
  fluid?: boolean
}

export const Container = ({ fluid = false, children, ...rest }: ContainerProps) => {
  return (
    <Box paddingHorizontal={fluid ? "none" : "md"} flex={1} backgroundColor="background" {...rest}>
      {children}
    </Box>
  )
}
