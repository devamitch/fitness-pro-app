-- Create table for storing TTS cache
CREATE TABLE IF NOT EXISTS tts_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (key, text)
);

-- Create table for storing exercise target poses
CREATE TABLE IF NOT EXISTS exercise_target_poses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  pose_data JSONB NOT NULL,
  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (exercise_id, sequence_number)
);

-- Create table for storing user health data
CREATE TABLE IF NOT EXISTS user_health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  data_value JSONB NOT NULL,
  source TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, data_type, recorded_at)
);

-- Create table for storing in-app purchases
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  purchase_token TEXT NOT NULL,
  purchase_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, product_id, purchase_token)
);

-- Add new columns to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS voice_type TEXT DEFAULT 'female',
ADD COLUMN IF NOT EXISTS voice_rate FLOAT DEFAULT 0.9,
ADD COLUMN IF NOT EXISTS voice_pitch FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS voice_volume FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system',
ADD COLUMN IF NOT EXISTS haptic_feedback BOOLEAN DEFAULT TRUE;

-- Add new columns to exercises table
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS voice_instructions JSONB,
ADD COLUMN IF NOT EXISTS has_target_poses BOOLEAN DEFAULT FALSE;

-- Add new columns to user_progress table
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS heart_rate INTEGER,
ADD COLUMN IF NOT EXISTS form_score FLOAT,
ADD COLUMN IF NOT EXISTS feedback TEXT;
