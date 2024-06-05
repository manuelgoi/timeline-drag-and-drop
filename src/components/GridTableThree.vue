<template>
  <div class="h-svh w-full p-4 flex flex-col items-center justify-center h-full">
    <fieldset class="border rounded-md border-gray-200 p-4 mb-4 flex flex-col">
      <legend class="font-bold">Grid Stats</legend>
      <label>Rows: {{ refInputRows?.value }} </label>
      <label>Cells: {{ totalCells }} </label>
      <label>Stops: {{ totalStops }} </label>
    </fieldset>
    <form @submit.prevent="handleSetRows" class="border rounded-md border-gray-200 p-4 mb-4">
      <fieldset class="flex gap-x-2 justify-start items-center">
        <label>Rows</label>
        <input ref="refInputRows" type="number" :value="92" class="rounded-md border-gray-200" />
        <button @click="handleSetRows" class="rounded-md border-blue-500 bg-blue-200 p-2">
          Set
        </button>
      </fieldset>
    </form>
    <div
      ref="refGrid"
      data-label="grid-table"
      class="border rounded-md border-gray-200 w-full h-[500px] grid grid-cols-10 overflow-auto"
      :style="{ 'grid-template-rows': `repeat(${rows}, 3.2rem)` }"
    >
      <template v-for="(vals, row) in iteratorObject" :key="row">
        <GridCell v-if="row == 1" data-test="true" :cells="[1]" :row="row" :cell="1" :width="30">
          <div class="absolute bg-gray-300 h-1 w-[1000%] top-1/2" />
        </GridCell>
        <GridCell
          v-if="row == 1"
          data-test="true"
          :cells="[1]"
          :row="row"
          :cell="1"
          :width="50"
          :left="35"
        />
        <GridCell
          v-if="row > 1"
          v-for="cell in 10"
          :key="`${row}-${cell}`"
          :cells="vals"
          :row="row"
          :cell="cell"
        >
          <div v-if="cell === 1" class="absolute bg-gray-300 h-1 w-[1000%] top-1/2" />
        </GridCell>
      </template>
    </div>
    <div ref="refLink" class="absolute hidden h-1" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Draggable, type MirrorCreatedEvent } from '@shopify/draggable'
import {
  cleanStopsHighlighted,
  generateRandomObject,
  getClosestLeftElement,
  getClosestRightElement,
  getSide,
  highlighTwoStopsToLeft,
  highlighTwoStopsToRight
} from '@/utils'
import GridCell from '@/components/GridCell.vue'
import { StopSide } from '@/index'
import { colorFillStopOverAndSiblinlag } from '@/utils'

const refInputRows = ref<HTMLInputElement | null>(null)
const refGrid = ref<HTMLDivElement | null>(null)
const refLink = ref<HTMLDivElement | null>(null)
const rows = ref(90)
const totalCells = ref(0)
const totalStops = ref(0)
const iteratorObject = ref(generateRandomObject(rows.value))

let draggableInstance: Draggable | null = null
let currentOverContainer: HTMLElement | null = null
let currentOverStop: HTMLElement | null = null
let currentSiblingStop: HTMLElement | null = null
let lastOverStop: HTMLElement | null = null
let lastStopSide: StopSide | null = null

function handleSetRows() {
  if (rows.value) {
    rows.value = parseInt(refInputRows.value?.value ?? '0')
    iteratorObject.value = generateRandomObject(rows.value)
  }
}

function highlightStopSide(
  currentSide: StopSide,
  currentOverContainer: HTMLElement,
  overRect: DOMRect | null
) {
  if (currentSide === StopSide.right) {
    lastStopSide = StopSide.right
    currentOverStop?.classList?.add('highlight-right')
    const closestContainer = getClosestRightElement(currentOverContainer)
    if (closestContainer?.dataset?.row === currentOverContainer.dataset?.row) {
      currentSiblingStop = highlighTwoStopsToRight(closestContainer, refLink, overRect)
    }
  } else {
    lastStopSide = StopSide.left
    currentOverStop?.classList?.add('highlight-left')
    const closestContainer = getClosestLeftElement(currentOverContainer)
    if (closestContainer?.dataset?.row === currentOverContainer?.dataset?.row) {
      currentSiblingStop = highlighTwoStopsToLeft(closestContainer, refLink, overRect)
    }
  }
}

