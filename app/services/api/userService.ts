import supabase from "../supabase"

export const userService = {
  getUser: async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user:", error)
      throw error
    }

    return data
  },
  updateUser: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      throw error
    }

    return data
  },
}
