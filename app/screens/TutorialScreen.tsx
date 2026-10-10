"use client"

import { IMAGES } from "@/assets/images"
import { storage } from "@/utils/storage"
import { useNavigation } from "@react-navigation/native"
import { useRef, useState } from "react"
import { Dimensions, FlatList, Image, StyleSheet, TouchableOpacity, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components/Text"

const { width, height } = Dimensions.get("window")

// Tutorial slides
const slides = [
  {
    id: "1",
    title: "Welcome to FitTrack",
    description:
      "Your personal fitness companion for tracking workouts, monitoring progress, and achieving your goals.",
    image: IMAGES.logo,
  },
  {
    id: "2",
    title: "Smart Workout Tracking",
    description:
      "Our AI-powered pose detection ensures you perform exercises correctly and tracks your form in real-time.",
    image: IMAGES.logo,
  },
  {
    id: "3",
    title: "Personalized Workouts",
    description:
      "Get customized workout plans based on your fitness level, goals, and available equipment.",
    image: IMAGES.logo,
  },
  {
    id: "4",
    title: "Track Your Progress",
    description:
      "Monitor your improvements over time with detailed statistics and visual progress charts.",
    image: IMAGES.logo,
  },
]

export const TutorialScreen = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  // Animation values
  const imageScale = useSharedValue(0.8)
  const textOpacity = useSharedValue(0)

  // Animated styles
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: imageScale.value }],
    }
  })

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    }
  })

  // Handle slide change
  const handleSlideChange = (index: number) => {
    setCurrentIndex(index)

    // Animate image and text
    imageScale.value = withTiming(0.8, { duration: 100 }, () => {
      imageScale.value = withTiming(1, { duration: 300 })
    })

    textOpacity.value = withTiming(0, { duration: 100 }, () => {
      textOpacity.value = withTiming(1, { duration: 300 })
    })
  }

  // Skip tutorial
  const skipTutorial = () => {
    storage.set("tutorial-completed", "true")
    navigation.navigate("Main")
  }

  // Next slide
  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
    } else {
      skipTutorial()
    }
  }

  // Render slide item
  const renderSlideItem = ({ item }: { item: (typeof slides)[0] }) => {
    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
          <Image source={item.image} style={styles.image} resizeMode="contain" />
        </Animated.View>
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
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

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={skipTutorial}>
        <Text variant="button">Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlideItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width)
          handleSlideChange(index)
        }}
      />

      {/* Pagination */}
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.paginationDot, index === currentIndex && styles.paginationDotActive]}
          />
        ))}
      </View>

      {/* Next button */}
      <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
        <Text variant="button" style={styles.nextButtonText}>
          {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  description: {
    color: "#8E8E93",
    textAlign: "center",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  imageContainer: {
    alignItems: "center",
    height: height * 0.4,
    justifyContent: "center",
    marginBottom: 40,
    width: width * 0.8,
  },
  nextButton: {
    alignSelf: "center",
    backgroundColor: "#0A84FF",
    borderRadius: 12,
    marginBottom: 40,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  nextButtonText: {
    color: "#FFFFFF",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 40,
  },
  paginationDot: {
    backgroundColor: "#E5E5EA",
    borderRadius: 5,
    height: 10,
    marginHorizontal: 8,
    width: 10,
  },
  paginationDotActive: {
    backgroundColor: "#0A84FF",
    width: 20,
  },
  skipButton: {
    position: "absolute",
    right: 20,
    top: 20,
    zIndex: 10,
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    width,
  },
  textContainer: {
    alignItems: "center",
    width: width * 0.8,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
})
