import { useAuthStore } from "@/stores/authStore"
import { mmkv } from "../../utils/mmkv"

export interface TutorialStep {
  id: string
  title: string
  description: string
  targetElementId?: string
  position?: "top" | "bottom" | "left" | "right"
  order: number
  screen: string
  isRequired?: boolean
  image?: string
}

export interface Tutorial {
  id: string
  name: string
  steps: TutorialStep[]
  isRequired: boolean
  version: number
}

class TutorialManager {
  private COMPLETED_TUTORIALS_KEY = "completed_tutorials"
  private TUTORIAL_PROGRESS_KEY = "tutorial_progress"
  private tutorials: Record<string, Tutorial> = {}

  // Register a tutorial
  registerTutorial(tutorial: Tutorial): void {
    this.tutorials[tutorial.id] = tutorial
  }

  // Get all registered tutorials
  getAllTutorials(): Tutorial[] {
    return Object.values(this.tutorials)
  }

  // Get a specific tutorial
  getTutorial(id: string): Tutorial | undefined {
    return this.tutorials[id]
  }

  // Check if a tutorial is completed
  isTutorialCompleted(tutorialId: string): boolean {
    const user = useAuthStore.getState().user
    const userId = user?.id || "anonymous"

    const completedTutorials = this.getCompletedTutorials(userId)
    const tutorial = this.tutorials[tutorialId]

    if (!tutorial) return false

    // Check if completed with current or higher version
    const completedVersion = completedTutorials[tutorialId]
    return completedVersion !== undefined && completedVersion >= tutorial.version
  }

  // Mark a tutorial as completed
  completeTutorial(tutorialId: string): void {
    const user = useAuthStore.getState().user
    const userId = user?.id || "anonymous"

    const tutorial = this.tutorials[tutorialId]
    if (!tutorial) return

    const completedTutorials = this.getCompletedTutorials(userId)
    completedTutorials[tutorialId] = tutorial.version

    this.saveCompletedTutorials(userId, completedTutorials)

    // Clear progress for this tutorial
    this.clearTutorialProgress(tutorialId)
  }

  // Reset a tutorial (mark as not completed)
  resetTutorial(tutorialId: string): void {
    const user = useAuthStore.getState().user
    const userId = user?.id || "anonymous"

    const completedTutorials = this.getCompletedTutorials(userId)
    delete completedTutorials[tutorialId]

    this.saveCompletedTutorials(userId, completedTutorials)
    this.clearTutorialProgress(tutorialId)
  }

  // Get tutorial progress (current step index)
  getTutorialProgress(tutorialId: string): number {
    const user = useAuthStore.getState().user
    const userId = user?.id || "anonymous"

    const progressKey = `${this.TUTORIAL_PROGRESS_KEY}:${userId}`
    const progressJson = mmkv.getString(progressKey)

    if (!progressJson) return 0

    try {
      const progress = JSON.parse(progressJson)
      return progress[tutorialId] || 0
    } catch (e) {
      console.error(`Error parsing tutorial progress:`, e)
      return 0
    }
  }

  // Save tutorial progress
  saveTutorialProgress(tutorialId: string, stepIndex: number): void {
    const user = useAuthStore.getState().user
    const userId = user?.id || "anonymous"

    const progressKey = `${this.TUTORIAL_PROGRESS_KEY}:${userId}`
    const progressJson = mmkv.getString(progressKey)

    let progress: Record<string, number> = {}

    if (progressJson) {
      try {
        progress = JSON.parse(progressJson)
      } catch (e) {
        console.error(`Error parsing tutorial progress:`, e)
      }
    }

    progress[tutorialId] = stepIndex
    mmkv.set(progressKey, JSON.stringify(progress))
  }

  // Clear tutorial progress
  clearTutorialProgress(tutorialId: string): void {
    const user = useAuthStore.getState().user
    const userId = user?.id || "anonymous"

    const progressKey = `${this.TUTORIAL_PROGRESS_KEY}:${userId}`
    const progressJson = mmkv.getString(progressKey)

    if (!progressJson) return

    try {
      const progress = JSON.parse(progressJson)
      delete progress[tutorialId]
      mmkv.set(progressKey, JSON.stringify(progress))
    } catch (e) {
      console.error(`Error parsing tutorial progress:`, e)
    }
  }

  // Get tutorials that should be shown for a screen
  getTutorialsForScreen(screenName: string): Tutorial[] {
    return Object.values(this.tutorials).filter((tutorial) => {
      // Check if any step is for this screen
      const hasStepsForScreen = tutorial.steps.some((step) => step.screen === screenName)

      // Check if already completed
      const isCompleted = this.isTutorialCompleted(tutorial.id)

      return hasStepsForScreen && !isCompleted
    })
  }

  // Get completed tutorials
  private getCompletedTutorials(userId: string): Record<string, number> {
    const completedKey = `${this.COMPLETED_TUTORIALS_KEY}:${userId}`
    const completedJson = mmkv.getString(completedKey)

    if (!completedJson) return {}

    try {
      return JSON.parse(completedJson)
    } catch (e) {
      console.error(`Error parsing completed tutorials:`, e)
      return {}
    }
  }

  // Save completed tutorials
  private saveCompletedTutorials(userId: string, completed: Record<string, number>): void {
    const completedKey = `${this.COMPLETED_TUTORIALS_KEY}:${userId}`
    mmkv.set(completedKey, JSON.stringify(completed))
  }
}

export const tutorialManager = new TutorialManager()
