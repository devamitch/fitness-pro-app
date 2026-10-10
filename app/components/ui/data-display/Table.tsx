import type { ReactNode } from "react"
import { ScrollView, StyleSheet } from "react-native"
import { Box } from "../layout/Box"
import { Text } from "../typography/Text"

export interface TableColumn<T> {
  key: string
  title: string
  width?: number | string
  render?: (item: T, index: number) => ReactNode
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  emptyText?: string
  stickyHeader?: boolean
  striped?: boolean
}

export function Table<T>({ data, columns, emptyText = "No data", stickyHeader = true, striped = true }: TableProps<T>) {
  return (
    <Box>
      {/* Table Header */}
      <Box
        flexDirection="row"
        backgroundColor="cardBackgroundSecondary"
        borderBottomWidth={1}
        borderBottomColor="border"
        style={stickyHeader && styles.stickyHeader}
      >
        {columns.map((column) => (
          <Box key={column.key} width={column.width} flex={column.width ? undefined : 1} padding="sm">
            <Text variant="bodyBold" color="textSecondary">
              {column.title}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Table Body */}
      <ScrollView>
        {data.length === 0 ? (
          <Box padding="lg" alignItems="center">
            <Text color="textMuted">{emptyText}</Text>
          </Box>
        ) : (
          data.map((item, rowIndex) => (
            <Box
              key={rowIndex}
              flexDirection="row"
              backgroundColor={striped && rowIndex % 2 === 1 ? "cardBackgroundSecondary" : "cardBackground"}
              borderBottomWidth={1}
              borderBottomColor="border"
            >
              {columns.map((column, colIndex) => (
                <Box
                  key={`${rowIndex}-${colIndex}`}
                  width={column.width}
                  flex={column.width ? undefined : 1}
                  padding="sm"
                >
                  {column.render ? column.render(item, rowIndex) : <Text>{(item as any)[column.key]}</Text>}
                </Box>
              ))}
            </Box>
          ))
        )}
      </ScrollView>
    </Box>
  )
}

const styles = StyleSheet.create({
  stickyHeader: {
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
})
