"use client"

import { useState } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import Animated, { FadeInRight } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../../components/ui/Text"
import { useWorkoutApi } from "../../services/api"
import { Search, Filter, ArrowLeft } from "lucide-react-native"

const { width } = Dimensions.get("window")

export default function WorkoutListScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)

  const workoutApi = useWorkoutApi()

  // Fetch workouts
  const { data: workouts, isLoading } = workoutApi.useGetWorkouts()

  // Get unique categories
  const categories = workouts ? [...new Set(workouts.map((workout) => workout.category))] : []

  // Get unique difficulties
  const difficulties = ["beginner", "intermediate", "advanced"]

  // Filter workouts
  const filteredWorkouts = workouts
    ? workouts.filter((workout) => {
        const matchesCategory = selectedCategory ? workout.category === selectedCategory : true
        const matchesDifficulty = selectedDifficulty ? workout.difficulty === selectedDifficulty : true
        const matchesSearch = searchQuery
          ? workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            workout.description.toLowerCase().includes(searchQuery.toLowerCase())
          : true

        return matchesCategory && matchesDifficulty && matchesSearch
      })
    : []

  // Navigate to workout detail
  const handleWorkoutPress = (workoutId: string) => {
    navigation.navigate("WorkoutDetail", { workoutId })
  }

  // Render category pill
  const renderCategoryPill = (category: string) => {
    const isSelected = category === selectedCategory

    return (
      <TouchableOpacity
        key={category}
        style={[styles.categoryPill, isSelected && styles.selectedCategoryPill]}
        onPress={() => {
          setSelectedCategory(isSelected ? null : category)
        }}
      >
        <Text variant="caption" style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
          {category}
        </Text>
      </TouchableOpacity>
    )
  }

  // Render difficulty pill
  const renderDifficultyPill = (difficulty: string) => {
    const isSelected = difficulty === selectedDifficulty

    return (
      <TouchableOpacity
        key={difficulty}
        style={[styles.difficultyPill, isSelected && styles.selectedDifficultyPill]}
        onPress={() => {
          setSelectedDifficulty(isSelected ? null : difficulty)
        }}
      >
        <Text variant="caption" style={[styles.difficultyText, isSelected && styles.selectedDifficultyText]}>
          {difficulty}
        </Text>
      </TouchableOpacity>
    )
  }

  // Render workout item
  const renderWorkoutItem = ({ item, index }) => {
    return (
      <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
        <TouchableOpacity style={styles.workoutCard} onPress={() => handleWorkoutPress(item.id)}>
          <Image source={{ uri: item.image_url }} style={styles.workoutImage} />
          <View style={styles.workoutInfo}>
            <Text variant="subtitle" numberOfLines={1}>
              {item.name}
            </Text>
            <Text variant="caption" numberOfLines={2} style={styles.workoutDescription}>
              {item.description}
            </Text>
            <View style={styles.workoutMeta}>
              <View style={styles.metaItem}>
                <Text variant="caption" style={styles.metaLabel}>
                  {item.duration} min
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text variant="caption" style={styles.metaLabel}>
                  {item.calories} cal
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text variant="caption" style={[styles.difficultyLabel, styles[`difficulty${item.difficulty}`]]}>
                  {item.difficulty}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0A84FF" />
        </TouchableOpacity>
        <Text variant="header">Workouts</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color="#8E8E93" style={styles.searchIcon} />
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#0A84FF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={({ item }) => renderCategoryPill(item)}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Difficulties */}
      <View style={styles.difficultiesContainer}>
        <FlatList
          data={difficulties}
          renderItem={({ item }) => renderDifficultyPill(item)}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.difficultiesList}
        />
      </View>

      {/* Workouts list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text variant="body">Loading workouts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.workoutsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="body">No workouts found</Text>
            </View>
          }
        />
      )}
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
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
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
  categoriesContainer: {
    marginVertical: 8,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  selectedCategoryPill: {
    backgroundColor: "#0A84FF",
  },
  categoryText: {
    color: "#8E8E93",
  },
  selectedCategoryText: {
    color: "#FFFFFF",
  },
  difficultiesContainer: {
    marginBottom: 8,
  },
  difficultiesList: {
    paddingHorizontal: 20,
  },
  difficultyPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  selectedDifficultyPill: {
    backgroundColor: "#0A84FF",
  },
  difficultyText: {
    color: "#8E8E93",
  },
  selectedDifficultyText: {
    color: "#FFFFFF",
  },
  workoutsList: {
    padding: 20,
  },
  workoutCard: {
    flexDirection: "row",
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
  workoutImage: {
    width: width * 0.25,
    height: width * 0.25,
  },
  workoutInfo: {
    flex: 1,
    padding: 12,
  },
  workoutDescription: {
    marginTop: 4,
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaLabel: {
    color: "#8E8E93",
  },
  difficultyLabel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
    textAlign: "center",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
})
