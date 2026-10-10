"use client"

import { customFontsToLoad } from "@/theme"
import {
  Canvas,
  Circle,
  Path,
  Skia,
  Text as SkiaText,
  runTiming,
  useComputedValue,
  useFont,
  useValue,
} from "@shopify/react-native-skia"
import { curveBasis, line } from "d3-shape"
import React, { useState } from "react"
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useTheme } from "../theme/theme"
import { GlassMorphicCard } from "./GlassMorphicCard"
import { Text } from "./Text"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

type DataPoint = {
  value: number
  date: Date
}

type VitalType = "heartRate" | "calories" | "steps" | "sleep" | "weight"

interface VitalReportsChartProps {
  data: {
    heartRate?: DataPoint[]
    calories?: DataPoint[]
    steps?: DataPoint[]
    sleep?: DataPoint[]
    weight?: DataPoint[]
  }
  width?: number
  height?: number
  title?: string
}

export const VitalReportsChart: React.FC<VitalReportsChartProps> = ({
  data,
  width = SCREEN_WIDTH - 40,
  height = 300,
  title = "Health Metrics",
}) => {
  const theme = useTheme()
  const [selectedVital, setSelectedVital] = useState<VitalType>("heartRate")
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week")

  // Load fonts
  const labelFont = useFont(customFontsToLoad.interMedium)
  const valueFont = useFont(customFontsToLoad.interBold)

  // Animation values
  const progress = useValue(0)
  const selectedTabPosition = useSharedValue(0)

  // Run animation when data or selected vital changes
  React.useEffect(() => {
    progress.current = 0
    runTiming(progress, 1, { duration: 1000 })

    // Update tab position
    const tabIndex = ["heartRate", "calories", "steps", "sleep", "weight"].indexOf(selectedVital)
    selectedTabPosition.value = withTiming(tabIndex * (width / 5), {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
  }, [selectedVital, timeRange, data])

  // Get the selected data
  const selectedData = data[selectedVital] || []

  // Filter data based on time range
  const filteredData = React.useMemo(() => {
    const now = new Date()
    const filtered = selectedData.filter((point) => {
      const pointDate = new Date(point.date)

      if (timeRange === "week") {
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        return pointDate >= weekAgo
      } else if (timeRange === "month") {
        const monthAgo = new Date(now)
        monthAgo.setMonth(now.getMonth() - 1)
        return pointDate >= monthAgo
      } else {
        const yearAgo = new Date(now)
        yearAgo.setFullYear(now.getFullYear() - 1)
        return pointDate >= yearAgo
      }
    })

    return filtered
  }, [selectedData, timeRange])

  // Calculate min, max, and average values
  const stats = React.useMemo(() => {
    if (filteredData.length === 0) {
      return { min: 0, max: 0, avg: 0 }
    }

    const values = filteredData.map((point) => point.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length

    return { min, max, avg: Math.round(avg) }
  }, [filteredData])

  // Create path for the chart
  const createPath = (dataPoints: DataPoint[]) => {
    if (dataPoints.length === 0) return ""

    const sortedData = [...dataPoints].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    const values = sortedData.map((point) => point.value)
    const maxValue = Math.max(...values, 1)
    const minValue = Math.min(...values, 0)
    const range = maxValue - minValue

    const chartHeight = height - 100 // Leave space for labels

    const xGetter = (_: any, i: number) => i * (width / (sortedData.length - 1 || 1))
    const yGetter = (d: DataPoint) =>
      chartHeight - ((d.value - minValue) / (range || 1)) * chartHeight * 0.8 - 20

    const lineGenerator = line<DataPoint>().x(xGetter).y(yGetter).curve(curveBasis)

    return lineGenerator(sortedData) || ""
  }

  // Create the path
  const path = createPath(filteredData)
  const skPath = path ? Skia.Path.MakeFromSVGString(path) : null

  // Animated path
  const animatedPath = useComputedValue(() => {
    if (!skPath) return ""

    const length = skPath.getLength()
    const end = length * progress.current

    return skPath.copy().trim(0, end, false).toSVGString() || ""
  }, [progress, skPath])

  // Create fill path
  const fillPath = useComputedValue(() => {
    if (!skPath) return ""

    const filledPath = Skia.Path.MakeFromSVGString(skPath.toSVGString() || "")
    if (!filledPath) return ""

    filledPath.lineTo(width, height - 20)
    filledPath.lineTo(0, height - 20)
    filledPath.close()

    return filledPath
  }, [skPath])

  // Animated fill path
  const animatedFillPath = useComputedValue(() => {
    if (!skPath) return ""

    const length = skPath.getLength()
    const end = length * progress.current
    const trimmedPath = skPath.copy().trim(0, end, false)

    const filledPath = Skia.Path.MakeFromSVGString(trimmedPath.toSVGString() || "")
    if (!filledPath) return ""

    filledPath.lineTo(width * progress.current, height - 20)
    filledPath.lineTo(0, height - 20)
    filledPath.close()

    return filledPath
  }, [progress, skPath])

  // Generate x-axis labels
  const xLabels = React.useMemo(() => {
    if (filteredData.length === 0 || !labelFont) return []

    const sortedData = [...filteredData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    // Limit to 5 labels to avoid crowding
    const step = Math.max(1, Math.floor(sortedData.length / 5))
    const labels = []

    for (let i = 0; i < sortedData.length; i += step) {
      const date = new Date(sortedData[i].date)
      let label = ""

      if (timeRange === "week") {
        label = date.toLocaleDateString(undefined, { weekday: "short" })
      } else if (timeRange === "month") {
        label = date.toLocaleDateString(undefined, { day: "numeric", month: "short" })
      } else {
        label = date.toLocaleDateString(undefined, { month: "short" })
      }

      const x = (i / (sortedData.length - 1)) * width

      labels.push({ label, x })
    }

    return labels
  }, [filteredData, timeRange, labelFont])

  // Generate data points for the chart
  const dataPoints = React.useMemo(() => {
    if (filteredData.length === 0) return []

    const sortedData = [...filteredData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    const values = sortedData.map((point) => point.value)
    const maxValue = Math.max(...values, 1)
    const minValue = Math.min(...values, 0)
    const range = maxValue - minValue

    const chartHeight = height - 100

    return sortedData.map((point, index) => {
      const x = (index / (sortedData.length - 1)) * width
      const y = chartHeight - ((point.value - minValue) / (range || 1)) * chartHeight * 0.8 - 20

      return { x, y, value: point.value }
    })
  }, [filteredData, height, width])

  // Tab indicator style
  const tabIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: selectedTabPosition.value }],
    }
  })

  // Get color for the selected vital
  const getVitalColor = () => {
    switch (selectedVital) {
      case "heartRate":
        return theme.colors.status.error
      case "calories":
        return theme.colors.status.warning
      case "steps":
        return theme.colors.primary
      case "sleep":
        return theme.colors.secondary
      case "weight":
        return theme.colors.accent
      default:
        return theme.colors.primary
    }
  }

  // Get unit for the selected vital
  const getVitalUnit = () => {
    switch (selectedVital) {
      case "heartRate":
        return "bpm"
      case "calories":
        return "kcal"
      case "steps":
        return "steps"
      case "sleep":
        return "hours"
      case "weight":
        return "kg"
      default:
        return ""
    }
  }

  return (
    <GlassMorphicCard style={styles.container}>
      <Text variant="subtitle" style={styles.title}>
        {title}
      </Text>

      {/* Vital type tabs */}
      <View style={styles.tabsContainer}>
        <Animated.View
          style={[
            styles.tabIndicator,
            { backgroundColor: getVitalColor(), width: width / 5 },
            tabIndicatorStyle,
          ]}
        />

        <TouchableOpacity style={styles.tab} onPress={() => setSelectedVital("heartRate")}>
          <Text
            variant="caption"
            style={[
              styles.tabText,
              selectedVital === "heartRate" && { color: theme.colors.text.inverse },
            ]}
          >
            Heart
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={() => setSelectedVital("calories")}>
          <Text
            variant="caption"
            style={[
              styles.tabText,
              selectedVital === "calories" && { color: theme.colors.text.inverse },
            ]}
          >
            Calories
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={() => setSelectedVital("steps")}>
          <Text
            variant="caption"
            style={[
              styles.tabText,
              selectedVital === "steps" && { color: theme.colors.text.inverse },
            ]}
          >
            Steps
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={() => setSelectedVital("sleep")}>
          <Text
            variant="caption"
            style={[
              styles.tabText,
              selectedVital === "sleep" && { color: theme.colors.text.inverse },
            ]}
          >
            Sleep
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={() => setSelectedVital("weight")}>
          <Text
            variant="caption"
            style={[
              styles.tabText,
              selectedVital === "weight" && { color: theme.colors.text.inverse },
            ]}
          >
            Weight
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time range selector */}
      <View style={styles.timeRangeContainer}>
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === "week" && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setTimeRange("week")}
        >
          <Text
            variant="caption"
            style={[
              styles.timeRangeText,
              timeRange === "week" && { color: theme.colors.text.inverse },
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === "month" && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setTimeRange("month")}
        >
          <Text
            variant="caption"
            style={[
              styles.timeRangeText,
              timeRange === "month" && { color: theme.colors.text.inverse },
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === "year" && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setTimeRange("year")}
        >
          <Text
            variant="caption"
            style={[
              styles.timeRangeText,
              timeRange === "year" && { color: theme.colors.text.inverse },
            ]}
          >
            Year
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text variant="caption" style={styles.statLabel}>
            Average
          </Text>
          <Text variant="title" style={[styles.statValue, { color: getVitalColor() }]}>
            {stats.avg}
            <Text variant="caption" style={styles.statUnit}>
              {" "}
              {getVitalUnit()}
            </Text>
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text variant="caption" style={styles.statLabel}>
            Min
          </Text>
          <Text variant="subtitle" style={styles.statValue}>
            {stats.min}
            <Text variant="caption" style={styles.statUnit}>
              {" "}
              {getVitalUnit()}
            </Text>
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text variant="caption" style={styles.statLabel}>
            Max
          </Text>
          <Text variant="subtitle" style={styles.statValue}>
            {stats.max}
            <Text variant="caption" style={styles.statUnit}>
              {" "}
              {getVitalUnit()}
            </Text>
          </Text>
        </View>
      </View>

      {/* Chart */}
      <Canvas style={{ width, height: height - 80 }}>
        <Path path={animatedPath} style="stroke" color={getVitalColor()} strokeWidth={2} />
        <Path path={animatedFillPath.current} style="fill" color={getVitalColor()} opacity={0.2} />

        {/* X-axis labels */}
        {xLabels.map((label, index) => (
          <SkiaText
            key={index}
            text={label.label}
            x={label.x}
            y={height - 70}
            font={labelFont}
            color={theme.colors.text.secondary}
            textAlign="center"
            textAnchor="middle"
          />
        ))}

        {/* Data points */}
        {dataPoints.map((point, index) => (
          <Circle key={index} cx={point.x} cy={point.y} r={3} color={getVitalColor()} />
        ))}
      </Canvas>
    </GlassMorphicCard>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginBottom: 20,
    padding: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: "gray",
    fontSize: 12,
  },
  statUnit: {
    color: "gray",
    fontSize: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  tab: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabIndicator: {
    borderRadius: 20,
    height: "100%",
    position: "absolute",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    position: "relative",
  },
  timeRangeButton: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  timeRangeText: {
    fontSize: 12,
  },
  title: {
    marginBottom: 10,
    textAlign: "center",
  },
})
