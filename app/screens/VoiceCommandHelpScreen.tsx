/* eslint-disable import/namespace */
"use client"

import { useNavigation } from "@react-navigation/native"
import { useCallback, useMemo, useState } from "react"
import { FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components/Text"
import { useVoiceAssistant, type CommandCategory } from "../contexts/VoiceAssistantContext"
import { withVoiceEnabledScreen } from "../hocs/withVoiceEnabledScreen"
// import { voiceCommandRegistry } from "../services/voiceCommandRegistry"
import { voiceCommandRegistry } from "@/services/voiceCommandRegistry"
import { ArrowLeft, Info, Mic, Search, Volume2 } from "lucide-react-native"
import { useTheme } from "../theme/theme"

const VoiceCommandHelpScreenBase = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { speak } = useVoiceAssistant()

  const [selectedCategory, setSelectedCategory] = useState<CommandCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Get all commands - only fetch once
  const allCommands = useMemo(() => voiceCommandRegistry.getAll(), [])

  // Filter commands by category and search query - memoized for performance
  const filteredCommands = useMemo(() => {
    return allCommands.filter((command) => {
      const matchesCategory = selectedCategory === "all" || command.category === selectedCategory
      const matchesSearch =
        searchQuery === "" ||
        command.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        command.phrases.some((phrase) => phrase.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesCategory && matchesSearch
    })
  }, [allCommands, selectedCategory, searchQuery])

  // Group commands by category - memoized for performance
  const commandsByCategory = useMemo(() => {
    return filteredCommands.reduce(
      (acc, command) => {
        if (!acc[command.category]) {
          acc[command.category] = []
        }
        acc[command.category].push(command)
        return acc
      },
      {} as Record<string, typeof allCommands>,
    )
  }, [filteredCommands])

  // Categories - memoized since they don't change
  const categories = useMemo(
    () =>
      [
        { id: "all", label: "All" },
        { id: "navigation", label: "Navigation" },
        { id: "workout", label: "Workout" },
        { id: "exercise", label: "Exercise" },
        { id: "settings", label: "Settings" },
        { id: "general", label: "General" },
      ] as const,
    [],
  )

  // Speak command description - memoized to prevent unnecessary re-renders
  const handleSpeakDescription = useCallback(
    (description: string) => {
      speak(description)
    },
    [speak],
  )

  // Category selection handler - memoized
  const handleCategorySelect = useCallback((categoryId: CommandCategory | "all") => {
    setSelectedCategory(categoryId)
  }, [])

  // Render category button - memoized
  const renderCategoryButton = useCallback(
    (category: { id: CommandCategory | "all"; label: string }) => (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryButton,
          selectedCategory === category.id && {
            backgroundColor: theme.colors.primary,
          },
          { borderColor: theme.colors.card.border },
        ]}
        onPress={() => handleCategorySelect(category.id)}
      >
        <Text
          variant="caption"
          style={{
            color:
              selectedCategory === category.id
                ? theme.colors.text.inverse
                : theme.colors.text.primary,
          }}
        >
          {category.label}
        </Text>
      </TouchableOpacity>
    ),
    [selectedCategory, theme.colors, handleCategorySelect],
  )

  // Render command item - memoized
  const renderCommandItem = useCallback(
    ({ item: [category, commands] }: { item: [string, typeof allCommands] }) => (
      <View style={styles.categorySection}>
        <Text
          variant="subtitle"
          style={[styles.categorySectionTitle, { color: theme.colors.text.primary }]}
        >
          {categories.find((c) => c.id === category)?.label || category}
        </Text>
        {commands.map((command) => (
          <View
            key={command.id}
            style={[styles.commandCard, { backgroundColor: theme.colors.background.secondary }]}
          >
            <View style={styles.commandHeader}>
              <Text
                variant="body"
                style={[styles.commandTitle, { color: theme.colors.text.primary }]}
              >
                {command.description}
              </Text>
              <TouchableOpacity
                style={[styles.speakButton, { backgroundColor: theme.colors.background.tertiary }]}
                onPress={() => handleSpeakDescription(command.description)}
              >
                <Volume2 size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.phrasesContainer}>
              {command.examples.map((example, index) => (
                <View
                  key={index}
                  style={[
                    styles.phraseChip,
                    {
                      backgroundColor: theme.colors.background.tertiary,
                      borderColor: theme.colors.card.border,
                    },
                  ]}
                >
                  <Mic size={14} color={theme.colors.primary} />
                  <Text
                    variant="caption"
                    style={[styles.phraseText, { color: theme.colors.text.secondary }]}
                  >
                    {example}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    ),
    [categories, theme.colors, handleSpeakDescription],
  )

  // Empty list component - memoized
  const EmptyListComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Info size={48} color={theme.colors.text.tertiary} />
        <Text variant="subtitle" style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
          No commands found
        </Text>
      </View>
    ),
    [theme.colors.text.tertiary],
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
        <Text variant="title">Voice Commands</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View
        style={[styles.searchContainer, { backgroundColor: theme.colors.background.secondary }]}
      >
        <Search size={20} color={theme.colors.text.tertiary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text.primary }]}
          placeholder="Search commands..."
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map(renderCategoryButton)}
      </ScrollView>

      {/* Commands */}
      <FlatList
        data={Object.entries(commandsByCategory)}
        keyExtractor={(item) => item[0]}
        renderItem={renderCommandItem}
        ListEmptyComponent={EmptyListComponent}
        contentContainerStyle={styles.commandsContainer}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
  },
  categoriesContainer: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  categoryButton: {
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categorySection: {
    marginBottom: 24,
  },
  categorySectionTitle: {
    marginBottom: 12,
  },
  commandCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  commandHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  commandTitle: {
    flex: 1,
    fontWeight: "500",
  },
  commandsContainer: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  phraseChip: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  phraseText: {
    marginLeft: 4,
  },
  phrasesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  searchContainer: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    marginBottom: 16,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  speakButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    marginLeft: 8,
    width: 32,
  },
})

// Export voice-enabled help screen
export const VoiceCommandHelpScreen = withVoiceEnabledScreen(VoiceCommandHelpScreenBase, [])
