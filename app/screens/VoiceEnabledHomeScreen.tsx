"use client"
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Text } from "../components/Text"
import { withVoiceEnabledScreen } from "../hocs/withVoiceEnabledScreen"
import { createVoiceCommand, createWorkoutCommand } from "../hofs/createVoiceCommand"
import { useTheme } from "../theme/theme"
import { Dumbbell, User, Settings, Bell, Play } from "lucide-react-native"

const HomeScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation()

  // Navigate to workout
  const navigateToWorkout = (workoutId: string) => {
    navigation.navigate("WorkoutDetail", { workoutId })
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text variant="header" style={[styles.title, { color: theme.colors.text.primary }]}>
          Welcome to Fitness App
        </Text>

        <Text variant="subtitle" style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          Try using voice commands like "Start HIIT workout" or "Show my profile"
        </Text>

        <View style={styles.section}>
          <Text variant="title" style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background.secondary }]}
              onPress={() => navigation.navigate("Exercises")}
            >
              <Dumbbell size={24} color={theme.colors.primary} />
              <Text variant="button" style={[styles.actionText, { color: theme.colors.text.primary }]}>
                Exercises
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background.secondary }]}
              onPress={() => navigation.navigate("Profile")}
            >
              <User size={24} color={theme.colors.primary} />
              <Text variant="button" style={[styles.actionText, { color: theme.colors.text.primary }]}>
                Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background.secondary }]}
              onPress={() => navigation.navigate("Settings")}
            >
              <Settings size={24} color={theme.colors.primary} />
              <Text variant="button" style={[styles.actionText, { color: theme.colors.text.primary }]}>
                Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background.secondary }]}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Bell size={24} color={theme.colors.primary} />
              <Text variant="button" style={[styles.actionText, { color: theme.colors.text.primary }]}>
                Notifications
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="title" style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Recommended Workouts
          </Text>
          <View style={styles.workoutsContainer}>
            <TouchableOpacity
              style={[styles.workoutCard, { backgroundColor: theme.colors.background.secondary }]}
              onPress={() => navigateToWorkout("hiit")}
            >
              <View style={styles.workoutInfo}>
                <Text variant="subtitle" style={[styles.workoutTitle, { color: theme.colors.text.primary }]}>
                  HIIT Workout
                </Text>
                <Text variant="caption" style={[styles.workoutDescription, { color: theme.colors.text.secondary }]}>
                  30 min • High Intensity
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigateToWorkout("hiit")}
              >
                <Play size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.workoutCard, { backgroundColor: theme.colors.background.secondary }]}
              onPress={() => navigateToWorkout("strength")}
            >
              <View style={styles.workoutInfo}>
                <Text variant="subtitle" style={[styles.workoutTitle, { color: theme.colors.text.primary }]}>
                  Strength Training
                </Text>
                <Text variant="caption" style={[styles.workoutDescription, { color: theme.colors.text.secondary }]}>
                  45 min • Intermediate
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigateToWorkout("strength")}
              >
                <Play size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.workoutCard, { backgroundColor: theme.colors.background.secondary }]}
              onPress={() => navigateToWorkout("yoga")}
            >
              <View style={styles.workoutInfo}>
                <Text variant="subtitle" style={[styles.workoutTitle, { color: theme.colors.text.primary }]}>
                  Yoga Flow
                </Text>
                <Text variant="caption" style={[styles.workoutDescription, { color: theme.colors.text.secondary }]}>
                  20 min • Beginner
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigateToWorkout("yoga")}
              >
                <Play size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  actionText: {
    marginTop: 8,
  },
  workoutsContainer: {
    marginBottom: 16,
  },
  workoutCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    marginBottom: 4,
  },
  workoutDescription: {},
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
})

// Define voice commands for this screen
const homeScreenCommands = [
  createWorkoutCommand(
    "hiit",
    "HIIT",
    (workoutId) => {
      const navigation = useNavigation()
      navigation.navigate("WorkoutDetail", { workoutId })
    },
    "hiit",
  ),
  createWorkoutCommand(
    "strength",
    "Strength Training",
    (workoutId) => {
      const navigation = useNavigation()
      navigation.navigate("WorkoutDetail", { workoutId })
    },
    "strength",
  ),
  createWorkoutCommand(
    "yoga",
    "Yoga Flow",
    (workoutId) => {
      const navigation = useNavigation()
      navigation.navigate("WorkoutDetail", { workoutId })
    },
    "yoga",
  ),
  createVoiceCommand(
    {
      id: "home_ai_coach",
      phrases: ["talk to coach", "open ai coach", "chat with coach", "start coaching"],
      category: "navigation",
      description: "Open the AI Coach chat",
      examples: ['"Talk to coach"', '"Open AI coach"'],
    },
    () => {
      const navigation = useNavigation()
      navigation.navigate("Chat")
    },
  ),
]

// Export voice-enabled home screen
export const VoiceEnabledHomeScreen = withVoiceEnabledScreen(HomeScreen, homeScreenCommands)
