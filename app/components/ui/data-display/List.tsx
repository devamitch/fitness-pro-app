import type { ReactNode } from "react"
import { TouchableOpacity, FlatList, StyleSheet } from "react-native"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"
import { Divider } from "./Divider"

export interface ListItemProps {
  title: string
  subtitle?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  onPress?: () => void
  disabled?: boolean
}

export interface ListProps {
  data: ListItemProps[]
  showDividers?: boolean
  emptyText?: string
  ListHeaderComponent?: ReactNode
  ListFooterComponent?: ReactNode
}

export const ListItem = ({ title, subtitle, leftIcon, rightIcon, onPress, disabled = false }: ListItemProps) => {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || !onPress} activeOpacity={0.7} style={styles.item}>
      <Box flexDirection="row" alignItems="center" padding="md" opacity={disabled ? 0.5 : 1}>
        {leftIcon && <Box marginRight="md">{leftIcon}</Box>}

        <Box flex={1}>
          <Text variant={subtitle ? "subtitle" : "body"}>{title}</Text>
          {subtitle && (
            <Text variant="caption" color="textSecondary" marginTop="xs">
              {subtitle}
            </Text>
          )}
        </Box>

        {rightIcon && <Box marginLeft="md">{rightIcon}</Box>}
      </Box>
    </TouchableOpacity>
  )
}

export const List = ({
  data,
  showDividers = true,
  emptyText = "No items",
  ListHeaderComponent,
  ListFooterComponent,
}: ListProps) => {
  return (
    <FlatList
      data={data}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item }) => <ListItem {...item} />}
      ItemSeparatorComponent={showDividers ? () => <Divider spacing="none" /> : undefined}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={
        <Box padding="lg" alignItems="center">
          <Text color="textMuted">{emptyText}</Text>
        </Box>
      }
      contentContainerStyle={styles.container}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  item: {
    width: "100%",
  },
})
