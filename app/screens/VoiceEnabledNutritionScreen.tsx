"use client"

import { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { Text } from "../components/Text"
import { withVoiceEnabledScreen } from "../hocs/withVoiceEnabledScreen"
import { createVoiceCommand } from "../hofs/createVoiceCommand"
import { useVoiceAssistant } from "../contexts/VoiceAssistantContext"
import { VoiceAssistantButton } from "../components/voice/VoiceAssistantButton"
import { VoiceCommandListener } from "../components/voice/VoiceCommandListener"
import { VoiceVisualization } from "../components/voice/VoiceVisualization"
import { useVoiceData } from "../hooks/useVoiceData"
import { useTheme } from "../theme/theme"
import {
  ArrowLeft,
  Plus,
  Search,
  Mic,
  MicOff,
  X,
  Check,
  PieChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native"

// Food item type
interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize: string
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
}

// Mock food database
const foodDatabase: FoodItem[] = [
  {
    id: "1",
    name: "Chicken Breast",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    servingSize: "100g",
    mealType: "lunch",
  },
  {
    id: "2",
    name: "Brown Rice",
    calories: 112,
    protein: 2.6,
    carbs: 23.5,
    fat: 0.9,
    servingSize: "100g",
    mealType: "lunch",
  },
  {
    id: "3",
    name: "Broccoli",
    calories: 34,
    protein: 2.8,
    carbs: 6.6,
    fat: 0.4,
    servingSize: "100g",
    mealType: "dinner",
  },
  {
    id: "4",
    name: "Salmon",
    calories: 206,
    protein: 22,
    carbs: 0,
    fat: 13,
    servingSize: "100g",
    mealType: "dinner",
  },
  {
    id: "5",
    name: "Oatmeal",
    calories: 68,
    protein: 2.4,
    carbs: 12,
    fat: 1.4,
    servingSize: "100g",
    mealType: "breakfast",
  },
  {
    id: "6",
    name: "Banana",
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    servingSize: "100g",
    mealType: "breakfast",
  },
  {
    id: "7",
    name: "Greek Yogurt",
    calories: 59,
    protein: 10,
    carbs: 3.6,
    fat: 0.4,
    servingSize: "100g",
    mealType: "breakfast",
  },
  {
    id: "8",
    name: "Almonds",
    calories: 579,
    protein: 21.2,
    carbs: 21.7,
    fat: 49.9,
    servingSize: "100g",
    mealType: "snack",
  },
  {
    id: "9",
    name: "Apple",
    calories: 52,
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2,
    servingSize: "100g",
    mealType: "snack",
  },
  {
    id: "10",
    name: "Egg",
    calories: 155,
    protein: 12.6,
    carbs: 0.6,
    fat: 10.6,
    servingSize: "100g",
    mealType: "breakfast",
  },
]

const VoiceEnabledNutritionScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { speak, stopSpeaking } = useVoiceAssistant()

  const [searchQuery, setSearchQuery] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [foodLog, setFoodLog] = useState<FoodItem[]>([])
  const [showAddFoodModal, setShowAddFoodModal] = useState(false)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>(foodDatabase)

  // Voice data for visualization
  const voiceData = useVoiceData({
    isRecording,
    simulateData: true,
    sensitivity: 1,
    baseAmplitude: 0.6,
    baseFrequency: 0.5,
    baseEnergy: 0.7,
  })

  // Animation values
  const summaryCardScale = useSharedValue(0.95)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  // Filter foods based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFoods(foodDatabase)
    } else {
      const filtered = foodDatabase.filter((food) => food.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredFoods(filtered)
    }
  }, [searchQuery])

  // Animate summary card on mount
  useEffect(() => {
    summaryCardScale.value = withSpring(1, { damping: 15, stiffness: 150 })
  }, [])

  // Format date
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }
    return date.toLocaleDateString("en-US", options)
  }

  // Change date
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  // Start recording
  const handleStartRecording = () => {
    setIsRecording(true)
    speak("I'm listening. You can say things like 'add chicken breast to lunch' or 'search for apples'.")
  }

  // Stop recording
  const handleStopRecording = () => {
    setIsRecording(false)

    // Simulate speech-to-text result
    const recognizedText = "add chicken breast to lunch"
    processVoiceCommand(recognizedText)
  }

  // Process voice command
  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase()

    // Handle search command
    if (lowerCommand.includes("search for") || lowerCommand.includes("find")) {
      const searchTerm = lowerCommand.replace(/search for|find/gi, "").trim()
      setSearchQuery(searchTerm)
      speak(`Searching for ${searchTerm}`)
      return
    }

    // Handle add food command
    if (lowerCommand.includes("add")) {
      const foodName = lowerCommand.replace(/add|to breakfast|to lunch|to dinner|to snack/gi, "").trim()

      let mealType: "breakfast" | "lunch" | "dinner" | "snack" = "lunch"
      if (lowerCommand.includes("breakfast")) mealType = "breakfast"
      if (lowerCommand.includes("lunch")) mealType = "lunch"
      if (lowerCommand.includes("dinner")) mealType = "dinner"
      if (lowerCommand.includes("snack")) mealType = "snack"

      const foundFood = foodDatabase.find((food) => food.name.toLowerCase().includes(foodName))

      if (foundFood) {
        const foodToAdd = { ...foundFood, mealType }
        setFoodLog([...foodLog, foodToAdd])
        speak(`Added ${foundFood.name} to your ${mealType}`)
      } else {
        speak(`I couldn't find ${foodName} in the database. Please try another food.`)
      }

      return
    }

    // Handle summary command
    if (lowerCommand.includes("summary") || lowerCommand.includes("total") || lowerCommand.includes("calories")) {
      const totalCalories = foodLog.reduce((sum, food) => sum + food.calories, 0)
      const totalProtein = foodLog.reduce((sum, food) => sum + food.protein, 0)
      const totalCarbs = foodLog.reduce((sum, food) => sum + food.carbs, 0)
      const totalFat = foodLog.reduce((sum, food) => sum + food.fat, 0)

      speak(
        `Your nutrition summary for today: ${totalCalories} calories, ${Math.round(totalProtein)}g protein, ${Math.round(totalCarbs)}g carbs, and ${Math.round(totalFat)}g fat.`,
      )
      return
    }

    // Handle clear command
    if (lowerCommand.includes("clear") || lowerCommand.includes("reset")) {
      setFoodLog([])
      speak("Food log cleared for today.")
      return
    }

    // Default response
    speak(
      "I didn't understand that command. You can say things like 'add chicken breast to lunch' or 'search for apples'.",
    )
  }

  // Add food to log
  const addFoodToLog = () => {
    if (selectedFood) {
      setFoodLog([...foodLog, selectedFood])
      setSelectedFood(null)
      setShowAddFoodModal(false)
      speak(`Added ${selectedFood.name} to your ${selectedFood.mealType}`)
    }
  }

  // Calculate nutrition totals
  const calculateTotals = () => {
    const totals = {
      calories: foodLog.reduce((sum, food) => sum + food.calories, 0),
      protein: foodLog.reduce((sum, food) => sum + food.protein, 0),
      carbs: foodLog.reduce((sum, food) => sum + food.carbs, 0),
      fat: foodLog.reduce((sum, food) => sum + food.fat, 0),
    }

    return totals
  }

  // Get foods by meal type
  const getFoodsByMealType = (mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    return foodLog.filter((food) => food.mealType === mealType)
  }

  // Calculate meal totals
  const calculateMealTotals = (mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    const mealFoods = getFoodsByMealType(mealType)

    const totals = {
      calories: mealFoods.reduce((sum, food) => sum + food.calories, 0),
      protein: mealFoods.reduce((sum, food) => sum + food.protein, 0),
      carbs: mealFoods.reduce((sum, food) => sum + food.carbs, 0),
      fat: mealFoods.reduce((sum, food) => sum + food.fat, 0),
    }

    return totals
  }

  // Remove food from log
  const removeFood = (foodId: string) => {
    const updatedLog = foodLog.filter((food) => food.id !== foodId)
    setFoodLog(updatedLog)
  }

  // Animated styles
  const summaryCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: summaryCardScale.value }],
    }
  })

  // Voice commands
  const nutritionCommands = [
    createVoiceCommand(
      {
        id: "nutrition_add_food",
        phrases: ["add food", "log food", "track food", "record food"],
        category: "nutrition",
        description: "Add food to your nutrition log",
        examples: ['"Add food"', '"Log food"'],
      },
      () => setShowAddFoodModal(true),
    ),
    createVoiceCommand(
      {
        id: "nutrition_search",
        phrases: ["search for food", "find food", "search food database", "look up food"],
        category: "nutrition",
        description: "Search for food in the database",
        examples: ['"Search for food"', '"Find food"'],
      },
      () => setShowAddFoodModal(true),
    ),
    createVoiceCommand(
      {
        id: "nutrition_summary",
        phrases: ["nutrition summary", "calorie summary", "macros summary", "daily summary"],
        category: "nutrition",
        description: "Get a summary of your nutrition for the day",
        examples: ['"Nutrition summary"', '"Calorie summary"'],
      },
      () => {
        const totals = calculateTotals()
        speak(
          `Your nutrition summary for today: ${totals.calories} calories, ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, and ${Math.round(totals.fat)}g fat.`,
        )
      },
    ),
    createVoiceCommand(
      {
        id: "nutrition_clear",
        phrases: ["clear food log", "reset food log", "delete all foods", "start over"],
        category: "nutrition",
        description: "Clear your food log for the day",
        examples: ['"Clear food log"', '"Reset food log"'],
      },
      () => {
        setFoodLog([])
        speak("Food log cleared for today.")
      },
    ),
    createVoiceCommand(
      {
        id: "nutrition_previous_day",
        phrases: ["previous day", "yesterday", "day before", "go back a day"],
        category: "nutrition",
        description: "View the previous day's food log",
        examples: ['"Previous day"', '"Yesterday"'],
      },
      () => changeDate(-1),
    ),
    createVoiceCommand(
      {
        id: "nutrition_next_day",
        phrases: ["next day", "tomorrow", "day after", "go forward a day"],
        category: "nutrition",
        description: "View the next day's food log",
        examples: ['"Next day"', '"Tomorrow"'],
      },
      () => changeDate(1),
    ),
  ]

  return (
    <VoiceCommandListener commands={nutritionCommands}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top || 16,
              backgroundColor: theme.colors.background.secondary,
              borderBottomColor: theme.colors.card.border,
            },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text variant="title">Nutrition Tracker</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddFoodModal(true)}>
            <Plus size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Date Selector */}
          <View style={styles.dateSelector}>
            <TouchableOpacity onPress={() => changeDate(-1)}>
              <ChevronLeft size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>

            <Text variant="subtitle" style={{ color: theme.colors.text.primary }}>
              {formatDate(selectedDate)}
            </Text>

            <TouchableOpacity onPress={() => changeDate(1)}>
              <ChevronRight size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Nutrition Summary */}
          <Animated.View
            style={[styles.summaryCard, { backgroundColor: theme.colors.background.secondary }, summaryCardStyle]}
          >
            <View style={styles.summaryHeader}>
              <View style={styles.summaryHeaderLeft}>
                <PieChart size={24} color={theme.colors.primary} />
                <Text variant="subtitle" style={{ color: theme.colors.text.primary, marginLeft: 8 }}>
                  Daily Summary
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  const totals = calculateTotals()
                  speak(
                    `Your nutrition summary for today: ${totals.calories} calories, ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, and ${Math.round(totals.fat)}g fat.`,
                  )
                }}
              >
                <Mic size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.macrosContainer}>
              <View style={styles.macroItem}>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  Calories
                </Text>
                <Text variant="title" style={{ color: theme.colors.primary }}>
                  {calculateTotals().calories}
                </Text>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  kcal
                </Text>
              </View>

              <View style={styles.macroItem}>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  Protein
                </Text>
                <Text variant="title" style={{ color: theme.colors.secondary }}>
                  {Math.round(calculateTotals().protein)}
                </Text>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  g
                </Text>
              </View>

              <View style={styles.macroItem}>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  Carbs
                </Text>
                <Text variant="title" style={{ color: theme.colors.accent }}>
                  {Math.round(calculateTotals().carbs)}
                </Text>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  g
                </Text>
              </View>

              <View style={styles.macroItem}>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  Fat
                </Text>
                <Text variant="title" style={{ color: theme.colors.status.warning }}>
                  {Math.round(calculateTotals().fat)}
                </Text>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  g
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Meals */}
          <View style={styles.mealsContainer}>
            {/* Breakfast */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              style={[styles.mealCard, { backgroundColor: theme.colors.background.secondary }]}
            >
              <View style={styles.mealHeader}>
                <Text variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  Breakfast
                </Text>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  {calculateMealTotals("breakfast").calories} kcal
                </Text>
              </View>

              {getFoodsByMealType("breakfast").length > 0 ? (
                getFoodsByMealType("breakfast").map((food) => (
                  <View key={food.id} style={styles.foodItem}>
                    <View style={styles.foodInfo}>
                      <Text variant="body" style={{ color: theme.colors.text.primary }}>
                        {food.name}
                      </Text>
                      <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                        {food.servingSize} • {food.calories} kcal
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFood(food.id)}>
                      <X size={18} color={theme.colors.status.error} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text
                  variant="caption"
                  style={{ color: theme.colors.text.tertiary, textAlign: "center", marginTop: 8 }}
                >
                  No breakfast logged yet
                </Text>
              )}

              <TouchableOpacity
                style={[styles.addFoodButton, { borderColor: theme.colors.card.border }]}
                onPress={() => {
                  setSelectedFood({ ...foodDatabase[0], mealType: "breakfast" })
                  setShowAddFoodModal(true)
                }}
              >
                <Plus size={16} color={theme.colors.primary} />
                <Text variant="caption" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                  Add Food
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Lunch */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={[styles.mealCard, { backgroundColor: theme.colors.background.secondary }]}
            >
              <View style={styles.mealHeader}>
                <Text variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  Lunch
                </Text>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  {calculateMealTotals("lunch").calories} kcal
                </Text>
              </View>

              {getFoodsByMealType("lunch").length > 0 ? (
                getFoodsByMealType("lunch").map((food) => (
                  <View key={food.id} style={styles.foodItem}>
                    <View style={styles.foodInfo}>
                      <Text variant="body" style={{ color: theme.colors.text.primary }}>
                        {food.name}
                      </Text>
                      <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                        {food.servingSize} • {food.calories} kcal
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFood(food.id)}>
                      <X size={18} color={theme.colors.status.error} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text
                  variant="caption"
                  style={{ color: theme.colors.text.tertiary, textAlign: "center", marginTop: 8 }}
                >
                  No lunch logged yet
                </Text>
              )}

              <TouchableOpacity
                style={[styles.addFoodButton, { borderColor: theme.colors.card.border }]}
                onPress={() => {
                  setSelectedFood({ ...foodDatabase[0], mealType: "lunch" })
                  setShowAddFoodModal(true)
                }}
              >
                <Plus size={16} color={theme.colors.primary} />
                <Text variant="caption" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                  Add Food
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Dinner */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              style={[styles.mealCard, { backgroundColor: theme.colors.background.secondary }]}
            >
              <View style={styles.mealHeader}>
                <Text variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  Dinner
                </Text>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  {calculateMealTotals("dinner").calories} kcal
                </Text>
              </View>

              {getFoodsByMealType("dinner").length > 0 ? (
                getFoodsByMealType("dinner").map((food) => (
                  <View key={food.id} style={styles.foodItem}>
                    <View style={styles.foodInfo}>
                      <Text variant="body" style={{ color: theme.colors.text.primary }}>
                        {food.name}
                      </Text>
                      <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                        {food.servingSize} • {food.calories} kcal
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFood(food.id)}>
                      <X size={18} color={theme.colors.status.error} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text
                  variant="caption"
                  style={{ color: theme.colors.text.tertiary, textAlign: "center", marginTop: 8 }}
                >
                  No dinner logged yet
                </Text>
              )}

              <TouchableOpacity
                style={[styles.addFoodButton, { borderColor: theme.colors.card.border }]}
                onPress={() => {
                  setSelectedFood({ ...foodDatabase[0], mealType: "dinner" })
                  setShowAddFoodModal(true)
                }}
              >
                <Plus size={16} color={theme.colors.primary} />
                <Text variant="caption" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                  Add Food
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Snacks */}
            <Animated.View
              entering={FadeInDown.delay(400).springify()}
              style={[styles.mealCard, { backgroundColor: theme.colors.background.secondary }]}
            >
              <View style={styles.mealHeader}>
                <Text variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  Snacks
                </Text>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  {calculateMealTotals("snack").calories} kcal
                </Text>
              </View>

              {getFoodsByMealType("snack").length > 0 ? (
                getFoodsByMealType("snack").map((food) => (
                  <View key={food.id} style={styles.foodItem}>
                    <View style={styles.foodInfo}>
                      <Text variant="body" style={{ color: theme.colors.text.primary }}>
                        {food.name}
                      </Text>
                      <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                        {food.servingSize} • {food.calories} kcal
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFood(food.id)}>
                      <X size={18} color={theme.colors.status.error} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text
                  variant="caption"
                  style={{ color: theme.colors.text.tertiary, textAlign: "center", marginTop: 8 }}
                >
                  No snacks logged yet
                </Text>
              )}

              <TouchableOpacity
                style={[styles.addFoodButton, { borderColor: theme.colors.card.border }]}
                onPress={() => {
                  setSelectedFood({ ...foodDatabase[0], mealType: "snack" })
                  setShowAddFoodModal(true)
                }}
              >
                <Plus size={16} color={theme.colors.primary} />
                <Text variant="caption" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                  Add Food
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Add Food Modal */}
        <Modal
          visible={showAddFoodModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddFoodModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.background.primary }]}>
              <View style={styles.modalHeader}>
                <Text variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  Add Food
                </Text>
                <TouchableOpacity onPress={() => setShowAddFoodModal(false)}>
                  <X size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.background.secondary }]}>
                  <Search size={20} color={theme.colors.text.tertiary} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.colors.text.primary }]}
                    placeholder="Search for food..."
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {isRecording ? (
                    <TouchableOpacity onPress={handleStopRecording}>
                      <MicOff size={20} color={theme.colors.status.error} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={handleStartRecording}>
                      <Mic size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {isRecording && (
                <View style={[styles.recordingContainer, { backgroundColor: theme.colors.background.secondary }]}>
                  <VoiceVisualization
                    voiceData={voiceData}
                    variant="wave"
                    size="component"
                    width={200}
                    height={60}
                    colors={[theme.colors.primary, theme.colors.secondary]}
                  />
                </View>
              )}

              <FlatList
                data={filteredFoods}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.foodListItem,
                      {
                        backgroundColor:
                          selectedFood?.id === item.id
                            ? `${theme.colors.primary}20`
                            : theme.colors.background.secondary,
                      },
                    ]}
                    onPress={() => setSelectedFood({ ...item, mealType: selectedFood?.mealType || "lunch" })}
                  >
                    <View style={styles.foodListItemInfo}>
                      <Text variant="body" style={{ color: theme.colors.text.primary }}>
                        {item.name}
                      </Text>
                      <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                        {item.servingSize} • {item.calories} kcal
                      </Text>
                    </View>
                    {selectedFood?.id === item.id && <Check size={20} color={theme.colors.primary} />}
                  </TouchableOpacity>
                )}
                style={styles.foodList}
                contentContainerStyle={styles.foodListContent}
              />

              {selectedFood && (
                <View style={styles.mealTypeSelector}>
                  <Text variant="body" style={{ color: theme.colors.text.primary, marginRight: 8 }}>
                    Add to:
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.mealTypeButton,
                      {
                        backgroundColor:
                          selectedFood.mealType === "breakfast"
                            ? theme.colors.primary
                            : theme.colors.background.secondary,
                      },
                    ]}
                    onPress={() => setSelectedFood({ ...selectedFood, mealType: "breakfast" })}
                  >
                    <Text
                      variant="caption"
                      style={{
                        color:
                          selectedFood.mealType === "breakfast" ? theme.colors.text.inverse : theme.colors.text.primary,
                      }}
                    >
                      Breakfast
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.mealTypeButton,
                      {
                        backgroundColor:
                          selectedFood.mealType === "lunch" ? theme.colors.primary : theme.colors.background.secondary,
                      },
                    ]}
                    onPress={() => setSelectedFood({ ...selectedFood, mealType: "lunch" })}
                  >
                    <Text
                      variant="caption"
                      style={{
                        color:
                          selectedFood.mealType === "lunch" ? theme.colors.text.inverse : theme.colors.text.primary,
                      }}
                    >
                      Lunch
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.mealTypeButton,
                      {
                        backgroundColor:
                          selectedFood.mealType === "dinner" ? theme.colors.primary : theme.colors.background.secondary,
                      },
                    ]}
                    onPress={() => setSelectedFood({ ...selectedFood, mealType: "dinner" })}
                  >
                    <Text
                      variant="caption"
                      style={{
                        color:
                          selectedFood.mealType === "dinner" ? theme.colors.text.inverse : theme.colors.text.primary,
                      }}
                    >
                      Dinner
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.mealTypeButton,
                      {
                        backgroundColor:
                          selectedFood.mealType === "snack" ? theme.colors.primary : theme.colors.background.secondary,
                      },
                    ]}
                    onPress={() => setSelectedFood({ ...selectedFood, mealType: "snack" })}
                  >
                    <Text
                      variant="caption"
                      style={{
                        color:
                          selectedFood.mealType === "snack" ? theme.colors.text.inverse : theme.colors.text.primary,
                      }}
                    >
                      Snack
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    backgroundColor: selectedFood ? theme.colors.primary : theme.colors.background.secondary,
                    opacity: selectedFood ? 1 : 0.5,
                  },
                ]}
                onPress={addFoodToLog}
                disabled={!selectedFood}
              >
                <Text
                  variant="button"
                  style={{
                    color: selectedFood ? theme.colors.text.inverse : theme.colors.text.tertiary,
                  }}
                >
                  Add to Log
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Voice Assistant Button */}
        <VoiceAssistantButton position="bottom-right" size="medium" />
      </KeyboardAvoidingView>
    </VoiceCommandListener>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  dateSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroItem: {
    alignItems: "center",
  },
  mealsContainer: {
    marginBottom: 24,
  },
  mealCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.1)",
  },
  foodInfo: {
    flex: 1,
  },
  addFoodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 16,
  },
  recordingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  foodList: {
    flex: 1,
  },
  foodListContent: {
    paddingBottom: 16,
  },
  foodListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  foodListItemInfo: {
    flex: 1,
  },
  mealTypeSelector: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  mealTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
})

// Export voice-enabled nutrition screen
export default withVoiceEnabledScreen(VoiceEnabledNutritionScreen, [])
