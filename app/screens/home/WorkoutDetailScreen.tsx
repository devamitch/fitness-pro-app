"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import { useRoute, useNavigation, type RouteProp } from "@react-navigation/native"
import Animated, { FadeInDown } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../../components/ui/Text"
import { useWorkoutApi } from "../../services/api"
import { ArrowLeft, Clock, Flame, Heart, Share } from "lucide-react-native"

const { width } = Dimensions.get("window")

type WorkoutDetailScreenRouteProp = RouteProp<
  {
    WorkoutDetail: { workoutId: string }
  },
  "WorkoutDetail"
>

export default function WorkoutDetailScreen() {
  const route = useRoute<WorkoutDetailScreenRouteProp>()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [isFavorite, setIsFavorite] = useState(false)

  const workoutApi = useWorkoutApi()

  // Fetch workout details
  const { data: workout, isLoading } = workoutApi.useGetWorkoutById(route.params.workoutId)

  // Toggle favorite
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  // Start workout
  const startWorkout = () => {
    if (workout && workout.workout_exercises && workout.workout_exercises.length > 0) {
      // Navigate to the first exercise in the workout
      navigation.navigate("Exercise", { exerciseId: workout.workout_exercises[0].exercise_id })
    }
  }

  if (isLoading || !workout) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="body">Loading workout details...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Workout Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: workout.image_url }} style={styles.workoutImage} />
          <TouchableOpacity style={[styles.backButton, { top: insets.top || 20 }]} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.imageOverlay} />
        </View>

        {/* Workout Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text variant="header" numberOfLines={2} style={styles.title}>
              {workout.name}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
                <Heart size={24} color={isFavorite ? "#FF3B30" : "#8E8E93"} fill={isFavorite ? "#FF3B30" : "none"} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Share size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Clock size={16} color="#8E8E93" />
              <Text variant="caption" style={styles.statText}>
                {workout.duration} min
              </Text>
            </View>
            <View style={styles.statItem}>
              <Flame size={16} color="#8E8E93" />
              <Text variant="caption" style={styles.statText}>
                {workout.calories} cal
              </Text>
            </View>
            <View style={styles.difficultyBadge}>
              <Text variant="caption" style={[styles.difficultyText, styles[`difficulty${workout.difficulty}`]]}>
                {workout.difficulty}
              </Text>
            </View>
          </View>

          <Text variant="body" style={styles.description}>
            {workout.description}
          </Text>

          {/* Exercises List */}
          <Text variant="subtitle" style={styles.sectionTitle}>
            Exercises ({workout.workout_exercises.length})
          </Text>

          {workout.workout_exercises
            .sort((a, b) => a.order_index - b.order_index)
            .map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(index * 100).springify()}>
                <TouchableOpacity
                  style={styles.exerciseItem}
                  onPress={() => navigation.navigate("Exercise", { exerciseId: item.exercise_id })}
                >
                  <View style={styles.exerciseIndex}>
                    <Text variant="subtitle">{index + 1}</Text>
                  </View>
                  <Image source={{ uri: item.exercises.thumbnail_url }} style={styles.exerciseThumbnail} />
                  <View style={styles.exerciseInfo}>
                    <Text variant="subtitle" numberOfLines={1}>
                      {item.exercises.name}
                    </Text>
                    <Text variant="caption">
                      {Math.floor(item.exercises.duration / 60)} min • {item.exercises.calories} cal
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 20 }]}>
        <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
          <Text variant="button" style={styles.startButtonText}>
            Start Workout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    height: width * 0.7,
  },
  workoutImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    backgroundGradient: {
      colors: ["transparent", "rgba(0, 0, 0, 0.7)"],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
  },
  infoContainer: {
    padding: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    flex: 1,
    marginRight: 16,
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
  },
  difficultyBadge: {
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
  description: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  exerciseThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    padding: 16,
  },
  startButton: {
    backgroundColor: "#0A84FF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
})
