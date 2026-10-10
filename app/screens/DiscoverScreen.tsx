"use client"
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import Animated, { FadeInDown } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components/Text"
import { exerciseApi, workoutApi } from "../services/api"
import { Search, Filter, Play } from "lucide-react-native"

const { width } = Dimensions.get("window")

export const DiscoverScreen = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  // Fetch workouts
  const { data: workouts, isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ["workouts"],
    queryFn: workoutApi.getWorkouts,
  })

  // Fetch exercises
  const { data: exercises, isLoading: isLoadingExercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: exerciseApi.getExercises,
  })

  // Navigate to workout detail
  const handleWorkoutPress = (workoutId: string) => {
    navigation.navigate("WorkoutDetail", { workoutId })
  }

  // Navigate to exercise
  const handleExercisePress = (exerciseId: string) => {
    navigation.navigate("Exercise", { exerciseId })
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="header">Discover</Text>
          <View style={styles.searchContainer}>
            <Search size={20} color="#8E8E93" style={styles.searchIcon} />
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={20} color="#0A84FF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Workout */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Featured Workout</Text>
          </View>

          {isLoadingWorkouts ? (
            <View style={styles.featuredLoadingContainer}>
              <Text>Loading featured workout...</Text>
            </View>
          ) : (
            workouts && (
              <TouchableOpacity style={styles.featuredCard} onPress={() => handleWorkoutPress(workouts[0].id)}>
                <Image source={{ uri: workouts[0].image_url }} style={styles.featuredImage} />
                <View style={styles.featuredOverlay} />
                <View style={styles.featuredContent}>
                  <View style={styles.difficultyBadge}>
                    <Text
                      variant="caption"
                      style={[styles.difficultyText, styles[`difficulty${workouts[0].difficulty}`]]}
                    >
                      {workouts[0].difficulty}
                    </Text>
                  </View>
                  <Text variant="title" style={styles.featuredTitle}>
                    {workouts[0].name}
                  </Text>
                  <Text variant="caption" style={styles.featuredSubtitle}>
                    {workouts[0].duration} min • {workouts[0].calories} cal
                  </Text>
                  <TouchableOpacity style={styles.playButton} onPress={() => handleWorkoutPress(workouts[0].id)}>
                    <Play size={20} color="#FFFFFF" />
                    <Text variant="button" style={styles.playButtonText}>
                      Start Workout
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )
          )}
        </Animated.View>

        {/* Popular Workouts */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Popular Workouts</Text>
            <TouchableOpacity>
              <Text variant="button">See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutsScroll}>
            {isLoadingWorkouts ? (
              <View style={styles.loadingContainer}>
                <Text>Loading workouts...</Text>
              </View>
            ) : (
              workouts?.slice(1, 5).map((workout) => (
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

        {/* Trending Exercises */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Trending Exercises</Text>
            <TouchableOpacity onPress={() => navigation.navigate("ExercisesTab")}>
              <Text variant="button">See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.exercisesGrid}>
            {isLoadingExercises ? (
              <View style={styles.loadingContainer}>
                <Text>Loading exercises...</Text>
              </View>
            ) : (
              exercises?.slice(0, 4).map((exercise, index) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={[styles.exerciseCard, { marginRight: index % 2 === 0 ? 16 : 0 }]}
                  onPress={() => handleExercisePress(exercise.id)}
                >
                  <Image source={{ uri: exercise.thumbnail_url }} style={styles.exerciseImage} />
                  <View style={styles.exerciseInfo}>
                    <Text variant="subtitle" numberOfLines={1}>
                      {exercise.name}
                    </Text>
                    <Text variant="caption" numberOfLines={1}>
                      {Math.floor(exercise.duration / 60)} min • {exercise.calories} cal
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </Animated.View>

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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 24,
  },
  featuredCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    height: 200,
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  featuredContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredTitle: {
    color: "#FFFFFF",
    marginBottom: 4,
  },
  featuredSubtitle: {
    color: "#FFFFFF",
    marginBottom: 16,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A84FF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  playButtonText: {
    color: "#FFFFFF",
    marginLeft: 8,
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
  exercisesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
  },
  exerciseCard: {
    width: (width - 56) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginRight: 16,
  },
  exerciseCard: {
    width: (width - 56) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginRight: 16,
  },
  exerciseCard: {
    width: (width - 56) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseCard: {
    width: (width - 56) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginRight: index % 2 === 0 ? 16 : 0,
  },
  exerciseImage: {
    width: "100%",
    height: (width - 56) / 4,
  },
  exerciseInfo: {
    padding: 12,
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
  featuredLoadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
  },
})
