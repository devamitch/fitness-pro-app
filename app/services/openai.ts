import { supabase } from "./supabase"
import { useAuthStore } from "@/stores/authStore"

interface OpenAIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface OpenAICompletionOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stream?: boolean
  stop?: string[]
  user?: string
}

class OpenAIService {
  private API_KEY = process.env.OPENAI_API_KEY || ""
  private API_URL = "https://api.openai.com/v1/chat/completions"
  private DEFAULT_MODEL = "gpt-4o"

  // Generate a completion from OpenAI
  async generateCompletion(messages: OpenAIMessage[], options: OpenAICompletionOptions = {}): Promise<string> {
    try {
      const user = useAuthStore.getState().user

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model: options.model || this.DEFAULT_MODEL,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 1000,
          top_p: options.top_p ?? 1,
          frequency_penalty: options.frequency_penalty ?? 0,
          presence_penalty: options.presence_penalty ?? 0,
          stream: options.stream ?? false,
          stop: options.stop,
          user: options.user || user?.id || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to generate completion")
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error("Error generating completion:", error)
      throw error
    }
  }

  // Generate a workout plan
  async generateWorkoutPlan(userPreferences: {
    fitnessLevel: string
    goals: string[]
    daysPerWeek: number
    equipment: string[]
    focusAreas: string[]
    timePerWorkout: number
    healthConditions?: string[]
  }): Promise<any> {
    try {
      const systemPrompt = `You are an expert fitness coach. Create a detailed workout plan based on the user's preferences. 
The plan should include specific exercises, sets, reps, and rest periods. Provide a structured JSON response.`

      const userPrompt = `Create a workout plan for me with these preferences:
- Fitness level: ${userPreferences.fitnessLevel}
- Goals: ${userPreferences.goals.join(", ")}
- Days per week: ${userPreferences.daysPerWeek}
- Available equipment: ${userPreferences.equipment.join(", ")}
- Focus areas: ${userPreferences.focusAreas.join(", ")}
- Time per workout: ${userPreferences.timePerWorkout} minutes
${userPreferences.healthConditions ? `- Health conditions: ${userPreferences.healthConditions.join(", ")}` : ""}

Provide the response as a JSON object with the following structure:
{
  "name": "Plan name",
  "description": "Brief description",
  "durationWeeks": number,
  "level": "beginner|intermediate|advanced",
  "goal": "main goal",
  "workouts": [
    {
      "day": 1,
      "name": "Workout name",
      "exercises": [
        {
          "name": "Exercise name",
          "sets": number,
          "reps": number,
          "rest": number,
          "notes": "Optional notes"
        }
      ]
    }
  ]
}`

      const messages: OpenAIMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]

      const completion = await this.generateCompletion(messages, {
        temperature: 0.7,
        max_tokens: 2000,
      })

      // Parse the JSON response
      try {
        // Find JSON in the response
        const jsonMatch =
          completion.match(/```json\n([\s\S]*?)\n```/) ||
          completion.match(/```\n([\s\S]*?)\n```/) ||
          completion.match(/({[\s\S]*})/)

        const jsonStr = jsonMatch ? jsonMatch[1] : completion
        return JSON.parse(jsonStr)
      } catch (e) {
        console.error("Error parsing workout plan JSON:", e)
        throw new Error("Failed to parse workout plan")
      }
    } catch (error) {
      console.error("Error generating workout plan:", error)
      throw error
    }
  }

  // Generate exercise form feedback
  async generateFormFeedback(
    exercise: string,
    poseData: any,
    userLevel = "beginner",
  ): Promise<{ feedback: string; score: number; tips: string[] }> {
    try {
      const systemPrompt = `You are an expert fitness coach specializing in exercise form analysis. 
Analyze the pose data provided and give feedback on the user's form for the specified exercise.`

      const userPrompt = `Exercise: ${exercise}
User level: ${userLevel}
Pose data: ${JSON.stringify(poseData)}

Provide feedback on my form for this exercise. Include:
1. Overall assessment
2. A score from 0-100
3. Specific tips for improvement

Format your response as a JSON object with these fields:
{
  "feedback": "Overall feedback text",
  "score": number,
  "tips": ["tip1", "tip2", "tip3"]
}`

      const messages: OpenAIMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]

      const completion = await this.generateCompletion(messages, {
        temperature: 0.3,
        max_tokens: 1000,
      })

      // Parse the JSON response
      try {
        // Find JSON in the response
        const jsonMatch =
          completion.match(/```json\n([\s\S]*?)\n```/) ||
          completion.match(/```\n([\s\S]*?)\n```/) ||
          completion.match(/({[\s\S]*})/)

        const jsonStr = jsonMatch ? jsonMatch[1] : completion
        return JSON.parse(jsonStr)
      } catch (e) {
        console.error("Error parsing form feedback JSON:", e)
        // Fallback to a default response
        return {
          feedback: "I couldn't analyze your form properly. Please try again with a clearer video.",
          score: 0,
          tips: ["Ensure you're visible in the frame", "Try a different angle", "Make sure lighting is good"],
        }
      }
    } catch (error) {
      console.error("Error generating form feedback:", error)
      throw error
    }
  }

  // Save chat history to Supabase
  async saveChatHistory(messages: OpenAIMessage[], title?: string): Promise<string | null> {
    try {
      const user = useAuthStore.getState().user
      if (!user) return null

      const { data, error } = await supabase
        .from("ai_chat_history")
        .insert({
          user_id: user.id,
          title: title || `Chat ${new Date().toLocaleString()}`,
          messages,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error) throw error

      return data?.id || null
    } catch (error) {
      console.error("Error saving chat history:", error)
      return null
    }
  }

  // Get chat history from Supabase
  async getChatHistory(): Promise<any[]> {
    try {
      const user = useAuthStore.getState().user
      if (!user) return []

      const { data, error } = await supabase
        .from("ai_chat_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Error getting chat history:", error)
      return []
    }
  }
}

export const openai = new OpenAIService()
