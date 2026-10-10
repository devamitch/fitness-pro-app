import { createStackNavigator } from "@react-navigation/stack"
import { createDrawerNavigator } from "@react-navigation/drawer"
import { useWindowDimensions } from "react-native"

import TabNavigator from "./TabNavigator"
import SplashScreen from "../screens/SplashScreen"
import AuthScreen from "../screens/EnhancedAuthScreen"
import OnboardingScreen from "../screens/OnboardingScreen"
import OnboardingQuestionnaireScreen from "../screens/OnboardingQuestionnaireScreen"
import ExerciseScreen from "../screens/ExerciseScreen"
import EnhancedExerciseScreen from "../screens/EnhancedExerciseScreen"
import WorkoutDetailScreen from "../screens/WorkoutDetailScreen"
import TutorialScreen from "../screens/TutorialScreen"
import ExerciseRecommendationsScreen from "../screens/ExerciseRecommendationsScreen"
import NotificationsScreen from "../screens/NotificationsScreen"
import EnhancedChatScreen from "../screens/EnhancedChatScreen"
import AICoachScreen from "../screens/AICoachScreen"
import VoiceRecordingScreen from "../screens/VoiceRecordingScreen"
import VoiceComponentsShowcaseScreen from "../screens/VoiceComponentsShowcaseScreen"
import VoiceEnabledHomeScreen from "../screens/VoiceEnabledHomeScreen"
import VoiceSettingsScreen from "../screens/VoiceSettingsScreen"
import VoiceCommandHelpScreen from "../screens/VoiceCommandHelpScreen"
import VoiceEnabledAIWorkoutPlanScreen from "../screens/VoiceEnabledAIWorkoutPlanScreen"
import SavedWorkoutPlansScreen from "../screens/SavedWorkoutPlansScreen"
import WorkoutPlanDetailScreen from "../screens/WorkoutPlanDetailScreen"

import { CustomDrawer } from "../components/CustomDrawer"
import { useAuthStore } from "../stores/authStore"

const Stack = createStackNavigator()
const Drawer = createDrawerNavigator()

const DrawerNavigator = () => {
  const dimensions = useWindowDimensions()
  const isLargeScreen = dimensions.width >= 768

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: isLargeScreen ? "permanent" : "front",
        drawerStyle: isLargeScreen ? { width: "20%" } : { width: "70%" },
      }}
    >
      <Drawer.Screen name="TabNavigator" component={TabNavigator} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
      <Drawer.Screen name="VoiceSettings" component={VoiceSettingsScreen} />
      <Drawer.Screen name="VoiceCommandHelp" component={VoiceCommandHelpScreen} />
    </Drawer.Navigator>
  )
}

const MainNavigator = () => {
  const { isAuthenticated, onboarded } = useAuthStore()

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
        </>
      ) : !onboarded ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="OnboardingQuestionnaire" component={OnboardingQuestionnaireScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={DrawerNavigator} />
          <Stack.Screen name="Exercise" component={ExerciseScreen} />
          <Stack.Screen name="EnhancedExercise" component={EnhancedExerciseScreen} />
          <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
          <Stack.Screen name="Tutorial" component={TutorialScreen} />
          <Stack.Screen name="ExerciseRecommendations" component={ExerciseRecommendationsScreen} />
          <Stack.Screen name="Chat" component={EnhancedChatScreen} />
          <Stack.Screen name="AICoach" component={AICoachScreen} />
          <Stack.Screen name="VoiceRecording" component={VoiceRecordingScreen} />
          <Stack.Screen name="VoiceComponentsShowcase" component={VoiceComponentsShowcaseScreen} />
          <Stack.Screen name="VoiceEnabledHome" component={VoiceEnabledHomeScreen} />
          <Stack.Screen name="VoiceEnabledAIWorkoutPlan" component={VoiceEnabledAIWorkoutPlanScreen} />
          <Stack.Screen name="SavedWorkoutPlans" component={SavedWorkoutPlansScreen} />
          <Stack.Screen name="WorkoutPlanDetail" component={WorkoutPlanDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}

export default MainNavigator
