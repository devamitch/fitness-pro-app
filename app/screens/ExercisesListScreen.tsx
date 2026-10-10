"use client"

import { useState } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated"
import { Text } from "../components/Text"
import { exerciseApi } from "../services/api"
import { Search, Filter } from "lucide-react-native"

const { width } = Dimensions.get("window")

export const ExercisesListScreen = () => {
  const navigation = useNavigation()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch exercises
  const { data: exercises, isLoading } = useQuery({
    queryKey: ["exercises"],
    queryFn: exerciseApi.getExercises,
  })

  // Get unique categories
  const categories = exercises ? [...new Set(exercises.map((exercise) => exercise.categories.name))] : []

  // Filter exercises
  const filteredExercises = exercises
    ? exercises.filter((exercise) => {
        const matchesCategory = selectedCategory ? exercise.categories.name === selectedCategory : true

        const matchesSearch = searchQuery
          ? exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exercise.description.toLowerCase().includes(searchQuery.toLowerCase())
          : true

        return matchesCategory && matchesSearch
      })
    : []

  // Navigate to exercise detail
  const handleExercisePress = (exerciseId: string) => {
    navigation.navigate("Exercise", { exerciseId })
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

  // Render exercise item
  const renderExerciseItem = ({ item, index }) => {
    return (
      <Animated.View entering={FadeInRight.delay(index * 100).springify()} exiting={FadeOutLeft}>
        <TouchableOpacity style={styles.exerciseCard} onPress={() => handleExercisePress(item.id)}>
          <Image source={{ uri: item.thumbnail_url }} style={styles.exerciseImage} resizeMode="cover" />
          <View style={styles.exerciseInfo}>
            <Text variant="subtitle" numberOfLines={1}>
              {item.name}
            </Text>
            <Text variant="caption" numberOfLines={2} style={styles.exerciseDescription}>
              {item.description}
            </Text>
            <View style={styles.exerciseMeta}>
              <View style={styles.metaItem}>
                <Text variant="caption" style={styles.metaLabel}>
                  {Math.floor(item.duration / 60)} min
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="header">Exercises</Text>
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

      {/* Exercises list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text variant="body">Loading exercises...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.exercisesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="body">No exercises found</Text>
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
    marginVertical: 16,
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
  exercisesList: {
    padding: 20,
  },
  exerciseCard: {
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
  exerciseImage: {
    width: width * 0.25,
    height: width * 0.25,
  },
  exerciseInfo: {
    flex: 1,
    padding: 12,
  },
  exerciseDescription: {
    marginTop: 4,
    marginBottom: 8,
  },
  exerciseMeta: {
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
