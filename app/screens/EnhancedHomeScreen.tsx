"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { Text } from "../components/Text"
import { CustomNavigationHeader } from "../components/CustomNavigationHeader"
import { useAuthStore } from "../stores/authStore"
import { workoutApi, progressApi, exerciseApi } from "../services/api"
import { Calendar, TrendingUp, Award } from "lucide-react-native"
import { useTheme } from "@react-navigation/native"

const { width } = Dimensions.get("window")

const EnhancedHomeScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const { user } = useAuthStore()
  const [greeting, setGreeting] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  // Animation values
  const headerScale = useSharedValue(0.9)
  const statsOpacity = useSharedValue(0)

  // Fetch user progress
  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: () => (user ? progressApi.getUserProgress(user.id) : Promise.resolve([])),
    enabled: !!user,
  })

  // Fetch workouts
  const { data: workouts, isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ["workouts"],
    queryFn: workoutApi.getWorkouts,
  })

  // Fetch favorite exercises
  const { data: favoriteExercises, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ["favoriteExercises", user?.id],
    queryFn: () => (user ? exerciseApi.getFavoriteExercises(user.id) : Promise.resolve([])),
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
    <View style={styles.container}>
      <CustomNavigationHeader title="FitnessPro" showMenuButton={true} onMenuPress={handleOpenDrawer} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View>
            <Text variant="caption">{greeting}</Text>
            <Text variant="header">{user?.username || "Fitness Enthusiast"}</Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
          <View style={styles.statCard}>
            <Calendar size={20} color="#0A84FF" />
            <Text variant="title" style={styles.statValue}>
              {totalWorkouts}
            </Text>
            <Text variant="caption">Workouts</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={20} color="#32D74B" />
            <Text variant="title" style={styles.statValue}>
              {Math.round(totalMinutes)}
            </Text>
            <Text variant="caption">Minutes</Text>
          </View>

          <View style={styles.statCard}>
            <Award size={20} color="#FF9500" />
            <Text variant="title" style={styles.statValue}>
              {totalCalories}
            </Text>
            <Text variant="caption">Calories</Text>
          </View>
        </Animated.View>

        {/* Continue Workout */}
        {progress && progress.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.sectionHeader}>
              <Text variant="subtitle">Continue Your Progress</Text>
              <TouchableOpacity>
                <Text variant="button">See All</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.continueCard} onPress={() => handleExercisePress(progress[0].exercise_id)}>
              <Image source={{ uri: progress[0].exercises.thumbnail_url }} style={styles.continueImage} />
              <View style={styles.continueInfo}>
                <Text variant="subtitle" numberOfLines={1}>
                  {progress[0].exercises.name}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min((progress[0].duration / progress[0].exercises.duration) * 100, 100)}%` },
                    ]}
                  />
                </View>
                <Text variant="caption">
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
              <Text variant="button">See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutsScroll}>
            {isLoadingWorkouts ? (
              <View style={styles.loadingContainer}>
                <Text>Loading workouts...</Text>
              </View>
            ) : (
              workouts?.map((workout, index) => (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.workoutCard}
                  onPress={() => handleWorkoutPress(workout.id)}
                >
                  <Image source={{ uri: workout.image_url }} style={styles.workoutImage} />
                  <View style={styles.workoutInfo}>
                    <Text variant="subtitle" numberOfLines={1}>
                      {workout.name}
                    </Text>
                    <Text variant="caption" numberOfLines={1}>
                      {workout.duration} min • {workout.calories} cal
                    </Text>
                    <View style={styles.difficultyBadge}>
                      <Text
                        variant="caption"
                        style={[styles.difficultyText, styles[`difficulty${workout.difficulty}`]]}
                      >
                        {workout.difficulty}
                      </Text>
                    </View>
                  </View>
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
                <Text variant="button">See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exercisesScroll}>
              {isLoadingFavorites ? (
                <View style={styles.loadingContainer}>
                  <Text>Loading favorites...</Text>
                </View>
              ) : (
                favoriteExercises?.map((exercise, index) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={styles.exerciseCard}
                    onPress={() => handleExercisePress(exercise.id)}
                  >
                    <Image source={{ uri: exercise.thumbnail_url }} style={styles.exerciseImage} />
                    <View style={styles.exerciseInfo}>
                      <Text variant="caption" numberOfLines={2}>
                        {exercise.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Animated.View>
        )}

        {/* Spacer for bottom tabs */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerActions: {
    flexDirection: "row",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: (width - 56) / 3,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 20,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  continueImage: {
    width: 80,
    height: 80,
  },
  continueInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E5EA",
    borderRadius: 2,
    marginVertical: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#32D74B",
    borderRadius: 2,
  },
  workoutsScroll: {
    paddingLeft: 20,
  },
  workoutCard: {
    width: width * 0.7,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workoutImage: {
    width: "100%",
    height: width * 0.4,
  },
  workoutInfo: {
    padding: 12,
  },
  difficultyBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 4,
    overflow: "hidden",
  },
  difficultyText: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "capitalize",
  },
  difficultybeginner: {
    backgroundColor: "#E9F7FF",
    color: "#0A84FF",
  },
  difficultyintermediate: {
    backgroundColor: "#FFF3E0",
    color: "#FF9500",
  },
  difficultyadvanced: {
    backgroundColor: "#FFE5E5",
    color: "#FF3B30",
  },
  exercisesScroll: {
    paddingLeft: 20,
  },
  exerciseCard: {
    width: width * 0.3,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseImage: {
    width: "100%",
    height: width * 0.3,
  },
  exerciseInfo: {
    padding: 8,
  },
  loadingContainer: {
    width: width * 0.7,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 16,
  },
})

export default EnhancedHomeScreen
