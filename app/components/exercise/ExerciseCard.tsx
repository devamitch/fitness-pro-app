"use client"

import type React from "react"
import { View, StyleSheet, TouchableOpacity, Image, type ImageSourcePropType, type ViewStyle } from "react-native"
import { Text } from "@/components/ui/Text"
import { useTheme } from "@/hooks/useTheme"
import { Clock, Flame, Star } from "lucide-react-native"

export interface ExerciseCardProps {
  id: string
  name: string
  duration: number
  calories: number
  difficulty: "beginner" | "intermediate" | "advanced"
  image: ImageSourcePropType
  isFavorite?: boolean
  onPress?: (id: string) => void
  style?: ViewStyle
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  id,
  name,
  duration,
  calories,
  difficulty,
  image,
  isFavorite = false,
  onPress,
  style,
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
      <View style={styles.content}>
        <Text variant="subtitle" numberOfLines={1} style={styles.name}>
          {name}
        </Text>
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
        </View>
        <View style={styles.footer}>
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
          {isFavorite && <Star size={16} color={colors.warning} fill={colors.warning} />}
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
  },
  image: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  content: {
    padding: 12,
  },
  name: {
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    textTransform: "capitalize",
  },
})
