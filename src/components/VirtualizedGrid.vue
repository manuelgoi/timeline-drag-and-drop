<template>
  <div ref="gridContainer" class="overflow-auto h-full w-full" @scroll="handleScroll">
    <div class="relative" :style="{ height: totalHeight + 'px', width: totalWidth + 'px' }">
      <!-- Render the visible rows -->
      <div
        v-for="(team, rowIndex) in visibleRows"
        :key="team.id"
        :style="{
          gridTemplateColumns: `minmax(${firstColumnWidth}px, auto) repeat(${visibleColumns.length}, ${columnWidth}px)`,
          top: (startRow + rowIndex) * rowHeight + 'px',
          height: rowHeight + 'px'
        }"
        class="absolute w-full grid"
      >
        <!-- First column (team information) -->
        <div class="bg-gray-200 border-r border-gray-300 p-2">
          <div class="font-bold">{{ team?.[0]?.row }}</div>
        </div>
        <!-- Render the visible columns (hours) -->
        <div
          v-for="(hour, colIndex) in visibleColumns"
          :key="hour"
          class="border-l border-gray-300 flex justify-center items-center bg-white"
          :style="{ width: columnWidth + 'px' }"
        >
          <div class="bg-green-400 text-white px-2 py-1 rounded">
            {{ getStop(team[colIndex], hour) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  items: []
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
const rowHeight = 80 // Height of each row in pixels
const firstColumnWidth = 40 // Width of the first column in pixels
const columnWidth = 100 // Width of each hour column in pixels

// State for virtual scrolling
const startRow = ref(0)
const visibleRowCount = ref(5) // Number of visible rows
const startColumn = ref(0)
const visibleColumnCount = ref(5) // Number of visible columns
const gridContainer = ref<HTMLDivElement | null>(null)

// Compute total dimensions of the grid
const totalHeight = computed(() => props.items.length * rowHeight)
const totalWidth = computed(() => firstColumnWidth + hours.value.length * columnWidth)

// Compute the visible rows and columns based on the current scroll position
const visibleRows = computed(() =>
  props.items.slice(startRow.value, startRow.value + visibleRowCount.value)
)
const visibleColumns = computed(() =>
  hours.value.slice(startColumn.value, startColumn.value + visibleColumnCount.value)
)

// Handle scrolling
function handleScroll(event) {
  const { scrollTop, scrollLeft, clientHeight, clientWidth } = event.target

  // Calculate which rows and columns are visible based on scroll position
  startRow.value = Math.floor(scrollTop / rowHeight)
  startColumn.value = Math.floor(scrollLeft / columnWidth)

  // Adjust the number of visible rows and columns based on the container size
  visibleRowCount.value = Math.ceil(clientHeight / rowHeight)
  visibleColumnCount.value = Math.ceil((clientWidth - firstColumnWidth) / columnWidth)
}

// Example function to simulate fetching stop data
function getStop(team, hour) {
  return `Stop ${team.col}-${team.row}`
}

// Handle menu click
function handleMenuClick(team) {
  alert(`Menu clicked for ${team.name}`)
}

// Setup lifecycle hook
onMounted(() => {
  const container = gridContainer.value
  // Initialize visible rows and columns based on container size
  visibleRowCount.value = Math.ceil(container.clientHeight / rowHeight)
  visibleColumnCount.value = Math.ceil((container.clientWidth - firstColumnWidth) / columnWidth)
})
</script>
