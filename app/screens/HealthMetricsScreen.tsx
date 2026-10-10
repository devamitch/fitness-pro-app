"use client"

import { customFontsToLoad } from "@/theme"
import { useNavigation } from "@react-navigation/native"
import { Canvas, Circle, Path, Text as SkiaText, useFont, vec } from "@shopify/react-native-skia"
import { useQuery } from "@tanstack/react-query"
import { LinearGradient } from "expo-linear-gradient"
import {
  Activity,
  ArrowLeft,
  Clock,
  Flame,
  Footprints,
  Heart,
  Moon,
  Plus,
  Scale,
  TrendingUp,
} from "lucide-react-native"
import type React from "react"
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { GlassMorphicCard } from "../components/GlassMorphicCard"
import { Text } from "../components/Text"
import { WorkoutProgressChart } from "../components/WorkoutProgressChart"
import { healthConnectApi } from "../services/healthConnect"
import { useAuthStore } from "../stores/authStore"
import { useTheme } from "../theme/theme"

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const CHART_HEIGHT = 120
const CHART_WIDTH = (SCREEN_WIDTH - 60) / 2 // Two charts per row with padding

interface HealthMetric {
  id: string
  name: string
  value: number
  unit: string
  icon: React.ReactNode
  color: string
  data: number[]
  goal?: number
  progress?: number
}

