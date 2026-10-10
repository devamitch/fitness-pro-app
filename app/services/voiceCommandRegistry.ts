import type { VoiceCommand } from "../contexts/VoiceAssistantContext"
import { createVoiceCommand, createNavigationCommand, createSettingsCommand } from "../hofs/createVoiceCommand"
import { useNavigation } from "@react-navigation/native"
import { useThemeStore } from "../theme/theme"

// Define command registry
class VoiceCommandRegistry {
  private static instance: VoiceCommandRegistry
  private commands: Map<string, VoiceCommand> = new Map()

  // Get instance (singleton)
  public static getInstance(): VoiceCommandRegistry {
    if (!VoiceCommandRegistry.instance) {
      VoiceCommandRegistry.instance = new VoiceCommandRegistry()
    }
    return VoiceCommandRegistry.instance
  }

  // Register command
  public register(command: VoiceCommand): void {
    this.commands.set(command.id, command)
  }

  // Unregister command
  public unregister(commandId: string): void {
    this.commands.delete(commandId)
  }

  // Get command
  public get(commandId: string): VoiceCommand | undefined {
    return this.commands.get(commandId)
  }

  // Get all commands
  public getAll(): VoiceCommand[] {
    return Array.from(this.commands.values())
  }

  // Get commands by category
  public getByCategory(category: string): VoiceCommand[] {
    return this.getAll().filter((command) => command.category === category)
  }

  // Clear all commands
  public clear(): void {
    this.commands.clear()
  }
}

// Export singleton instance
export const voiceCommandRegistry = VoiceCommandRegistry.getInstance()

// Initialize global commands
export const initializeGlobalCommands = () => {
  const navigation = useNavigation()
  const { setTheme } = useThemeStore()

  // Navigation commands
  const navigationCommands = [
    createNavigationCommand("home", "Home", (screen) => navigation.navigate(screen)),
    createNavigationCommand("exercises", "Exercises", (screen) => navigation.navigate(screen)),
    createNavigationCommand("profile", "Profile", (screen) => navigation.navigate(screen)),
    createNavigationCommand("settings", "Settings", (screen) => navigation.navigate(screen)),
    createNavigationCommand("chat", "Chat", (screen) => navigation.navigate(screen)),
    createNavigationCommand("notifications", "Notifications", (screen) => navigation.navigate(screen)),
  ]

  // Theme commands
  const themeCommands = [
    createSettingsCommand("theme_dark", "theme", setTheme, "dark", [
      "switch to dark mode",
      "enable dark mode",
      "dark theme",
      "change to dark theme",
    ]),
    createSettingsCommand("theme_light", "theme", setTheme, "light", [
      "switch to light mode",
      "enable light mode",
      "light theme",
      "change to light theme",
    ]),
    createSettingsCommand("theme_system", "theme", setTheme, "system", [
      "use system theme",
      "switch to system theme",
      "system theme",
    ]),
  ]

  // General commands
  const generalCommands = [
    createVoiceCommand(
      {
        id: "general_help",
        phrases: ["help", "what can you do", "show commands", "available commands"],
        category: "general",
        description: "Show available voice commands",
        examples: ['"Help"', '"What can you do"', '"Show commands"'],
      },
      () => {
        // This would typically open a help modal or navigate to a help screen
        navigation.navigate("Help")
      }
    ),
    createVoiceCommand(
      {
        id: "general_back",
        phrases: ["go back", "previous screen", "back"],
        category: "general",
        description: "Go back to the previous screen",
        examples: ['"Go back"', '"Previous screen"'],
      },
      () => {
        navigation.goBack()
      }
    ),
  ]

  // Register all commands
  [
  ...navigationCommands, ...themeCommands, ...generalCommands].forEach((command) =>
  voiceCommandRegistry.register(command)
  )

  return {
    navigationCommands,
    themeCommands,
    generalCommands,
  }
}
