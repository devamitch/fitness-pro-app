import { Easing } from "react-native"
import type { StackCardInterpolationProps } from "@react-navigation/stack"

// Fade transition
export const fadeTransition = {
  cardStyleInterpolator: ({ current }: StackCardInterpolationProps) => ({
    cardStyle: {
      opacity: current.progress,
    },
  }),
  transitionSpec: {
    open: {
      animation: "timing",
      config: {
        duration: 300,
        easing: Easing.out(Easing.poly(4)),
        useNativeDriver: true,
      },
    },
    close: {
      animation: "timing",
      config: {
        duration: 200,
        easing: Easing.in(Easing.poly(4)),
        useNativeDriver: true,
      },
    },
  },
}

// Slide from right transition (default)
export const slideFromRightTransition = {
  cardStyleInterpolator: ({ current, layouts }: StackCardInterpolationProps) => ({
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
      ],
    },
  }),
  transitionSpec: {
    open: {
      animation: "spring",
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
        useNativeDriver: true,
      },
    },
    close: {
      animation: "spring",
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
        useNativeDriver: true,
      },
    },
  },
}

// Slide from bottom transition (modal-like)
export const slideFromBottomTransition = {
  cardStyleInterpolator: ({ current, layouts }: StackCardInterpolationProps) => ({
    cardStyle: {
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.height, 0],
          }),
        },
      ],
    },
  }),
  transitionSpec: {
    open: {
      animation: "spring",
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
        useNativeDriver: true,
      },
    },
    close: {
      animation: "spring",
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
        useNativeDriver: true,
      },
    },
  },
}

// Scale transition
export const scaleTransition = {
  cardStyleInterpolator: ({ current }: StackCardInterpolationProps) => ({
    cardStyle: {
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
      ],
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    },
  }),
  transitionSpec: {
    open: {
      animation: "timing",
      config: {
        duration: 300,
        easing: Easing.out(Easing.poly(4)),
        useNativeDriver: true,
      },
    },
    close: {
      animation: "timing",
      config: {
        duration: 200,
        easing: Easing.in(Easing.poly(4)),
        useNativeDriver: true,
      },
    },
  },
}

// Glassmorphism transition (special effect for our UI)
export const glassmorphismTransition = {
  cardStyleInterpolator: ({ current, next, layouts }: StackCardInterpolationProps) => ({
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
      ],
      opacity: current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.7, 1],
      }),
      // Add a slight blur effect during transition
      backdropFilter: `blur(${current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 10],
      })}px)`,
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
      }),
    },
  }),
  transitionSpec: {
    open: {
      animation: "timing",
      config: {
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      },
    },
    close: {
      animation: "timing",
      config: {
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      },
    },
  },
}
