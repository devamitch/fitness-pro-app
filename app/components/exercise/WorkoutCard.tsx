"use client"

import type React from "react"
import { View, StyleSheet, TouchableOpacity, Image, type ImageSourcePropType, type ViewStyle } from "react-native"
import { Text } from "@/components/ui/Text"
import { useTheme } from "@/hooks/useTheme"
import { Clock, Flame, Dumbbell } from "lucide-react-native"

export interface WorkoutCardProps {
  id: string
  name: string
  description?: string
  duration: number
  calories: number
  exerciseCount: number
  difficulty: "beginner" | "intermediate" | "advanced"
  image: ImageSourcePropType
  onPress?: (id: string) => void
  style?: ViewStyle
  compact?: boolean
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  id,
  name,
  description,
  duration,
  calories,
  exerciseCount,
  difficulty,
  image,
  onPress,
  style,
  compact = false,
}) => {
  const { colors } = useTheme()

  const getDifficultyColor = () => {
    switch (difficulty) {
      case "beginner":
        return colors.info
      case "intermediate":
        return colors.warning
      case "advanced":
        return colors.error
      default:
        return colors.info
    }
  }

  const handlePress = () => {
    if (onPress) {
      onPress(id)
    }
  }

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          {
            backgroundColor: colors.card,
            shadowColor: colors.shadow,
          },
          style,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image source={image} style={styles.compactImage} />
        <View style={styles.compactContent}>
          <Text variant="subtitle" numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.compactMeta}>
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              {duration} min • {calories} cal
            </Text>
            <View
              style={[
                styles.difficultyBadge,
                {
                  backgroundColor: getDifficultyColor() + "20", // 20% opacity
                },
              ]}
            >
              <Text
                variant="caption"
                style={[
                  styles.difficultyText,
                  {
                    color: getDifficultyColor(),
                  },
                ]}
              >
                {difficulty}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          shadowColor: colors.shadow,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Image source={image} style={styles.image} />
      <View
        style={[
          styles.difficultyBadge,
          {
            backgroundColor: getDifficultyColor() + "20", // 20% opacity
            position: "absolute",
            top: 12,
            right: 12,
          },
        ]}
      >
        <Text
          variant="caption"
          style={[
            styles.difficultyText,
            {
              color: getDifficultyColor(),
            },
          ]}
        >
          {difficulty}
        </Text>
      </View>
      <View style={styles.content}>
        <Text variant="subtitle" numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        {description && (
          <Text variant="caption" numberOfLines={2} style={styles.description}>
            {description}
          </Text>
        )}
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              {duration} min
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Flame size={14} color={colors.textSecondary} />
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              {calories} cal
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Dumbbell size={14} color={colors.textSecondary} />
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              {exerciseCount} exercises
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  content: {
    padding: 16,
  },
  name: {
    marginBottom: 4,
  },
  description: {
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    textTransform: "capitalize",
  },
  compactContainer: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  compactImage: {
    width: 80,
    height: 80,
    resizeMode: "cover",
  },
  compactContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  compactMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
})