onMounted(() => {
  if (refGrid.value) {
    const cells = refGrid.value.querySelectorAll('[data-label="cell"]')
    const stops = refGrid.value.querySelectorAll('[data-label="stop"]')
    totalCells.value = cells?.length ?? 0
    totalStops.value = stops?.length ?? 0
    if (totalCells.value > 0) {
      draggableInstance = new Draggable(cells, {
        draggable: '[data-label="stop"]',
        delay: 0,
        classes: {
          mirror: ['z-40'],
          'source:dragging': ['!cursor-grabbing'],
          'container:placed': ['!cursor-grabbing'],
          'draggable:over': ['!cursor-grabbing']
        }
      })

      draggableInstance.on('mirror:created', (event: MirrorCreatedEvent) => {
        event.data.mirror.style.display = 'none'
        event.data.mirror.style.border = '0'
        event.data.mirror.style.backgroundColor = 'transparent'
        event.data.mirror.style.color = 'transparent'
        const mirror = event.data.mirror.querySelector("[data-label='mirror']")
        mirror.style.display = 'block'
        mirror.style.position = 'absolute'
        mirror.style.bottom = '25px'
        mirror.style.left = '15px'
      })

      draggableInstance.on('drag:start', (event) => {
        document.body.classList.add('dragging')
      })

      draggableInstance.on('drag:move', (ev) => {
        if (currentOverContainer) {
          const overRect = currentOverStop?.getBoundingClientRect() ?? null
          const currentSide = getSide(ev.sensorEvent.clientX, overRect)
          if (currentSide !== lastStopSide) {
            cleanStopsHighlighted(currentOverStop, currentSiblingStop, refLink.value)
            highlightStopSide(currentSide, currentOverContainer, overRect)
          }
          lastStopSide = currentSide
        }
      })

      draggableInstance.on('drag:over', (ev) => {
        currentOverStop = ev.over
        currentOverContainer = ev.overContainer
        lastOverStop = ev.over
        if (currentOverContainer) {
          const overRect = currentOverStop?.getBoundingClientRect() ?? null
          cleanStopsHighlighted(currentOverStop, currentSiblingStop, refLink.value)
          const currentSide = getSide(ev.sensorEvent.clientX, overRect)
          lastStopSide = currentSide
          highlightStopSide(currentSide, currentOverContainer, overRect)
        }
      })

      draggableInstance.on('drag:out', (ev) => {
        if (currentOverContainer /* currentOverStop */) {
          const overStop = ev.overContainer.querySelector('[data-label="stop"]')
          overStop.classList.remove('highlight-left', 'highlight-right')
          // currentOverStop.classList.remove('highlight-left', 'highlight-right')
          lastOverStop = currentOverStop
          currentOverContainer = null
          currentOverStop = null
        }
        if (currentSiblingStop) {
          currentSiblingStop.classList.remove('highlight-left', 'highlight-right')
          currentSiblingStop = null
        }
        refLink.value?.classList.remove('show-link')
        lastStopSide = null
      })

      draggableInstance.on('drag:stop', (ev) => {
        if (/*currentOverContainer*/ currentOverStop) {
          // const overStop = currentOverContainer.querySelector('[data-label="stop"]')
          // overStop.classList.remove('highlight-left', 'highlight-right')
          currentOverStop.classList.remove('highlight-left', 'highlight-right')
          currentOverContainer = null
          currentOverStop = null
        }
        if (currentSiblingStop) {
          currentSiblingStop.classList.remove('highlight-left', 'highlight-right')
          currentSiblingStop = null
        }
        refLink.value?.classList.remove('show-link')
        lastStopSide = null
      })
    }
  } else {
    console.log('else')
    console.error('No [data-label=cell] found')
  }
})

onUnmounted(() => {
  if (draggableInstance) {
    draggableInstance.destroy()
  }
})
</script>

<style scoped>
.highlight-left {
  background: linear-gradient(to right, lightblue 50%, transparent 50%);
}
.highlight-right {
  background: linear-gradient(to right, transparent 50%, lightblue 50%);
}
.dragging {
  cursor: grabbing !important;
}
.show-link {
  display: block;
  z-index: 50;
  transition:
    background 0.5s ease,
    transform 0.5s ease;
  background: lightblue;
}
</style>
