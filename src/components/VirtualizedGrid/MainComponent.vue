<template>
  <div ref="gridContainer" class="overflow-auto h-full w-full" @scroll.passive="handleScroll">
    <div
      class="relative recycle-scroller-vertical"
      :style="{ height: totalHeight + 'px', width: totalWidth + 'px' }"
    >
      <!-- Render the visible rows -->
      <div
        v-for="(row, rowIndex) in visibleRows"
        :key="rowIndex"
        :style="row === null ? rowHeaderStyles : getRowStyles(rowIndex)"
        class="w-full grid"
      >
        <!-- First column (panel information) -->
        <div :class="[row === null ? 'sticky z-40 left-0 top-0' : 'z-30 left-0 sticky']">
          <slot
            name="leftPanel"
            :row="row"
            :rowIndex="rowIndex"
            :rowType="row === null ? RowType.header : RowType.content"
          />
        </div>

        <!-- Render the visible columns (hours) -->
        <div
          v-for="(hour, colIndex) in hours"
          :key="hour"
          :class="[{ 'sticky top-0 z-30': row === null }]"
        >
          <slot
            name="default"
            :row="row"
            :rowIndex="rowIndex"
            :colIndex="colIndex"
            :hour="hour"
            :rowType="row === null ? RowType.header : RowType.content"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type StyleValue, watch, nextTick } from 'vue'
import type { GridItem } from './index'
import { RowType } from './index'
import { useElementVisibility } from '@vueuse/core'

const props = defineProps<{
  items: GridItem[][]
}>()

const emit = defineEmits<{
  visible: []
  scrollEnd: []
}>()

const hours = ref([
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00'
])

// Sizes and dimensions
const rowHeight: Readonly<number> = 80 // Height of each row in pixels
const firstColumnHeight: Readonly<number> = 40 // Width of the first column in pixels
const firstColumnWidth: Readonly<number> = 280 // Width of the first column in pixels
const columnWidth: Readonly<number> = 130 // Width of each hour column in pixels

// State for virtual scrolling
const startRow = ref(0)
const visibleRowCount = ref(5) // Number of visible rows
const gridContainer = ref<HTMLDivElement | null>(null)
const targetIsVisible = useElementVisibility(gridContainer)

// Compute total dimensions of the grid
const totalHeight = computed(() => props.items.length * rowHeight)
const totalWidth = computed(() => firstColumnWidth + hours.value.length * columnWidth)

// Compute the visible rows and columns based on the current scroll position
const visibleRows = computed(() => [
  null,
  ...props.items.slice(startRow.value, startRow.value + visibleRowCount.value)
])

watch(targetIsVisible, async () => {
  await nextTick()
  emit('visible')
})

const rowHeaderStyles = computed<StyleValue>(() => ({
  gridTemplateColumns: `${firstColumnWidth}px repeat(${hours.value.length}, ${columnWidth}px)`,
  height: firstColumnHeight + 'px',
  background: 'white',
  zIndex: 40,
  position: 'sticky',
  top: 0
}))

onMounted(() => {
  // Initialize visible rows and columns based on container size
  if (gridContainer.value) {
    visibleRowCount.value = Math.ceil(gridContainer.value.clientHeight / rowHeight)
  } else {
    throw 'gridContainer must be defined'
  }
})

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  const { scrollTop, clientHeight } = target

  // Calculate which rows and columns are visible based on scroll position
  startRow.value = Math.floor(scrollTop / rowHeight)

  // Adjust the number of visible rows and columns based on the container size
  visibleRowCount.value = Math.ceil(clientHeight / rowHeight)
  checkIfScrolledToEnd(event)
}

function checkIfScrolledToEnd(event: Event) {
  const target = event.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target
  if (scrollTop + clientHeight >= scrollHeight) {
    emit('scrollEnd')
  }
}

function getRowStyles(rowIndex: number): StyleValue {
  return {
    gridTemplateColumns: `${firstColumnWidth}px repeat(${hours.value.length}, ${columnWidth}px)`,
    top: (startRow.value + rowIndex) * rowHeight - firstColumnHeight + 'px',
    height: rowHeight + 'px',
    position: 'absolute',
    background: 'transparent'
  }
}
</script>
