-- Create workout_plans table
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_ai_generated BOOLEAN DEFAULT FALSE,
  metadata JSONB
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS workout_plans_user_id_idx ON workout_plans(user_id);

-- Add RLS policies
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- Policy for selecting workout plans (users can only see their own)
CREATE POLICY workout_plans_select_policy ON workout_plans
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for inserting workout plans (users can only insert their own)
CREATE POLICY workout_plans_insert_policy ON workout_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for updating workout plans (users can only update their own)
CREATE POLICY workout_plans_update_policy ON workout_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for deleting workout plans (users can only delete their own)
CREATE POLICY workout_plans_delete_policy ON workout_plans
  FOR DELETE USING (auth.uid() = user_id);
