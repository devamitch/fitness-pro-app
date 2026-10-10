"use client"

import { IMAGES } from "@/assets/images"
import { useNavigation } from "@react-navigation/native"
import { Dimensions, StyleSheet, View } from "react-native"
import { OnboardingSlider } from "../components/OnboardingSlider"
import { useTheme } from "../theme/theme"

const { width } = Dimensions.get("window")

export const OnboardingScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()

  // Onboarding slides
  const slides = [
    {
      id: "1",
      title: "Welcome to FitnessPro",
      description: "Your personal AI-powered fitness companion for a healthier lifestyle.",
      image: IMAGES.logo,
      backgroundColor: [
        theme.dark ? "rgba(10, 132, 255, 0.2)" : "rgba(10, 132, 255, 0.1)",
        theme.dark ? "rgba(50, 215, 75, 0.2)" : "rgba(50, 215, 75, 0.1)",
      ],
    },
    {
      id: "2",
      title: "Real-time Pose Detection",
      description: "Get instant feedback on your form and posture during workouts.",
      image: IMAGES.logo,
      backgroundColor: [
        theme.dark ? "rgba(255, 149, 0, 0.2)" : "rgba(255, 149, 0, 0.1)",
        theme.dark ? "rgba(255, 59, 48, 0.2)" : "rgba(255, 59, 48, 0.1)",
      ],
    },
    {
      id: "3",
      title: "Personalized Workouts",
      description: "Get custom workout plans tailored to your fitness level and goals.",
      image: IMAGES.logo,
      backgroundColor: [
        theme.dark ? "rgba(50, 215, 75, 0.2)" : "rgba(50, 215, 75, 0.1)",
        theme.dark ? "rgba(100, 210, 255, 0.2)" : "rgba(100, 210, 255, 0.1)",
      ],
    },
    {
      id: "4",
      title: "Track Your Progress",
      description: "Monitor your fitness journey with detailed stats and insights.",
      image: IMAGES.logo,
      backgroundColor: [
        theme.dark ? "rgba(191, 90, 242, 0.2)" : "rgba(191, 90, 242, 0.1)",
        theme.dark ? "rgba(10, 132, 255, 0.2)" : "rgba(10, 132, 255, 0.1)",
      ],
    },
  ]

  // Handle onboarding completion
  const handleComplete = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" }],
    })
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <OnboardingSlider slides={slides} onComplete={handleComplete} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
