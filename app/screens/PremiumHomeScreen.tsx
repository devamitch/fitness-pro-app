"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Text } from "../components/Text"
import { LazyImage } from "../components/LazyImage"
import { GlassMorphicCard } from "../components/GlassMorphicCard"
import { VitalReportsChart } from "../components/VitalReportsChart"
import { MinimizedPlayer } from "../components/MinimizedPlayer"
import { useAuthStore } from "../stores/authStore"
import { useTheme } from "../theme/theme"
import { workoutApi, progressApi, exerciseApi } from "../services/api"
import { cacheManager } from "../utils/cacheManager"
import { offlineManager } from "../utils/offlineManager"
import { screenSnapshotManager } from "../utils/screenSnapshotManager"
import { tutorialManager } from "../utils/tutorialManager"
import { Calendar, TrendingUp, Award, Bell, MessageCircle, Menu, Search } from "lucide-react-native"

const { width } = Dimensions.get("window")
const isTablet = width >= 768

export const PremiumHomeScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [greeting, setGreeting] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  const screenRef = useRef(null)

  // Animation values
  const headerScale = useSharedValue(0.9)
  const statsOpacity = useSharedValue(0)

  // Check offline status
  useEffect(() => {
    const checkOfflineStatus = async () => {
      const offline = !(await offlineManager.isOnline())
      setIsOffline(offline)
    }

    checkOfflineStatus()

    // Initialize tutorial
    tutorialManager.registerAppTutorial()
  }, [])

  // Fetch user progress with offline support
  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: async () => {
      try {
        // Try to get from cache first
        const cached = await cacheManager.get(`progress-${user?.id}`)
        if (cached) return cached

        // If offline, return empty array
        if (!(await offlineManager.isOnline())) {
          setIsOffline(true)
          return []
        }

        const data = await progressApi.getUserProgress(user?.id || "")

        // Cache the result
        await cacheManager.set(`progress-${user?.id}`, data)

        return data
      } catch (error) {
        console.error("Error fetching progress:", error)
        return []
      }
    },
    enabled: !!user,
  })

  // Fetch workouts with offline support
  const { data: workouts, isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ["workouts"],
    queryFn: async () => {
      try {
        // Try to get from cache first
        const cached = await cacheManager.get("workouts")
        if (cached) return cached

        // If offline, return empty array
        if (!(await offlineManager.isOnline())) {
          setIsOffline(true)
          return []
        }

        const data = await workoutApi.getWorkouts()

        // Cache the result
        await cacheManager.set("workouts", data)

        return data
      } catch (error) {
        console.error("Error fetching workouts:", error)
        return []
      }
    },
  })

  // Fetch favorite exercises with offline support
  const { data: favoriteExercises, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ["favoriteExercises", user?.id],
    queryFn: async () => {
      try {
        // Try to get from cache first
        const cached = await cacheManager.get(`favorite-exercises-${user?.id}`)
        if (cached) return cached

        // If offline, return empty array
        if (!(await offlineManager.isOnline())) {
          setIsOffline(true)
          return []
        }

        const data = await exerciseApi.getFavoriteExercises(user?.id || "")

        // Cache the result
        await cacheManager.set(`favorite-exercises-${user?.id}`, data)

        return data
      } catch (error) {
        console.error("Error fetching favorite exercises:", error)
        return []
      }
    },
    enabled: !!user,
  })

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting("Good morning")
    } else if (hour < 18) {
      setGreeting("Good afternoon")
    } else {
      setGreeting("Good evening")
    }

    // Animate header and stats
    headerScale.value = withSpring(1, { damping: 15, stiffness: 150 })
    statsOpacity.value = withSpring(1, { damping: 20, stiffness: 100 })
  }, [])

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)

    // Check if online
    if (await offlineManager.isOnline()) {
      setIsOffline(false)

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ["progress", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["workouts"] })
      queryClient.invalidateQueries({ queryKey: ["favoriteExercises", user?.id] })

      // Process offline queue
      await offlineManager.processQueue()
    }

    // Take a snapshot of the screen
    if (screenRef.current) {
      try {
        await screenSnapshotManager.captureScreen(screenRef.current, "Home", {
          timestamp: Date.now(),
          userId: user?.id,
        })
      } catch (error) {
        console.error("Failed to capture screen:", error)
      }
    }

    setRefreshing(false)
  }

  // Calculate stats
  const totalWorkouts = progress ? progress.length : 0
  const totalMinutes = progress ? progress.reduce((acc, curr) => acc + curr.duration / 60, 0) : 0
  const totalCalories = progress ? progress.reduce((acc, curr) => acc + curr.calories_burned, 0) : 0

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: headerScale.value }],
    }
  })

  const statsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: statsOpacity.value,
    }
  })

  // Navigate to workout detail
  const handleWorkoutPress = (workoutId: string) => {
    navigation.navigate("WorkoutDetail", { workoutId })
  }

  // Navigate to exercise
  const handleExercisePress = (exerciseId: string) => {
    navigation.navigate("Exercise", { exerciseId })
  }

  // Navigate to chat
  const handleChatPress = () => {
    navigation.navigate("Chat")
  }

  // Open drawer
  const handleOpenDrawer = () => {
    navigation.openDrawer()
  }

  // Generate mock data for vital reports chart
  const generateMockVitalData = () => {
    const now = new Date()
    const heartRateData = []
    const caloriesData = []
    const stepsData = []

    // Generate data for the past week
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      heartRateData.push({
        date,
        value: 60 + Math.floor(Math.random() * 40), // 60-100 bpm
      })

      caloriesData.push({
        date,
        value: 1500 + Math.floor(Math.random() * 1000), // 1500-2500 calories
      })

      stepsData.push({
        date,
        value: 5000 + Math.floor(Math.random() * 7000), // 5000-12000 steps
      })
    }

    return {
      heartRate: heartRateData,
      calories: caloriesData,
      steps: stepsData,
    }
  }

  return (
    <View
      ref={screenRef}
      style={[styles.container, { backgroundColor: theme.colors.background.primary, paddingTop: insets.top }]}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={[
          theme.dark ? "rgba(10, 132, 255, 0.1)" : "rgba(10, 132, 255, 0.05)",
          theme.dark ? "rgba(50, 215, 75, 0.1)" : "rgba(50, 215, 75, 0.05)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleOpenDrawer}>
              <Menu size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                {greeting}
              </Text>
              <Text variant="header">{user?.username || "Fitness Enthusiast"}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Search")}>
              <BlurView intensity={80} tint={theme.dark ? "dark" : "light"} style={styles.blurButton}>
                <Search size={20} color={theme.colors.text.primary} />
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleChatPress}>
              <BlurView intensity={80} tint={theme.dark ? "dark" : "light"} style={styles.blurButton}>
                <MessageCircle size={20} color={theme.colors.text.primary} />
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Notifications")}>
              <BlurView intensity={80} tint={theme.dark ? "dark" : "light"} style={styles.blurButton}>
                <Bell size={20} color={theme.colors.text.primary} />
              </BlurView>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Offline indicator */}
        {isOffline && (
          <View style={[styles.offlineContainer, { backgroundColor: theme.colors.status.warning }]}>
            <Text style={styles.offlineText}>You're offline. Some features may be limited.</Text>
          </View>
        )}

        {/* Stats */}
        <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
          <GlassMorphicCard style={styles.statCard}>
            <Calendar size={20} color={theme.colors.primary} />
            <Text variant="title" style={styles.statValue}>
              {totalWorkouts}
            </Text>
            <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
              Workouts
            </Text>
          </GlassMorphicCard>

          <GlassMorphicCard style={styles.statCard}>
            <TrendingUp size={20} color={theme.colors.secondary} />
            <Text variant="title" style={styles.statValue}>
              {Math.round(totalMinutes)}
            </Text>
            <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
              Minutes
            </Text>
          </GlassMorphicCard>

          <GlassMorphicCard style={styles.statCard}>
            <Award size={20} color={theme.colors.accent} />
            <Text variant="title" style={styles.statValue}>
              {totalCalories}
            </Text>
            <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
              Calories
            </Text>
          </GlassMorphicCard>
        </Animated.View>

        {/* Vital Reports Chart */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <VitalReportsChart data={generateMockVitalData()} />
        </Animated.View>

        {/* Continue Workout */}
        {progress && progress.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.sectionHeader}>
              <Text variant="subtitle">Continue Your Progress</Text>
              <TouchableOpacity>
                <Text variant="button" style={{ color: theme.colors.primary }}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.continueCard} onPress={() => handleExercisePress(progress[0].exercise_id)}>
              <LazyImage
                source={{ uri: progress[0].exercises.thumbnail_url }}
                style={styles.continueImage}
                placeholderColor={theme.colors.background.tertiary}
              />
              <View style={styles.continueInfo}>
                <Text variant="subtitle" numberOfLines={1}>
                  {progress[0].exercises.name}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min((progress[0].duration / progress[0].exercises.duration) * 100, 100)}%`,
                        backgroundColor: theme.colors.secondary,
                      },
                    ]}
                  />
                </View>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  {Math.round((progress[0].duration / progress[0].exercises.duration) * 100)}% completed
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Recommended Workouts */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Recommended Workouts</Text>
            <TouchableOpacity onPress={() => navigation.navigate("WorkoutsList")}>
              <Text variant="button" style={{ color: theme.colors.primary }}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutsScroll}>
            {isLoadingWorkouts ? (
              <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.secondary }]}>
                <Text>Loading workouts...</Text>
              </View>
            ) : (
              workouts?.map((workout, index) => (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.workoutCard}
                  onPress={() => handleWorkoutPress(workout.id)}
                >
                  <LazyImage
                    source={{ uri: workout.image_url }}
                    style={styles.workoutImage}
                    placeholderColor={theme.colors.background.tertiary}
                  />
                  <GlassMorphicCard style={styles.workoutInfo}>
                    <Text variant="subtitle" numberOfLines={1}>
                      {workout.name}
                    </Text>
                    <Text variant="caption" numberOfLines={1} style={{ color: theme.colors.text.tertiary }}>
                      {workout.duration} min • {workout.calories} cal
                    </Text>
                    <View
                      style={[
                        styles.difficultyBadge,
                        {
                          backgroundColor:
                            workout.difficulty === "beginner"
                              ? "rgba(10, 132, 255, 0.2)"
                              : workout.difficulty === "intermediate"
                                ? "rgba(255, 149, 0, 0.2)"
                                : "rgba(255, 59, 48, 0.2)",
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={[
                          styles.difficultyText,
                          {
                            color:
                              workout.difficulty === "beginner"
                                ? theme.colors.primary
                                : workout.difficulty === "intermediate"
                                  ? theme.colors.accent
                                  : theme.colors.status.error,
                          },
                        ]}
                      >
                        {workout.difficulty}
                      </Text>
                    </View>
                  </GlassMorphicCard>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Animated.View>

        {/* Favorite Exercises */}
        {favoriteExercises && favoriteExercises.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <View style={styles.sectionHeader}>
              <Text variant="subtitle">Your Favorites</Text>
              <TouchableOpacity>
                <Text variant="button" style={{ color: theme.colors.primary }}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exercisesScroll}>
              {isLoadingFavorites ? (
                <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.secondary }]}>
                  <Text>Loading favorites...</Text>
                </View>
              ) : (
                favoriteExercises?.map((exercise, index) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={styles.exerciseCard}
                    onPress={() => handleExercisePress(exercise.id)}
                  >
                    <LazyImage
                      source={{ uri: exercise.thumbnail_url }}
                      style={styles.exerciseImage}
                      placeholderColor={theme.colors.background.tertiary}
                    />
                    <GlassMorphicCard style={styles.exerciseInfo}>
                      <Text variant="caption" numberOfLines={2}>
                        {exercise.name}
                      </Text>
                    </GlassMorphicCard>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Animated.View>
        )}

        {/* Spacer for bottom tabs */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Minimized Player */}
      <MinimizedPlayer />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: "row",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    overflow: "hidden",
  },
  blurButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  offlineContainer: {
    padding: 8,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    padding: 16,
    alignItems: "center",
    width: (width - 56) / 3,
  },
  statValue: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 24,
  },
  continueCard: {
    flexDirection: "row",
    backgroundColor: "transparent",
    borderRadius: 12,
    marginHorizontal: 20,
    overflow: "hidden",
    marginBottom: 24,
  },
  continueImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  continueInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    marginVertical: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  workoutsScroll: {
    paddingLeft: 20,
  },
  workoutCard: {
    width: width * 0.7,
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
  },
  workoutImage: {
    width: "100%",
    height: width * 0.4,
    borderRadius: 12,
  },
  workoutInfo: {
    padding: 12,
    marginTop: -40,
    marginHorizontal: 10,
    borderRadius: 12,
  },
  difficultyBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    textTransform: "capitalize",
  },
  exercisesScroll: {
    paddingLeft: 20,
  },
  exerciseCard: {
    width: width * 0.3,
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
  },
  exerciseImage: {
    width: "100%",
    height: width * 0.3,
    borderRadius: 12,
  },
  exerciseInfo: {
    padding: 8,
    marginTop: -30,
    marginHorizontal: 6,
    borderRadius: 12,
  },
  loadingContainer: {
    width: width * 0.7,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginRight: 16,
  },
})