export const HealthMetricsScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { user } = useAuthStore()

  // Load font for Skia
  const font = useFont(customFontsToLoad)

  // Fetch health data
  const { data: healthData, isLoading } = useQuery({
    queryKey: ["health-metrics", user?.id],
    queryFn: async () => {
      try {
        // Get health data from Health Connect
        const data = await healthConnectApi.getHealthData()
        return data
      } catch (error) {
        console.error("Error fetching health data:", error)
        // Return mock data if error
        return getMockHealthData()
      }
    },
  })

  // Get mock health data
  const getMockHealthData = () => {
    return {
      steps: {
        today: 8432,
        goal: 10000,
        week: [6543, 7821, 9234, 8432, 10234, 7654, 8432],
      },
      heartRate: {
        current: 72,
        min: 58,
        max: 142,
        avg: 68,
        data: [68, 72, 76, 70, 68, 72],
      },
      calories: {
        today: 1842,
        goal: 2500,
        week: [1654, 1821, 2034, 1842, 2134, 1754, 1842],
      },
      sleep: {
        today: 7.5,
        goal: 8,
        week: [6.5, 7.2, 8.1, 7.5, 6.8, 7.9, 7.5],
      },
      weight: {
        current: 75.5,
        goal: 72,
        month: [76.2, 76.0, 75.8, 75.5, 75.3, 75.1, 74.9, 74.7, 74.5, 74.3, 74.1, 73.9],
      },
      workouts: {
        week: 4,
        month: 16,
        duration: 320, // minutes
      },
    }
  }

  // Get health metrics
  const getHealthMetrics = (): HealthMetric[] => {
    if (!healthData) return []

    return [
      {
        id: "steps",
        name: "Steps",
        value: healthData.steps.today,
        unit: "steps",
        icon: <Footprints size={20} color="#FFFFFF" />,
        color: theme.colors.primary,
        data: healthData.steps.week,
        goal: healthData.steps.goal,
        progress: healthData.steps.today / healthData.steps.goal,
      },
      {
        id: "heartRate",
        name: "Heart Rate",
        value: healthData.heartRate.current,
        unit: "bpm",
        icon: <Heart size={20} color="#FFFFFF" />,
        color: theme.colors.status.error,
        data: healthData.heartRate.data,
      },
      {
        id: "calories",
        name: "Calories",
        value: healthData.calories.today,
        unit: "kcal",
        icon: <Flame size={20} color="#FFFFFF" />,
        color: theme.colors.accent,
        data: healthData.calories.week,
        goal: healthData.calories.goal,
        progress: healthData.calories.today / healthData.calories.goal,
      },
      {
        id: "sleep",
        name: "Sleep",
        value: healthData.sleep.today,
        unit: "hours",
        icon: <Moon size={20} color="#FFFFFF" />,
        color: theme.colors.secondary,
        data: healthData.sleep.week,
        goal: healthData.sleep.goal,
        progress: healthData.sleep.today / healthData.sleep.goal,
      },
      {
        id: "weight",
        name: "Weight",
        value: healthData.weight.current,
        unit: "kg",
        icon: <Scale size={20} color="#FFFFFF" />,
        color: "#8E44AD", // Purple
        data: healthData.weight.month,
      },
      {
        id: "workouts",
        name: "Workouts",
        value: healthData.workouts.week,
        unit: "this week",
        icon: <Activity size={20} color="#FFFFFF" />,
        color: "#2ECC71", // Green
        data: [0, 0, 1, 0, 2, 0, 1], // Daily workouts for the week
      },
    ]
  }

  // Render line chart
  const renderLineChart = (metric: HealthMetric) => {
    if (!font) return null

    const data = metric.data
    if (!data || data.length === 0) return null

    const maxValue = Math.max(...data) * 1.1 // Add 10% padding
    const minValue = Math.min(...data) * 0.9 // Subtract 10% padding

    // Calculate point positions
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * CHART_WIDTH
      const normalizedValue = (value - minValue) / (maxValue - minValue)
      const y = CHART_HEIGHT - normalizedValue * CHART_HEIGHT
      return vec(x, y)
    })

    // Create path for line
    let linePath = ""
    points.forEach((point, index) => {
      if (index === 0) {
        linePath += `M ${point.x} ${point.y}`
      } else {
        linePath += ` L ${point.x} ${point.y}`
      }
    })

    // Create path for area under line
    let areaPath = linePath
    areaPath += ` L ${points[points.length - 1].x} ${CHART_HEIGHT}`
    areaPath += ` L ${points[0].x} ${CHART_HEIGHT}`
    areaPath += " Z"

    return (
      <Canvas style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
        {/* Area under line */}
        <Path path={areaPath} color={`${metric.color}40`} style="fill" />

        {/* Line */}
        <Path path={linePath} color={metric.color} style="stroke" strokeWidth={2} />

        {/* Current value point */}
        <Circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={4}
          color={metric.color}
        />

        {/* Goal line if available */}
        {metric.goal && (
          <Path
            path={`M 0 ${CHART_HEIGHT - (metric.goal / maxValue) * CHART_HEIGHT} H ${CHART_WIDTH}`}
            color={`${metric.color}80`}
            style="stroke"
            strokeWidth={1}
            strokeDasharray="5,5"
          />
        )}

        {/* Value text */}
        <SkiaText
          text={`${metric.value} ${metric.unit}`}
          x={CHART_WIDTH / 2}
          y={20}
          font={font}
          color={metric.color}
          align="center"
        />
      </Canvas>
    )
  }

  // Render progress circle
  const renderProgressCircle = (metric: HealthMetric) => {
    if (!metric.progress) return null

    const progress = Math.min(metric.progress, 1)
    const radius = 40
    const strokeWidth = 8
    const center = radius + strokeWidth
    const size = (radius + strokeWidth) * 2

    // Calculate circle path
    const circumference = 2 * Math.PI * radius
    const alpha = Math.PI * 2 * progress
    const x = center + radius * Math.sin(alpha)
    const y = center - radius * Math.cos(alpha)
    const largeArcFlag = progress > 0.5 ? 1 : 0

    const path = `M ${center} ${strokeWidth} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x} ${y}`

    return (
      <Canvas style={{ width: size, height: size }}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          color={`${metric.color}40`}
          style="stroke"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <Path
          path={path}
          color={metric.color}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
        />

        {/* Center text */}
        <SkiaText
          text={`${Math.round(progress * 100)}%`}
          x={center}
          y={center + 5}
          font={font}
          color={metric.color}
          align="center"
        />
      </Canvas>
    )
  }

  // Render metric card
  const renderMetricCard = (metric: HealthMetric, index: number) => {
    return (
      <GlassMorphicCard key={metric.id} style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: metric.color }]}>{metric.icon}</View>
          <Text variant="subtitle">{metric.name}</Text>
        </View>

        <View style={styles.metricContent}>
          {metric.progress !== undefined ? (
            <View style={styles.progressContainer}>
              {renderProgressCircle(metric)}
              <View style={styles.metricValueContainer}>
                <Text variant="title">{metric.value}</Text>
                <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                  {metric.unit}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.chartContainer}>{renderLineChart(metric)}</View>
          )}
        </View>

        <View style={styles.metricFooter}>
          {metric.goal && (
            <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
              Goal: {metric.goal} {metric.unit}
            </Text>
          )}
        </View>
      </GlassMorphicCard>
    )
  }

  // Render workout summary
  const renderWorkoutSummary = () => {
    if (!healthData) return null

    return (
      <GlassMorphicCard style={styles.workoutSummaryCard}>
        <LinearGradient
          colors={[
            theme.dark ? "rgba(10, 132, 255, 0.1)" : "rgba(10, 132, 255, 0.05)",
            theme.dark ? "rgba(50, 215, 75, 0.1)" : "rgba(50, 215, 75, 0.05)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <Text variant="subtitle">Workout Summary</Text>

        <View style={styles.workoutStats}>
          <View style={styles.workoutStat}>
            <View style={[styles.workoutStatIcon, { backgroundColor: theme.colors.primary }]}>
              <Activity size={20} color="#FFFFFF" />
            </View>
            <View style={styles.workoutStatText}>
              <Text variant="title">{healthData.workouts.week}</Text>
              <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                This Week
              </Text>
            </View>
          </View>

          <View style={styles.workoutStat}>
            <View style={[styles.workoutStatIcon, { backgroundColor: theme.colors.secondary }]}>
              <TrendingUp size={20} color="#FFFFFF" />
            </View>
            <View style={styles.workoutStatText}>
              <Text variant="title">{healthData.workouts.month}</Text>
              <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                This Month
              </Text>
            </View>
          </View>

          <View style={styles.workoutStat}>
            <View style={[styles.workoutStatIcon, { backgroundColor: theme.colors.accent }]}>
              <Clock size={20} color="#FFFFFF" />
            </View>
            <View style={styles.workoutStatText}>
              <Text variant="title">{Math.round(healthData.workouts.duration / 60)}</Text>
              <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
                Hours
              </Text>
            </View>
          </View>
        </View>
      </GlassMorphicCard>
    )
  }

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
        <Text variant="title">Health Metrics</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddHealthMetric")}
        >
          <Plus size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Workout Summary */}
        <Animated.View entering={FadeIn.delay(100).duration(300)}>
          {renderWorkoutSummary()}
        </Animated.View>

        {/* Workout Progress Chart */}
        <Animated.View entering={FadeIn.delay(200).duration(300)}>
          <Text variant="subtitle" style={styles.sectionTitle}>
            Workout Progress
          </Text>
          {user && <WorkoutProgressChart userId={user.id} />}
        </Animated.View>

        {/* Health Metrics */}
        <Animated.View entering={FadeIn.delay(300).duration(300)}>
          <Text variant="subtitle" style={styles.sectionTitle}>
            Health Metrics
          </Text>
          <View style={styles.metricsGrid}>
            {getHealthMetrics().map((metric, index) => renderMetricCard(metric, index))}
          </View>
        </Animated.View>

        {/* Connect Health Apps */}
        <Animated.View entering={FadeIn.delay(400).duration(300)}>
          <GlassMorphicCard style={styles.connectCard}>
            <Text variant="subtitle">Connect Health Apps</Text>
            <Text variant="body" style={{ color: theme.colors.text.secondary, marginTop: 8 }}>
              Connect with Apple Health, Google Fit, or other health apps to automatically sync your
              health data.
            </Text>
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate("ConnectHealthApps")}
            >
              <Text variant="button" style={{ color: theme.colors.text.inverse }}>
                Connect Apps
              </Text>
            </TouchableOpacity>
          </GlassMorphicCard>
        </Animated.View>

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  addButton: {
    padding: 8,
  },
  backButton: {
    padding: 8,
  },
  chartContainer: {
    height: "100%",
    width: "100%",
  },
  connectButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  connectCard: {
    marginBottom: 16,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  metricCard: {
    marginBottom: 16,
    padding: 16,
    width: (SCREEN_WIDTH - 60) / 2,
  },
  metricContent: {
    alignItems: "center",
    height: 120,
    justifyContent: "center",
  },
  metricFooter: {
    alignItems: "center",
    marginTop: 16,
  },
  metricHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 16,
  },
  metricIcon: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    marginRight: 8,
    width: 32,
  },
  metricValueContainer: {
    alignItems: "center",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  progressContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 16,
    marginHorizontal: 20,
    marginTop: 24,
  },
  workoutStat: {
    alignItems: "center",
  },
  workoutStatIcon: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginBottom: 8,
    width: 40,
  },
  workoutStatText: {
    alignItems: "center",
  },
  workoutStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  workoutSummaryCard: {
    marginHorizontal: 20,
    marginTop: 8,
    overflow: "hidden",
    padding: 16,
  },
})
