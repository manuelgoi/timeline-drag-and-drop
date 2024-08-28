import VirtualizedGrid from './MainComponent.vue'

export interface GridItem {
  id: string
  col: number
  row: number
  left: number
  width: number
  value: number
}

export enum RowType {
  header,
  content
}

export default VirtualizedGrid
