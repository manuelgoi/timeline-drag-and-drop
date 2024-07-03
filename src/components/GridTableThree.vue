<template>
  <div class="h-svh w-full p-4 flex flex-col items-center justify-center h-full">
    <fieldset class="border rounded-md border-gray-200 p-4 mb-4 flex flex-col">
      <legend class="font-bold">Grid Three Stats</legend>
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
          :id="`${row}${cell}`"
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
  highlighStopInMyLeftSide,
  highlighStopInMyRightSide,
  removeAllShadowStops,
  rndNum,
  shadowAllStopsExcept
} from '@/utils'
import GridCell from '@/components/GridCell.vue'
import { ElementSide } from '@/index'

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
let lastStopSide: ElementSide | null = null

function handleSetRows() {
  if (rows.value) {
    rows.value = parseInt(refInputRows.value?.value ?? '0')
    iteratorObject.value = generateRandomObject(rows.value)
  }
}

function highlightStopSide(
  currentSide: ElementSide,
  currentOverContainer: HTMLElement,
  overRect: DOMRect | null
) {
  // Am I over stop right side
  removeAllShadowStops()
  if (currentSide === ElementSide.right) {
    lastStopSide = ElementSide.right
    currentOverStop?.classList?.add('move-to-left')
    const closestContainer = getClosestRightElement(currentOverContainer)
    if (closestContainer?.dataset?.row === currentOverContainer.dataset?.row) {
      currentSiblingStop = highlighStopInMyRightSide(closestContainer, refLink, overRect)
      shadowAllStopsExcept([currentOverStop?.id, currentSiblingStop?.id])
    }
    // Am I over stop left side
  } else {
    lastStopSide = ElementSide.left
    currentOverStop?.classList?.add('move-to-right')
    const closestContainer = getClosestLeftElement(currentOverContainer)
    if (closestContainer?.dataset?.row === currentOverContainer?.dataset?.row) {
      currentSiblingStop = highlighStopInMyLeftSide(closestContainer, refLink, overRect)
      shadowAllStopsExcept([currentOverStop?.id, currentSiblingStop?.id])
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
            console.log('drag:move recalculating', currentSide, lastStopSide)
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
        if (currentOverContainer && ev.over?.id !== lastOverStop?.id) {
          console.log('drag:over recalculating', ev.over?.id, lastOverStop?.id)
          const overRect = currentOverStop?.getBoundingClientRect() ?? null
          cleanStopsHighlighted(currentOverStop, currentSiblingStop, refLink.value)
          const currentSide = getSide(ev.sensorEvent.clientX, overRect)
          lastStopSide = currentSide
          highlightStopSide(currentSide, currentOverContainer, overRect)
        }
      })

      draggableInstance.on('drag:out', (ev) => {
        console.log('drag:out')
        if (currentOverStop) {
          currentOverStop?.classList?.remove('move-to-left', 'move-to-right')
          lastOverStop = currentOverStop
          currentOverContainer = null
          currentOverStop = null
        }
        if (currentSiblingStop) {
          currentSiblingStop.classList.remove('move-to-left', 'move-to-right')
          currentSiblingStop = null
        }
        refLink.value?.classList.remove('show-link')
        lastStopSide = null
        removeAllShadowStops()
      })

      draggableInstance.on('drag:stop', (ev) => {
        console.log('drag:stop')
        if (currentOverStop) {
          currentOverStop.classList.remove('move-to-left', 'move-to-right')
          currentOverContainer = null
          currentOverStop = null
        }
        if (currentSiblingStop) {
          currentSiblingStop.classList.remove('move-to-left', 'move-to-right')
          currentSiblingStop = null
        }
        refLink.value?.classList.remove('show-link')
        lastStopSide = null
        removeAllShadowStops()
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
.dragging {
  cursor: grabbing !important;
}
.show-link {
  display: block;
  //z-index: 50;
  transition:
    background 0.5s ease,
    transform 0.5s ease;
  background: lightblue;
}
</style>
