"use client"

import { customFontsToLoad } from "@/theme/typography"
import { Canvas, Group, Path, Text as SkiaText, useFont, vec } from "@shopify/react-native-skia"
import { useQuery } from "@tanstack/react-query"
import { Calendar, ChevronLeft, ChevronRight, Clock, Dumbbell, Flame } from "lucide-react-native"
import type React from "react"
import { useState } from "react"
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import { supabaseHelper } from "../services/supabase"
import { useTheme } from "../theme/theme"
import { GlassMorphicCard } from "./GlassMorphicCard"
import { Text } from "./Text"

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const CHART_HEIGHT = 200
const CHART_WIDTH = SCREEN_WIDTH - 40 // 20px padding on each side
const CHART_PADDING = 20
const DAYS_TO_SHOW = 7

interface WorkoutData {
  date: string
  calories: number
  duration: number
  exercises: number
}

type ChartType = "calories" | "duration" | "exercises"
type TimeRange = "week" | "month" | "year"

interface WorkoutProgressChartProps {
  userId: string
}

export const WorkoutProgressChart: React.FC<WorkoutProgressChartProps> = ({ userId }) => {
  const theme = useTheme()
  const [chartType, setChartType] = useState<ChartType>("calories")
  const [timeRange, setTimeRange] = useState<TimeRange>("week")
  const [startDate, setStartDate] = useState<Date>(new Date())

  // Load font for Skia
  const font = useFont(customFontsToLoad)

  // Fetch workout data
  const { data: workoutData, isLoading } = useQuery({
    queryKey: ["workout-progress", userId, timeRange, startDate.toISOString()],
    queryFn: async () => {
      try {
        // Calculate date range
        const endDate = new Date(startDate)
        const startDateQuery = new Date(startDate)

        if (timeRange === "week") {
          startDateQuery.setDate(startDateQuery.getDate() - 6) // 7 days including today
        } else if (timeRange === "month") {
          startDateQuery.setDate(startDateQuery.getDate() - 29) // 30 days including today
        } else if (timeRange === "year") {
          startDateQuery.setMonth(startDateQuery.getMonth() - 11) // 12 months including current
        }

        // Fetch data from Supabase
        const { data, error } = await supabaseHelper.fetch<any>("workout_progress", {
          column: "user_id",
          value: userId,
          order: { column: "date", ascending: true },
        })

        if (error) throw error

        // Filter data by date range
        const filteredData = data.filter((item: any) => {
          const itemDate = new Date(item.date)
          return itemDate >= startDateQuery && itemDate <= endDate
        })

        // Format data
        return filteredData.map((item: any) => ({
          date: item.date,
          calories: item.calories_burned || 0,
          duration: item.duration_minutes || 0,
          exercises: item.exercises_completed || 0,
        }))
      } catch (error) {
        console.error("Error fetching workout progress:", error)
        return []
      }
    },
  })

  // Generate mock data if no data is available
  const getChartData = (): WorkoutData[] => {
    if (workoutData && workoutData.length > 0) return workoutData

    // Generate mock data
    const mockData: WorkoutData[] = []
    const endDate = new Date(startDate)
    const currentDate = new Date(startDate)

    if (timeRange === "week") {
      currentDate.setDate(currentDate.getDate() - 6) // Start 6 days ago
      for (let i = 0; i < 7; i++) {
        mockData.push({
          date: new Date(currentDate).toISOString().split("T")[0],
          calories: Math.floor(Math.random() * 400) + 100,
          duration: Math.floor(Math.random() * 60) + 15,
          exercises: Math.floor(Math.random() * 8) + 1,
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else if (timeRange === "month") {
      currentDate.setDate(currentDate.getDate() - 29) // Start 29 days ago
      for (let i = 0; i < 30; i++) {
        mockData.push({
          date: new Date(currentDate).toISOString().split("T")[0],
          calories: Math.floor(Math.random() * 400) + 100,
          duration: Math.floor(Math.random() * 60) + 15,
          exercises: Math.floor(Math.random() * 8) + 1,
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else if (timeRange === "year") {
      currentDate.setMonth(currentDate.getMonth() - 11) // Start 11 months ago
      for (let i = 0; i < 12; i++) {
        mockData.push({
          date: new Date(currentDate).toISOString().split("T")[0],
          calories: Math.floor(Math.random() * 400) + 100,
          duration: Math.floor(Math.random() * 60) + 15,
          exercises: Math.floor(Math.random() * 8) + 1,
        })
        currentDate.setMonth(currentDate.getMonth() + 1)
      }
    }

    return mockData
  }

  // Navigate to previous time period
  const goToPrevious = () => {
    const newDate = new Date(startDate)
    if (timeRange === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else if (timeRange === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (timeRange === "year") {
      newDate.setFullYear(newDate.getFullYear() - 1)
    }
    setStartDate(newDate)
  }

  // Navigate to next time period
  const goToNext = () => {
    const newDate = new Date(startDate)
    if (timeRange === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else if (timeRange === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (timeRange === "year") {
      newDate.setFullYear(newDate.getFullYear() + 1)
    }
    // Don't allow navigating to the future
    if (newDate <= new Date()) {
      setStartDate(newDate)
    }
  }

  // Format date range for display
  const getDateRangeText = (): string => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
    const yearOptions: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" }

    if (timeRange === "week") {
      const startOfWeek = new Date(startDate)
      startOfWeek.setDate(startOfWeek.getDate() - 6)
      return `${startOfWeek.toLocaleDateString(undefined, options)} - ${startDate.toLocaleDateString(
        undefined,
        options,
      )}`
    } else if (timeRange === "month") {
      const startOfMonth = new Date(startDate)
      startOfMonth.setDate(startOfMonth.getDate() - 29)
      return `${startOfMonth.toLocaleDateString(undefined, options)} - ${startDate.toLocaleDateString(
        undefined,
        options,
      )}`
    } else {
      const startOfYear = new Date(startDate)
      startOfYear.setMonth(startOfYear.getMonth() - 11)
      return `${startOfYear.toLocaleDateString(undefined, yearOptions)} - ${startDate.toLocaleDateString(
        undefined,
        yearOptions,
      )}`
    }
  }

  // Get chart data based on selected type
  const getChartValues = (): number[] => {
    const data = getChartData()
    return data.map((item) => item[chartType])
  }

  // Get chart labels
  const getChartLabels = (): string[] => {
    const data = getChartData()
    if (timeRange === "week") {
      return data.map((item) => {
        const date = new Date(item.date)
        return date.toLocaleDateString(undefined, { weekday: "short" }).substring(0, 3)
      })
    } else if (timeRange === "month") {
      return data.map((item) => {
        const date = new Date(item.date)
        return date.getDate().toString()
      })
    } else {
      return data.map((item) => {
        const date = new Date(item.date)
        return date.toLocaleDateString(undefined, { month: "short" }).substring(0, 3)
      })
    }
  }

  // Get max value for chart scaling
  const getMaxValue = (): number => {
    const values = getChartValues()
    const max = Math.max(...values)
    return max === 0 ? 100 : Math.ceil(max * 1.2) // Add 20% padding
  }

  // Get chart title
  const getChartTitle = (): string => {
    switch (chartType) {
      case "calories":
        return "Calories Burned"
      case "duration":
        return "Workout Duration (min)"
      case "exercises":
        return "Exercises Completed"
      default:
        return ""
    }
  }

  // Get chart color
  const getChartColor = (): string => {
    switch (chartType) {
      case "calories":
        return theme.colors.primary
      case "duration":
        return theme.colors.secondary
      case "exercises":
        return theme.colors.accent
      default:
        return theme.colors.primary
    }
  }

  // Render bar chart
  const renderBarChart = () => {
    if (!font) return null

    const values = getChartValues()
    const labels = getChartLabels()
    const maxValue = getMaxValue()
    const chartColor = getChartColor()

    // Calculate bar width based on number of bars
    const barWidth = (CHART_WIDTH - CHART_PADDING * 2) / values.length - 8

    return (
      <Canvas style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = CHART_HEIGHT - CHART_PADDING - ratio * (CHART_HEIGHT - CHART_PADDING * 2)
          return (
            <Group key={index}>
              <Path
                path={`M ${CHART_PADDING} ${y} H ${CHART_WIDTH - CHART_PADDING}`}
                color={theme.colors.card.border}
                style="stroke"
                strokeWidth={1}
              />
              <SkiaText
                text={Math.round(maxValue * ratio).toString()}
                x={CHART_PADDING - 5}
                y={y + 4}
                font={font}
                color={theme.colors.text.tertiary}
                align="right"
              />
            </Group>
          )
        })}

        {/* Bars */}
        {values.map((value, index) => {
          const barHeight = ((CHART_HEIGHT - CHART_PADDING * 2) * value) / maxValue
          const x = CHART_PADDING + index * ((CHART_WIDTH - CHART_PADDING * 2) / values.length) + 4
          const y = CHART_HEIGHT - CHART_PADDING - barHeight

          return (
            <Group key={index}>
              <Path
                path={`M ${x} ${CHART_HEIGHT - CHART_PADDING} V ${y} H ${x + barWidth} V ${
                  CHART_HEIGHT - CHART_PADDING
                } Z`}
                color={chartColor}
                style="fill"
              />
              <SkiaText
                text={labels[index]}
                x={x + barWidth / 2}
                y={CHART_HEIGHT - 5}
                font={font}
                color={theme.colors.text.tertiary}
                align="center"
              />
            </Group>
          )
        })}
      </Canvas>
    )
  }

  // Render line chart
  const renderLineChart = () => {
    if (!font) return null

    const values = getChartValues()
    const labels = getChartLabels()
    const maxValue = getMaxValue()
    const chartColor = getChartColor()

    // Calculate point positions
    const points = values.map((value, index) => {
      const x = CHART_PADDING + index * ((CHART_WIDTH - CHART_PADDING * 2) / (values.length - 1))
      const y =
        CHART_HEIGHT - CHART_PADDING - ((CHART_HEIGHT - CHART_PADDING * 2) * value) / maxValue
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
    areaPath += ` L ${points[points.length - 1].x} ${CHART_HEIGHT - CHART_PADDING}`
    areaPath += ` L ${points[0].x} ${CHART_HEIGHT - CHART_PADDING}`
    areaPath += " Z"

    return (
      <Canvas style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = CHART_HEIGHT - CHART_PADDING - ratio * (CHART_HEIGHT - CHART_PADDING * 2)
          return (
            <Group key={index}>
              <Path
                path={`M ${CHART_PADDING} ${y} H ${CHART_WIDTH - CHART_PADDING}`}
                color={theme.colors.card.border}
                style="stroke"
                strokeWidth={1}
              />
              <SkiaText
                text={Math.round(maxValue * ratio).toString()}
                x={CHART_PADDING - 5}
                y={y + 4}
                font={font}
                color={theme.colors.text.tertiary}
                align="right"
              />
            </Group>
          )
        })}

        {/* Area under line */}
        <Path path={areaPath} color={`${chartColor}40`} style="fill" />

        {/* Line */}
        <Path path={linePath} color={chartColor} style="stroke" strokeWidth={3} />

        {/* Points */}
        {points.map((point, index) => (
          <Group key={index}>
            <Path
              path={`M ${point.x} ${point.y} m -4, 0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0`}
              color={chartColor}
              style="fill"
            />
            <SkiaText
              text={labels[index]}
              x={point.x}
              y={CHART_HEIGHT - 5}
              font={font}
              color={theme.colors.text.tertiary}
              align="center"
            />
          </Group>
        ))}
      </Canvas>
    )
  }

  return (
    <GlassMorphicCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="subtitle">{getChartTitle()}</Text>
        <View style={styles.chartTypeButtons}>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "calories" && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setChartType("calories")}
          >
            <Flame
              size={16}
              color={
                chartType === "calories" ? theme.colors.text.inverse : theme.colors.text.primary
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "duration" && { backgroundColor: theme.colors.secondary },
            ]}
            onPress={() => setChartType("duration")}
          >
            <Clock
              size={16}
              color={
                chartType === "duration" ? theme.colors.text.inverse : theme.colors.text.primary
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "exercises" && { backgroundColor: theme.colors.accent },
            ]}
            onPress={() => setChartType("exercises")}
          >
            <Dumbbell
              size={16}
              color={
                chartType === "exercises" ? theme.colors.text.inverse : theme.colors.text.primary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity style={styles.navButton} onPress={goToPrevious}>
          <ChevronLeft size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.dateContainer}>
          <Calendar size={16} color={theme.colors.text.tertiary} />
          <Text variant="caption" style={{ marginLeft: 4 }}>
            {getDateRangeText()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.navButton}
          onPress={goToNext}
          disabled={new Date(startDate).toDateString() === new Date().toDateString()}
        >
          <ChevronRight
            size={20}
            color={
              new Date(startDate).toDateString() === new Date().toDateString()
                ? theme.colors.text.tertiary
                : theme.colors.text.primary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeSelector}>
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === "week" && { backgroundColor: theme.colors.background.tertiary },
          ]}
          onPress={() => setTimeRange("week")}
        >
          <Text
            variant="caption"
            style={{
              color: timeRange === "week" ? theme.colors.text.primary : theme.colors.text.tertiary,
            }}
          >
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === "month" && { backgroundColor: theme.colors.background.tertiary },
          ]}
          onPress={() => setTimeRange("month")}
        >
          <Text
            variant="caption"
            style={{
              color: timeRange === "month" ? theme.colors.text.primary : theme.colors.text.tertiary,
            }}
          >
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === "year" && { backgroundColor: theme.colors.background.tertiary },
          ]}
          onPress={() => setTimeRange("year")}
        >
          <Text
            variant="caption"
            style={{
              color: timeRange === "year" ? theme.colors.text.primary : theme.colors.text.tertiary,
            }}
          >
            Year
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chart */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.chartContainer}>
        {renderBarChart()}
      </Animated.View>

      {/* Chart Type Selector */}
      <View style={styles.chartTypeSelector}>
        <TouchableOpacity style={styles.chartTypeOption} onPress={() => setChartType("calories")}>
          <View
            style={[
              styles.chartTypeIcon,
              {
                backgroundColor:
                  chartType === "calories"
                    ? theme.colors.primary
                    : theme.colors.background.tertiary,
              },
            ]}
          >
            <Flame
              size={16}
              color={
                chartType === "calories" ? theme.colors.text.inverse : theme.colors.text.tertiary
              }
            />
          </View>
          <View style={styles.chartTypeText}>
            <Text variant="caption">Calories</Text>
            <Text variant="subtitle">
              {getChartData()
                .reduce((sum, item) => sum + item.calories, 0)
                .toLocaleString()}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.chartTypeOption} onPress={() => setChartType("duration")}>
          <View
            style={[
              styles.chartTypeIcon,
              {
                backgroundColor:
                  chartType === "duration"
                    ? theme.colors.secondary
                    : theme.colors.background.tertiary,
              },
            ]}
          >
            <Clock
              size={16}
              color={
                chartType === "duration" ? theme.colors.text.inverse : theme.colors.text.tertiary
              }
            />
          </View>
          <View style={styles.chartTypeText}>
            <Text variant="caption">Duration</Text>
            <Text variant="subtitle">
              {getChartData()
                .reduce((sum, item) => sum + item.duration, 0)
                .toLocaleString()}{" "}
              min
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.chartTypeOption} onPress={() => setChartType("exercises")}>
          <View
            style={[
              styles.chartTypeIcon,
              {
                backgroundColor:
                  chartType === "exercises"
                    ? theme.colors.accent
                    : theme.colors.background.tertiary,
              },
            ]}
          >
            <Dumbbell
              size={16}
              color={
                chartType === "exercises" ? theme.colors.text.inverse : theme.colors.text.tertiary
              }
            />
          </View>
          <View style={styles.chartTypeText}>
            <Text variant="caption">Exercises</Text>
            <Text variant="subtitle">
              {getChartData()
                .reduce((sum, item) => sum + item.exercises, 0)
                .toLocaleString()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </GlassMorphicCard>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTypeButtons: {
    flexDirection: "row",
  },
  chartTypeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)",
  },
  dateNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeRangeSelector: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  chartContainer: {
    height: CHART_HEIGHT,
    marginBottom: 16,
  },
  chartTypeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartTypeOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  chartTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chartTypeText: {
    marginLeft: 8,
  },
})
