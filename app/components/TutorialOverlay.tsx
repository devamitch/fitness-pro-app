"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated, Text } from "react-native"
import { BlurView } from "expo-blur"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTutorialStore } from "../utils/tutorialManager"
import { useTheme } from "../theme/theme"
import { ChevronRight, ChevronLeft, X } from "lucide-react-native"

const { width, height } = Dimensions.get("window")

export const TutorialOverlay: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { isVisible, currentTutorialId, nextStep, previousStep, skipTutorial, getCurrentStep } = useTutorialStore()

  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [isVisible])

  if (!isVisible || !currentTutorialId) return null

  const currentStep = getCurrentStep()
  if (!currentStep) return null

  // Calculate tooltip position based on element position
  // In a real app, you would measure the element's position
  // For now, we'll use a simple position based on the step's position property
  const getTooltipPosition = () => {
    switch (currentStep.position) {
      case "top":
        return { top: height * 0.3 }
      case "bottom":
        return { bottom: height * 0.3 }
      case "left":
        return { left: width * 0.2 }
      case "right":
        return { right: width * 0.2 }
      default:
        return { top: height * 0.3 }
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <BlurView intensity={80} tint={theme.dark ? "dark" : "light"} style={StyleSheet.absoluteFill} />

      <Animated.View
        style={[
          styles.tooltipContainer,
          getTooltipPosition(),
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            backgroundColor: theme.colors.card.background,
            borderColor: theme.colors.card.border,
          },
        ]}
      >
        <View style={styles.tooltipHeader}>
          <Text style={[styles.tooltipTitle, { color: theme.colors.text.primary }]}>{currentStep.title}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={skipTutorial}>
            <X size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.tooltipDescription, { color: theme.colors.text.secondary }]}>
          {currentStep.description}
        </Text>

        <View style={styles.tooltipFooter}>
          <TouchableOpacity
            style={[styles.navButton, { opacity: currentStep.order > 0 ? 1 : 0.5 }]}
            onPress={previousStep}
            disabled={currentStep.order === 0}
          >
            <ChevronLeft size={20} color={theme.colors.primary} />
            <Text style={[styles.navButtonText, { color: theme.colors.primary }]}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={nextStep}>
            <Text style={[styles.navButtonText, { color: theme.colors.text.inverse }]}>
              {currentStep.order === 3 ? "Finish" : "Next"}
            </Text>
            <ChevronRight size={20} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  tooltipContainer: {
    width: width * 0.8,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tooltipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  tooltipDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  tooltipFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  nextButton: {
    backgroundColor: "#0A84FF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navButtonText: {
    fontSize: 16,
    marginHorizontal: 4,
  },
})
