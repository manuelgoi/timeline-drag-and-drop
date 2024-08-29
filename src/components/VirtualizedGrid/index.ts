import VirtualizedGrid from './MainComponent.vue'

export interface ComplexValue {
  id: string
  row: number
  col: number
  width: number
  left?: number
  value: number | null
}

export interface GridItem {
  id: string
  col: number
  row: number
  left?: number
  width: number
  value: number | null | ComplexValue
}

export enum RowType {
  header,
  content
}

export default VirtualizedGrid
