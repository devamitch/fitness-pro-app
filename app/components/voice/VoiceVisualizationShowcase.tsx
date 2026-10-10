"use client"

import type React from "react"
import { useState } from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView, Text as RNText } from "react-native"
import { useVoiceData } from "../../hooks/useVoiceData"
import { VoiceVisualization, type VisualizationVariant, type VisualizationSize } from "./VoiceVisualization"
import { useTheme } from "../../theme/theme"
import { Text } from "../Text"
import { Mic, MicOff } from "lucide-react-native"

export const VoiceVisualizationShowcase: React.FC = () => {
  const theme = useTheme()
  const [isRecording, setIsRecording] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<VisualizationVariant>("wave")
  const [selectedSize, setSelectedSize] = useState<VisualizationSize>("component")

  const voiceData = useVoiceData({
    isRecording,
    simulateData: true,
    sensitivity: 1,
  })

  const variants: VisualizationVariant[] = ["wave", "circle", "bars", "dots", "pulse", "spectrum", "particle"]

  const sizes: VisualizationSize[] = ["icon", "button", "component", "screen"]

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <Text variant="title" style={[styles.title, { color: theme.colors.text.primary }]}>
        Voice Visualization Showcase
      </Text>

      {/* Main visualization */}
      <View style={styles.mainVisualization}>
        <VoiceVisualization
          voiceData={voiceData}
          variant={selectedVariant}
          size={selectedSize}
          width={selectedSize === "screen" ? 300 : undefined}
          height={selectedSize === "screen" ? 200 : undefined}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            { backgroundColor: isRecording ? theme.colors.status.error : theme.colors.primary },
          ]}
          onPress={() => setIsRecording(!isRecording)}
        >
          {isRecording ? <MicOff size={24} color="#FFFFFF" /> : <Mic size={24} color="#FFFFFF" />}
          <RNText style={styles.recordButtonText}>{isRecording ? "Stop" : "Start"}</RNText>
        </TouchableOpacity>
      </View>

      {/* Variant selector */}
      <Text variant="subtitle" style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        Visualization Type
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.variantSelector}>
        {variants.map((variant) => (
          <TouchableOpacity
            key={variant}
            style={[
              styles.variantButton,
              selectedVariant === variant && {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
              },
              { borderColor: theme.colors.card.border },
            ]}
            onPress={() => setSelectedVariant(variant)}
          >
            <RNText
              style={[
                styles.variantButtonText,
                { color: selectedVariant === variant ? "#FFFFFF" : theme.colors.text.primary },
              ]}
            >
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </RNText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Size selector */}
      <Text variant="subtitle" style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        Size
      </Text>
      <View style={styles.sizeSelector}>
        {sizes.map((size) => (
          <TouchableOpacity
            key={size}
            style={[
              styles.sizeButton,
              selectedSize === size && {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
              },
              { borderColor: theme.colors.card.border },
            ]}
            onPress={() => setSelectedSize(size)}
          >
            <RNText
              style={[styles.sizeButtonText, { color: selectedSize === size ? "#FFFFFF" : theme.colors.text.primary }]}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </RNText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Examples of different sizes */}
      <Text variant="subtitle" style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        Examples
      </Text>
      <View style={styles.examples}>
        <View style={styles.exampleRow}>
          <View style={styles.exampleItem}>
            <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
              Icon
            </Text>
            <VoiceVisualization voiceData={voiceData} variant={selectedVariant} size="icon" />
          </View>

          <View style={styles.exampleItem}>
            <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
              Button
            </Text>
            <VoiceVisualization voiceData={voiceData} variant={selectedVariant} size="button" />
          </View>

          <View style={styles.exampleItem}>
            <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
              Component
            </Text>
            <VoiceVisualization
              voiceData={voiceData}
              variant={selectedVariant}
              size="component"
              width={80}
              height={60}
            />
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
    textAlign: "center",
  },
  mainVisualization: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  recordButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  variantSelector: {
    flexDirection: "row",
    marginBottom: 24,
  },
  variantButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  variantButtonText: {
    fontWeight: "500",
  },
  sizeSelector: {
    flexDirection: "row",
    marginBottom: 24,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
  },
  sizeButtonText: {
    fontWeight: "500",
  },
  examples: {
    marginBottom: 24,
  },
  exampleRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  exampleItem: {
    alignItems: "center",
  },
})
