"use client"

import { storage } from "@/utils/storage"
import * as Haptics from "expo-haptics"
import { LinearGradient } from "expo-linear-gradient"
import { ArrowLeft, ArrowRight } from "lucide-react-native"
import type React from "react"
import { useRef, useState } from "react"
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewToken,
} from "react-native"
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "../theme/theme"
import { AnimatedButton } from "./AnimatedButton"
import { Text } from "./Text"

const { width, height } = Dimensions.get("window")

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

interface OnboardingSlide {
  id: string
  title: string
  description: string
  image: any
  backgroundColor: string[]
}

interface OnboardingSliderProps {
  slides: OnboardingSlide[]
  onComplete: () => void
}

export const OnboardingSlider: React.FC<OnboardingSliderProps> = ({ slides, onComplete }) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const flatListRef = useRef<FlatList>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollX = useSharedValue(0)
  const inputRange = slides.map((_, i) => i * width)

  // Handle scroll
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x
    },
  })

  // Handle slide change
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  })

  // Go to next slide
  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      })
    } else {
      completeOnboarding()
    }
  }

  // Go to previous slide
  const goToPrevSlide = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      })
    }
  }

  // Skip onboarding
  const skipOnboarding = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    completeOnboarding()
  }

  // Complete onboarding
  const completeOnboarding = () => {
    storage.set("onboarding-completed", "true")
    onComplete()
  }

  // Render slide
  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    // Animated styles for each slide
    const animatedImageStyle = useAnimatedStyle(() => {
      const inputRangeForImage = [(index - 1) * width, index * width, (index + 1) * width]
      const scale = interpolate(scrollX.value, inputRangeForImage, [0.8, 1, 0.8], Extrapolate.CLAMP)
      const opacity = interpolate(
        scrollX.value,
        inputRangeForImage,
        [0.5, 1, 0.5],
        Extrapolate.CLAMP,
      )

      return {
        transform: [{ scale }],
        opacity,
      }
    }, [scrollX, width, index])

    const animatedTextStyle = useAnimatedStyle(() => {
      const inputRangeForText = [(index - 1) * width, index * width, (index + 1) * width]
      const translateY = interpolate(
        scrollX.value,
        inputRangeForText,
        [50, 0, 50],
        Extrapolate.CLAMP,
      )
      const opacity = interpolate(scrollX.value, inputRangeForText, [0, 1, 0], Extrapolate.CLAMP)

      return {
        transform: [{ translateY }],
        opacity,
      }
    }, [scrollX, width, index])

    return (
      <View style={[styles.slide, { width }]}>
        <LinearGradient
          colors={item.backgroundColor}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <Animated.Image source={item.image} style={[styles.image, animatedImageStyle]} />

        <Animated.View style={[styles.textContainer, animatedTextStyle]}>
          <Text variant="header" style={styles.title}>
            {item.title}
          </Text>
          <Text variant="body" style={styles.description}>
            {item.description}
          </Text>
        </Animated.View>
      </View>
    )
  }

  // Pagination dots
  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => {
          const animatedDotStyle = useAnimatedStyle(() => {
            const inputRangeForDot = [(index - 1) * width, index * width, (index + 1) * width]
            const dotWidth = interpolate(
              scrollX.value,
              inputRangeForDot,
              [8, 24, 8],
              Extrapolate.CLAMP,
            )
            const opacity = interpolate(
              scrollX.value,
              inputRangeForDot,
              [0.5, 1, 0.5],
              Extrapolate.CLAMP,
            )

            return {
              width: dotWidth,
              opacity,
              backgroundColor:
                index === currentIndex ? theme.colors.primary : "rgba(150, 150, 150, 0.5)",
            }
          }, [scrollX, width, index, currentIndex, theme.colors.primary])

          return <Animated.View key={index} style={[styles.dot, animatedDotStyle]} />
        })}
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <AnimatedFlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      {/* Navigation buttons */}
      <View style={[styles.navigationContainer, { paddingBottom: insets.bottom || 20 }]}>
        {/* Skip button */}
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
            <Text variant="button" style={styles.skipText}>
              Skip
            </Text>
          </TouchableOpacity>
        )}

        {/* Pagination */}
        {renderPagination()}

        {/* Navigation buttons */}
        <View style={styles.buttonsContainer}>
          {currentIndex > 0 && (
            <TouchableOpacity style={styles.navButton} onPress={goToPrevSlide}>
              <ArrowLeft size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}

          <AnimatedButton
            title={currentIndex === slides.length - 1 ? "Get Started" : "Next"}
            onPress={goToNextSlide}
            icon={
              currentIndex === slides.length - 1 ? null : <ArrowRight size={20} color="#FFFFFF" />
            }
            size="medium"
            style={{ marginLeft: currentIndex > 0 ? 12 : 0 }}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  buttonsContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  dot: {
    borderRadius: 4,
    height: 8,
    marginHorizontal: 4,
  },
  image: {
    height: width * 0.8,
    marginBottom: 40,
    resizeMode: "contain",
    width: width * 0.8,
  },
  navButton: {
    alignItems: "center",
    backgroundColor: "rgba(150, 150, 150, 0.1)",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  navigationContainer: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    position: "absolute",
    right: 0,
  },
  paginationContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  skipButton: {
    position: "absolute",
    right: 20,
    top: 20,
  },
  skipText: {
    fontSize: 16,
    opacity: 0.7,
  },
  slide: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  textContainer: {
    alignItems: "center",
    width: width * 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
})
