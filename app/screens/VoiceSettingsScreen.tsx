"use client"

import { useNavigation } from "@react-navigation/native"
import { ArrowLeft, Clock, Mic, Sliders, User, Volume2 } from "lucide-react-native"
import { useCallback, useState } from "react"
import {
  ScrollView,
  Slider,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components/Text"
import { useVoiceAssistant } from "../contexts/VoiceAssistantContext"
import { withVoiceEnabledScreen } from "../hocs/withVoiceEnabledScreen"
import { useTheme } from "../theme/theme"

const VoiceSettingsScreenBase = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const {
    isEnabled,
    setEnabled,
    assistantType,
    setAssistantType,
    volume,
    setVolume,
    rate,
    setRate,
    pitch,
    setPitch,
    voiceType,
    setVoiceType,
    isWakeWordEnabled,
    setWakeWordEnabled,
    wakeWord,
    setWakeWord,
    speak,
  } = useVoiceAssistant()

  const [testText, setTestText] = useState(
    "Hello, I am your fitness assistant. How can I help you today?",
  )

  // Test voice - memoized to prevent unnecessary re-renders
  const handleTestVoice = useCallback(() => {
    speak(testText)
  }, [speak, testText])

  // Memoized assistant type handler
  const handleAssistantTypeChange = useCallback(
    (type) => {
      setAssistantType(type)
    },
    [setAssistantType],
  )

  // Memoized voice type handler
  const handleVoiceTypeChange = useCallback(
    (type) => {
      setVoiceType(type)
    },
    [setVoiceType],
  )

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.primary, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="title">Voice Assistant Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Enable/Disable */}
        <View style={styles.section}>
          <Text
            variant="subtitle"
            style={[styles.sectionTitle, { color: theme.colors.text.primary }]}
          >
            Voice Assistant
          </Text>
          <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Mic size={20} color={theme.colors.text.primary} />
                <Text
                  variant="body"
                  style={[styles.settingText, { color: theme.colors.text.primary }]}
                >
                  Enable Voice Assistant
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={setEnabled}
                trackColor={{ false: theme.colors.background.tertiary, true: theme.colors.primary }}
              />
            </View>
          </View>

          {/* Assistant Type */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.background.secondary, marginTop: 12 },
            ]}
          >
            <Text variant="body" style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
              Assistant Type
            </Text>
            <View style={styles.assistantTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.assistantTypeButton,
                  assistantType === "app" && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handleAssistantTypeChange("app")}
              >
                <Text
                  variant="caption"
                  style={{
                    color:
                      assistantType === "app"
                        ? theme.colors.text.inverse
                        : theme.colors.text.primary,
                  }}
                >
                  App
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.assistantTypeButton,
                  assistantType === "siri" && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handleAssistantTypeChange("siri")}
              >
                <Text
                  variant="caption"
                  style={{
                    color:
                      assistantType === "siri"
                        ? theme.colors.text.inverse
                        : theme.colors.text.primary,
                  }}
                >
                  Siri
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.assistantTypeButton,
                  assistantType === "google" && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handleAssistantTypeChange("google")}
              >
                <Text
                  variant="caption"
                  style={{
                    color:
                      assistantType === "google"
                        ? theme.colors.text.inverse
                        : theme.colors.text.primary,
                  }}
                >
                  Google
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.assistantTypeButton,
                  assistantType === "alexa" && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handleAssistantTypeChange("alexa")}
              >
                <Text
                  variant="caption"
                  style={{
                    color:
                      assistantType === "alexa"
                        ? theme.colors.text.inverse
                        : theme.colors.text.primary,
                  }}
                >
                  Alexa
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            variant="subtitle"
            style={[styles.sectionTitle, { color: theme.colors.text.primary }]}
          >
            Voice Settings
          </Text>
          <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
            {/* Volume */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderInfo}>
                  <Volume2 size={20} color={theme.colors.text.primary} />
                  <Text
                    variant="body"
                    style={[styles.sliderText, { color: theme.colors.text.primary }]}
                  >
                    Volume
                  </Text>
                </View>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  {Math.round(volume * 100)}%
                </Text>
              </View>
              <Slider
                value={volume}
                onValueChange={setVolume}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.background.tertiary}
                thumbTintColor={theme.colors.primary}
              />
            </View>

            {/* Rate */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderInfo}>
                  <Clock size={20} color={theme.colors.text.primary} />
                  <Text
                    variant="body"
                    style={[styles.sliderText, { color: theme.colors.text.primary }]}
                  >
                    Speaking Rate
                  </Text>
                </View>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  {rate.toFixed(1)}x
                </Text>
              </View>
              <Slider
                value={rate}
                onValueChange={setRate}
                minimumValue={0.5}
                maximumValue={2}
                step={0.1}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.background.tertiary}
                thumbTintColor={theme.colors.primary}
              />
            </View>

            {/* Pitch */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderInfo}>
                  <Sliders size={20} color={theme.colors.text.primary} />
                  <Text
                    variant="body"
                    style={[styles.sliderText, { color: theme.colors.text.primary }]}
                  >
                    Pitch
                  </Text>
                </View>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  {pitch.toFixed(1)}
                </Text>
              </View>
              <Slider
                value={pitch}
                onValueChange={setPitch}
                minimumValue={0.5}
                maximumValue={2}
                step={0.1}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.background.tertiary}
                thumbTintColor={theme.colors.primary}
              />
            </View>

            {/* Voice Type */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <User size={20} color={theme.colors.text.primary} />
                <Text
                  variant="body"
                  style={[styles.settingText, { color: theme.colors.text.primary }]}
                >
                  Voice Type
                </Text>
              </View>
              <View style={styles.voiceTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.voiceTypeButton,
                    voiceType === "male" && {
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => handleVoiceTypeChange("male")}
                >
                  <Text
                    variant="caption"
                    style={{
                      color:
                        voiceType === "male"
                          ? theme.colors.text.inverse
                          : theme.colors.text.primary,
                    }}
                  >
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.voiceTypeButton,
                    voiceType === "female" && {
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => handleVoiceTypeChange("female")}
                >
                  <Text
                    variant="caption"
                    style={{
                      color:
                        voiceType === "female"
                          ? theme.colors.text.inverse
                          : theme.colors.text.primary,
                    }}
                  >
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            variant="subtitle"
            style={[styles.sectionTitle, { color: theme.colors.text.primary }]}
          >
            Wake Word
          </Text>
          <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Mic size={20} color={theme.colors.text.primary} />
                <Text
                  variant="body"
                  style={[styles.settingText, { color: theme.colors.text.primary }]}
                >
                  Enable Wake Word
                </Text>
              </View>
              <Switch
                value={isWakeWordEnabled}
                onValueChange={setWakeWordEnabled}
                trackColor={{ false: theme.colors.background.tertiary, true: theme.colors.primary }}
              />
            </View>

            <View style={styles.wakeWordContainer}>
              <Text
                variant="body"
                style={[styles.wakeWordLabel, { color: theme.colors.text.primary }]}
              >
                Wake Word
              </Text>
              <TextInput
                style={[
                  styles.wakeWordInput,
                  {
                    backgroundColor: theme.colors.background.tertiary,
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.card.border,
                  },
                ]}
                value={wakeWord}
                onChangeText={setWakeWord}
                placeholder="Enter wake word"
                placeholderTextColor={theme.colors.text.tertiary}
                editable={isWakeWordEnabled}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            variant="subtitle"
            style={[styles.sectionTitle, { color: theme.colors.text.primary }]}
          >
            Test Voice
          </Text>
          <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
            <TextInput
              style={[
                styles.testInput,
                {
                  backgroundColor: theme.colors.background.tertiary,
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.card.border,
                },
              ]}
              value={testText}
              onChangeText={setTestText}
              placeholder="Enter text to test voice"
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
            />
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleTestVoice}
            >
              <Volume2 size={20} color="#FFFFFF" />
              <Text variant="button" style={[styles.testButtonText, { color: "#FFFFFF" }]}>
                Test Voice
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  assistantTypeButton: {
    alignItems: "center",
    borderColor: "rgba(150, 150, 150, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  assistantTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 16,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  settingInfo: {
    alignItems: "center",
    flexDirection: "row",
  },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  settingText: {
    marginLeft: 12,
  },
  sliderContainer: {
    marginVertical: 12,
  },
  sliderHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sliderInfo: {
    alignItems: "center",
    flexDirection: "row",
  },
  sliderText: {
    marginLeft: 12,
  },
  testButton: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
  },
  testButtonText: {
    marginLeft: 8,
  },
  testInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlignVertical: "top",
  },
  voiceTypeButton: {
    alignItems: "center",
    borderColor: "rgba(150, 150, 150, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  voiceTypeContainer: {
    flexDirection: "row",
  },
  wakeWordContainer: {
    marginTop: 16,
  },
  wakeWordInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  wakeWordLabel: {
    marginBottom: 8,
  },
})

// Export voice-enabled settings screen
export const VoiceSettingsScreen = withVoiceEnabledScreen(VoiceSettingsScreenBase, [])
