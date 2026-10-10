import { z } from "zod"

// Define color schema
export const ColorSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  cardBackground: z.string(),
  cardBackgroundSecondary: z.string(),
  text: z.string(),
  textSecondary: z.string(),
  textMuted: z.string(),
  textInverted: z.string(),
  border: z.string(),
  borderColor: z.string(),
  shadow: z.string(),
  shadowColor: z.string(),
  divider: z.string(),
  buttonBackground: z.string(),
  buttonText: z.string(),
  buttonDisabled: z.string(),
  success: z.string(),
  error: z.string(),
  warning: z.string(),
  info: z.string(),
  white: z.string(),
  black: z.string(),
  transparent: z.string(),
})

// Define spacing schema
export const SpacingSchema = z.object({
  none: z.number(),
  xxs: z.number(),
  xs: z.number(),
  sm: z.number(),
  md: z.number(),
  lg: z.number(),
  xl: z.number(),
  xxl: z.number(),
  xxxl: z.number(),
})

// Define border radii schema
export const BorderRadiiSchema = z.object({
  none: z.number(),
  sm: z.number(),
  md: z.number(),
  lg: z.number(),
  xl: z.number(),
  xxl: z.number(),
  rounded: z.number(),
})

// Define text variant schema
export const TextVariantSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number(),
  lineHeight: z.number().optional(),
  fontWeight: z.string().optional(),
  letterSpacing: z.number().optional(),
  color: z.string().optional(),
})

// Define text variants schema
export const TextVariantsSchema = z.object({
  defaults: TextVariantSchema,
  header: TextVariantSchema.partial(),
  subheader: TextVariantSchema.partial(),
  title: TextVariantSchema.partial(),
  subtitle: TextVariantSchema.partial(),
  body: TextVariantSchema.partial(),
  bodyBold: TextVariantSchema.partial(),
  button: TextVariantSchema.partial(),
  caption: TextVariantSchema.partial(),
  footnote: TextVariantSchema.partial(),
  moonlight: TextVariantSchema.partial(),
})

// Define card variant schema
export const CardVariantSchema = z.object({
  backgroundColor: z.string().optional(),
  borderRadius: z.string().optional(),
  padding: z.string().optional(),
  shadowColor: z.string().optional(),
  shadowOffset: z.object({ width: z.number(), height: z.number() }).optional(),
  shadowOpacity: z.number().optional(),
  shadowRadius: z.number().optional(),
  elevation: z.number().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
})

// Define card variants schema
export const CardVariantsSchema = z.object({
  defaults: CardVariantSchema,
  primary: CardVariantSchema.partial(),
  secondary: CardVariantSchema.partial(),
  interactive: CardVariantSchema.partial(),
})

// Define button variant schema
export const ButtonVariantSchema = z.object({
  backgroundColor: z.string().optional(),
  borderRadius: z.string().optional(),
  padding: z.string().optional(),
  justifyContent: z.string().optional(),
  alignItems: z.string().optional(),
  flexDirection: z.string().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
})

// Define button variants schema
export const ButtonVariantsSchema = z.object({
  defaults: ButtonVariantSchema,
  primary: ButtonVariantSchema.partial(),
  secondary: ButtonVariantSchema.partial(),
  outline: ButtonVariantSchema.partial(),
  disabled: ButtonVariantSchema.partial(),
})

// Define theme schema
export const ThemeSchema = z.object({
  colors: ColorSchema,
  spacing: SpacingSchema,
  borderRadii: BorderRadiiSchema,
  textVariants: TextVariantsSchema,
  cardVariants: CardVariantsSchema,
  buttonVariants: ButtonVariantsSchema,
  breakpoints: z.record(z.string(), z.number()),
})

// Define theme mode
export const ThemeModeSchema = z.enum(["light", "dark", "system"])

// Export types
export type ThemeMode = z.infer<typeof ThemeModeSchema>
export type ThemeColors = z.infer<typeof ColorSchema>
export type ThemeSpacing = z.infer<typeof SpacingSchema>
export type ThemeBorderRadii = z.infer<typeof BorderRadiiSchema>
export type ThemeTextVariants = z.infer<typeof TextVariantsSchema>
export type ThemeCardVariants = z.infer<typeof CardVariantsSchema>
export type ThemeButtonVariants = z.infer<typeof ButtonVariantsSchema>
export type Theme = z.infer<typeof ThemeSchema>
