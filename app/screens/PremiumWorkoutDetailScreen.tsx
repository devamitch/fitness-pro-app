"use client"

import type React from "react"
import { useState, useRef } from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Share, Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeIn,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { useQuery } from "@tanstack/react-query"
import { Text } from "../components/Text"
import { GlassMorphicCard } from "../components/GlassMorphicCard"
import { AnimatedButton } from "../components/AnimatedButton"
import { LazyImage } from "../components/LazyImage"
import { useTheme } from "../theme/theme"
import { useWorkoutStore } from "../stores/workoutStore"
import { workoutApi } from "../services/api"
import { cacheManager } from "../utils/cacheManager"
import { ArrowLeft, Heart, Share2, Clock, Flame, Dumbbell, ChevronRight, Play, Download } from "lucide-react-native"

const { width, height } = Dimensions.get("window")
const HEADER_HEIGHT = 300
const isTablet = width >= 768

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

export const PremiumWorkoutDetailScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const route = useRoute()
  const { workoutId } = route.params as { workoutId: string }

  const [isFavorite, setIsFavorite] = useState(false)
  const scrollY = useSharedValue(0)
  const scrollViewRef = useRef<ScrollView>(null)

  const { toggleFavoriteWorkout, setCurrentWorkout } = useWorkoutStore()

  // Fetch workout data
  const { data: workout, isLoading } = useQuery({
    queryKey: ["workout", workoutId],
    queryFn: async () => {
      try {
        // Try to get from cache first
        const cached = await cacheManager.get(`workout-${workoutId}`)
        if (cached) return cached

        const data = await workoutApi.getWorkoutById(workoutId)

        // Cache the result
        await cacheManager.set(`workout-${workoutId}`, data)

        return data
      } catch (error) {
        console.error("Error fetching workout:", error)
        throw error
      }
    },
  })

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  // Animated styles
  const headerStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        scrollY.value,
        [-100, 0, HEADER_HEIGHT],
        [HEADER_HEIGHT + 100, HEADER_HEIGHT, 0],
        Extrapolation.CLAMP,
      ),
      opacity: interpolate(scrollY.value, [0, HEADER_HEIGHT / 2, HEADER_HEIGHT], [1, 0.5, 0], Extrapolation.CLAMP),
    }
  })

  const headerTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [HEADER_HEIGHT - 100, HEADER_HEIGHT - 50], [0, 1], Extrapolation.CLAMP),
    }
  })

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    if (!workout) return

    const result = await toggleFavoriteWorkout(workout.id)
    setIsFavorite(result)
  }

  // Handle share
  const handleShare = async () => {
    if (!workout) return

    try {
      await Share.share({
        title: workout.name,
        message: `Check out this workout: ${workout.name}`,
        url: `https://fitnessapp.com/workout/${workout.id}`,
      })
    } catch (error) {
      console.error("Error sharing workout:", error)
    }
  }

  // Handle start workout
  const handleStartWorkout = () => {
    if (!workout) return

    setCurrentWorkout(workout)
    navigation.navigate("Exercise", { exerciseId: workout.exercises[0].id })
  }

  // Handle download workout
  const handleDownloadWorkout = async () => {
    if (!workout) return

    // Cache workout data for offline use
    await cacheManager.set(`workout-${workout.id}`, workout, 30 * 24 * 60 * 60 * 1000) // 30 days

    // Cache exercise data
    for (const exercise of workout.exercises) {
      await cacheManager.set(`exercise-${exercise.id}`, exercise, 30 * 24 * 60 * 60 * 1000) // 30 days
    }

    // Show success message
    alert("Workout downloaded for offline use")
  }

  if (isLoading || !workout) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <Text>Loading workout...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <LazyImage
          source={{ uri: workout.image_url }}
          style={StyleSheet.absoluteFill}
          placeholderColor={theme.colors.background.tertiary}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.7)", "transparent", "rgba(0,0,0,0.7)"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: "rgba(0,0,0,0.3)" }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Header Content */}
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <Text variant="header" style={{ color: "#FFFFFF" }}>
              {workout.name}
            </Text>
            <View style={styles.headerStats}>
              <View style={styles.statItem}>
                <Clock size={16} color="#FFFFFF" />
                <Text variant="caption" style={{ color: "#FFFFFF", marginLeft: 4 }}>
                  {workout.duration} min
                </Text>
              </View>
              <View style={styles.statItem}>
                <Flame size={16} color="#FFFFFF" />
                <Text variant="caption" style={{ color: "#FFFFFF", marginLeft: 4 }}>
                  {workout.calories} cal
                </Text>
              </View>
              <View style={styles.statItem}>
                <Dumbbell size={16} color="#FFFFFF" />
                <Text variant="caption" style={{ color: "#FFFFFF", marginLeft: 4 }}>
                  {workout.exercises.length} exercises
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "rgba(0,0,0,0.3)" }]}
              onPress={handleToggleFavorite}
            >
              <Heart
                size={20}
                color={isFavorite ? theme.colors.status.error : "#FFFFFF"}
                fill={isFavorite ? theme.colors.status.error : "none"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "rgba(0,0,0,0.3)" }]}
              onPress={handleShare}
            >
              <Share2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Sticky Header */}
      <Animated.View
        style={[styles.stickyHeader, { backgroundColor: theme.colors.background.secondary }, headerTitleStyle]}
      >
        <View style={styles.stickyHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text variant="subtitle" numberOfLines={1} style={{ flex: 1, marginLeft: 16 }}>
            {workout.name}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleToggleFavorite}>
              <Heart
                size={20}
                color={isFavorite ? theme.colors.status.error : theme.colors.text.primary}
                fill={isFavorite ? theme.colors.status.error : "none"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Share2 size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <AnimatedScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
      >
        {/* Description */}
        <Animated.View entering={FadeIn.delay(100).duration(300)}>
          <GlassMorphicCard style={styles.section}>
            <Text variant="subtitle" style={styles.sectionTitle}>
              Description
            </Text>
            <Text variant="body" style={{ color: theme.colors.text.secondary }}>
              {workout.description}
            </Text>
          </GlassMorphicCard>
        </Animated.View>

        {/* Difficulty */}
        <Animated.View entering={FadeIn.delay(200).duration(300)}>
          <GlassMorphicCard style={styles.section}>
            <Text variant="subtitle" style={styles.sectionTitle}>
              Difficulty
            </Text>
            <View style={styles.difficultyContainer}>
              <View
                style={[
                  styles.difficultyBar,
                  {
                    backgroundColor: theme.colors.background.tertiary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.difficultyFill,
                    {
                      width:
                        workout.difficulty === "beginner"
                          ? "33%"
                          : workout.difficulty === "intermediate"
                            ? "66%"
                            : "100%",
                      backgroundColor:
                        workout.difficulty === "beginner"
                          ? theme.colors.primary
                          : workout.difficulty === "intermediate"
                            ? theme.colors.accent
                            : theme.colors.status.error,
                    },
                  ]}
                />
              </View>
              <View style={styles.difficultyLabels}>
                <Text
                  variant="caption"
                  style={{
                    color: workout.difficulty === "beginner" ? theme.colors.primary : theme.colors.text.tertiary,
                  }}
                >
                  Beginner
                </Text>
                <Text
                  variant="caption"
                  style={{
                    color: workout.difficulty === "intermediate" ? theme.colors.accent : theme.colors.text.tertiary,
                  }}
                >
                  Intermediate
                </Text>
                <Text
                  variant="caption"
                  style={{
                    color: workout.difficulty === "advanced" ? theme.colors.status.error : theme.colors.text.tertiary,
                  }}
                >
                  Advanced
                </Text>
              </View>
            </View>
          </GlassMorphicCard>
        </Animated.View>

        {/* Exercises */}
        <Animated.View entering={FadeIn.delay(300).duration(300)}>
          <GlassMorphicCard style={styles.section}>
            <Text variant="subtitle" style={styles.sectionTitle}>
              Exercises ({workout.exercises.length})
            </Text>
            {workout.exercises.map((exercise, index) => (
              <TouchableOpacity
                key={exercise.id}
                style={[
                  styles.exerciseItem,
                  index < workout.exercises.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.card.border,
                  },
                ]}
                onPress={() => navigation.navigate("Exercise", { exerciseId: exercise.id })}
              >
                <View style={styles.exerciseInfo}>
                  <View style={styles.exerciseImageContainer}>
                    <LazyImage
                      source={{ uri: exercise.thumbnail_url }}
                      style={styles.exerciseImage}
                      placeholderColor={theme.colors.background.tertiary}
                    />
                    <View style={[styles.exerciseNumber, { backgroundColor: theme.colors.primary }]}>
                      <Text style={{ color: theme.colors.text.inverse, fontSize: 12 }}>{index + 1}</Text>
                    </View>
                  </View>
                  <View style={styles.exerciseDetails}>
                    <Text variant="subtitle" numberOfLines={1}>
                      {exercise.name}
                    </Text>
                    <View style={styles.exerciseStats}>
                      <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                        {exercise.sets} sets • {exercise.reps} reps • {exercise.duration}s
                      </Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </GlassMorphicCard>
        </Animated.View>

        {/* Equipment */}
        {workout.equipment && workout.equipment.length > 0 && (
          <Animated.View entering={FadeIn.delay(400).duration(300)}>
            <GlassMorphicCard style={styles.section}>
              <Text variant="subtitle" style={styles.sectionTitle}>
                Equipment Needed
              </Text>
              <View style={styles.equipmentContainer}>
                {workout.equipment.map((item, index) => (
                  <View
                    key={index}
                    style={[styles.equipmentItem, { backgroundColor: theme.colors.background.tertiary }]}
                  >
                    <Text variant="caption">{item}</Text>
                  </View>
                ))}
              </View>
            </GlassMorphicCard>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View entering={FadeIn.delay(500).duration(300)} style={styles.actionButtons}>
          <AnimatedButton
            title="Start Workout"
            onPress={handleStartWorkout}
            variant="primary"
            size="large"
            icon={<Play size={20} color={theme.colors.text.inverse} />}
            style={{ flex: 1, marginRight: 8 }}
          />
          <AnimatedButton
            title="Download"
            onPress={handleDownloadWorkout}
            variant="outline"
            size="large"
            icon={<Download size={20} color={theme.colors.primary} />}
            style={{ width: 130 }}
          />
        </Animated.View>

        {/* Bottom Spacer */}
        <View style={{ height: insets.bottom + 20 }} />
      </AnimatedScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 1,
    overflow: "hidden",
  },
  headerContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: 20,
  },
  headerInfo: {
    flex: 1,
    marginRight: 16,
  },
  headerStats: {
    flexDirection: "row",
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  headerActions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 20,
    zIndex: 10,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 90 : 60,
    zIndex: 2,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  stickyHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: "100%",
    paddingTop: Platform.OS === "ios" ? 40 : 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  difficultyContainer: {
    marginTop: 8,
  },
  difficultyBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  difficultyFill: {
    height: "100%",
    borderRadius: 4,
  },
  difficultyLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  exerciseInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  exerciseImageContainer: {
    position: "relative",
    marginRight: 12,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  exerciseNumber: {
    position: "absolute",
    top: -5,
    left: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseStats: {
    flexDirection: "row",
    marginTop: 4,
  },
  equipmentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  equipmentItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 24,
  },
})
