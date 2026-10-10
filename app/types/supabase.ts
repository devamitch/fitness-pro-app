export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          id: string
          name: string
          description: string | null
          muscle_group: string
          difficulty: string
          equipment: string | null
          instructions: Json | null
          image_url: string | null
          video_url: string | null
          created_at: string
          updated_at: string
          is_premium: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          muscle_group: string
          difficulty: string
          equipment?: string | null
          instructions?: Json | null
          image_url?: string | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
          is_premium?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          muscle_group?: string
          difficulty?: string
          equipment?: string | null
          instructions?: Json | null
          image_url?: string | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
          is_premium?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "exercises_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          data: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          id: string
          user_id: string
          exercise_id: string | null
          workout_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id?: string | null
          workout_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string | null
          workout_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_workout_id_fkey"
            columns: ["workout_id"]
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          completed_at: string
          duration: number
          accuracy: number
          calories_burned: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: string
          completed_at?: string
          duration: number
          accuracy: number
          calories_burned: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          completed_at?: string
          duration?: number
          accuracy?: number
          calories_burned?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          order_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          name: string
          date: string
          duration: number
          calories: number
          notes: string | null
          created_at: string
          updated_at: string
          exercises: Json
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          date: string
          duration: number
          calories: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          exercises: Json
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          date?: string
          duration?: number
          calories?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          exercises?: Json
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferences: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      health_metrics: {
        Row: {
          id: string
          user_id: string
          date: string
          type: string
          value: number
          unit: string
          source: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          type: string
          value: number
          unit: string
          source: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          type?: string
          value?: number
          unit?: string
          source?: string
          notes?: string | null
          created_at?: string
        }
      }
      workout_plans: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          duration_weeks: number
          level: string
          goal: string
          workouts: Json
          created_at: string
          updated_at: string
          is_ai_generated: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          duration_weeks: number
          level: string
          goal: string
          workouts: Json
          created_at?: string
          updated_at?: string
          is_ai_generated?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          duration_weeks?: number
          level?: string
          goal?: string
          workouts?: Json
          created_at?: string
          updated_at?: string
          is_ai_generated?: boolean
        }
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string
          event: string
          properties: Json | null
          timestamp: string
          session_id: string
          app_version: string
          device: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          event: string
          properties?: Json | null
          timestamp: string
          session_id: string
          app_version: string
          device?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          event?: string
          properties?: Json | null
          timestamp?: string
          session_id?: string
          app_version?: string
          device?: Json | null
        }
      }
      app_versions: {
        Row: {
          id: string
          version: string
          buildNumber: number
          minSupportedBuildNumber: number
          platform: string
          releaseNotes: string
          forceUpdate: boolean
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          version: string
          buildNumber: number
          minSupportedBuildNumber: number
          platform: string
          releaseNotes: string
          forceUpdate: boolean
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          version?: string
          buildNumber?: number
          minSupportedBuildNumber?: number
          platform?: string
          releaseNotes?: string
          forceUpdate?: boolean
          url?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
