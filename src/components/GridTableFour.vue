<template>
  <div class="h-svh w-full p-4 flex flex-col items-center justify-center h-full">
    <fieldset class="border rounded-md border-gray-200 p-4 mb-4 flex flex-col">
      <legend class="font-bold">Grid Stats</legend>
      <label>Rows: {{ rows }} </label>
      <label>Cells: {{ data?.length }} </label>
      <label>Stops: {{ stopLength }} </label>
    </fieldset>
    <form @submit.prevent="handleSetRows" class="border rounded-md border-gray-200 p-4 mb-4">
      <fieldset class="flex gap-x-2 justify-start items-center">
        <label>Rows</label>
        <input ref="refInputRows" type="number" :value="rows" class="rounded-md border-gray-200" />
        <button @click="handleSetRows" class="rounded-md border-blue-500 bg-blue-200 p-2">
          Set
        </button>
      </fieldset>
    </form>
    <div ref="tableRef" data-label="table" class="border rounded-md border-gray-200 p-2 w-full">
      <RecycleScroller
        :items="data"
        :item-size="cellHeight"
        :grid-items="cols"
        :item-secondary-size="cellWidth"
        class="overflow-auto h-[500px]"
        listClass="!overflow-x-auto"
        @visible="handleVirtualScrollIsVisible"
        @scrollend="handleVirtualScrollScrollEnd"
        v-slot="{ item }"
      >
        <div v-if="item?.col === 0" class="absolute bg-gray-200 h-1 w-[1000%] top-1/2" />
        <div
          data-label="cell"
          :data-index="item.id"
          :data-row="item?.row"
          :data-column="item?.col"
          :data-has-stops="item?.value !== null"
          :class="[
            'rounded-md border border-dashed border-dashed-orange-200 relative size-full box-border flex items-center',
            { 'ignore-elements': item?.value === null }
          ]"
          :style="{ height: cellHeight }"
        >
          <span class="absolute top-1 left-1 text-[0.5rem] rounded-full bg-gray-100">
            {{ item?.row }}/{{ item?.col }}
          </span>
          <div
            v-if="item?.value !== null"
            :id="item?.id"
            data-label="stop"
            class="absolute bg-amber-50 border-gray-200 hover:cursor-move h-[30px] w-[80px] border rounded-md font-bold flex justify-center items-center"
          >
            {{ item?.value }}
            <MirrorCell class="hidden" />
          </div>
        </div>
      </RecycleScroller>
    </div>
    <div ref="refLink" class="absolute hidden h-1" />
  </div>
</template>

<script setup lang="ts">
import {
  cleanStopsHighlighted,
  generateRandomCollection,
  getClosestLeftElement,
  getClosestRightElement,
  getSide,
  highlighStopInMyLeftSide,
  highlighStopInMyRightSide,
  highlighToTheEndOfMyLeftSide,
  highlighToTheEndOfMyRightSide,
  removeAllShadowStops,
  shadowAllStopsExcept
} from '@/utilsFour'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import {
  Draggable,
  type DragMoveEvent,
  type DragOverEvent,
  type MirrorCreatedEvent
} from '@shopify/draggable'
import MirrorCell from '@/components/MirrorCell.vue'
import { StopSide } from '@/index'

const rows = ref(93)
const cols = ref(23)
const cellHeight = ref(70)
const cellWidth = ref(150)
const data = computed(() => generateRandomCollection(rows.value, cols.value) ?? [])
const stopLength = computed(
  () => data.value?.reduce((acc, next) => (next.value > 0 ? (acc = acc + 1) : acc), 0) ?? 0
)
const tableRef = ref<HTMLDivElement | null>(null)
const refInputRows = ref<HTMLInputElement | null>(null)

const refLink = ref<HTMLDivElement | null>(null)
let draggableInstance: Draggable | null = null
let currentOverContainer: HTMLElement | null = null
let currentOverStop: HTMLElement | null = null
let currentSiblingStop: HTMLElement | null = null
let lastOverStop: HTMLElement | null = null
let lastStopSide: StopSide | null = null

onUnmounted(() => {
  if (draggableInstance) {
    draggableInstance.destroy()
  }
})

async function handleSetRows() {
  if (rows.value) {
    rows.value = parseInt(refInputRows.value?.value ?? '0')
    await nextTick()
    if (draggableInstance) {
      draggableInstance.destroy()
    }
    initDraggable()
  }
}

function initDraggable() {
  const cells = tableRef.value?.querySelectorAll('[data-label="cell"]')
  if (cells) {
    draggableInstance = createDraggable(cells)
    draggableInstance.on('mirror:created', handleDragMirrorCreated)
    draggableInstance.on('drag:start', hanldeDragStart)
    draggableInstance.on('drag:move', handleDragMove)
    draggableInstance.on('drag:over', handleDragOver)
    draggableInstance.on('drag:out', handleDragOut)
    draggableInstance.on('drag:stop', handleDragStop)
  } else {
    console.error('No table found. Draggable is disabled !')
  }
}

function createDraggable(root: NodeListOf<Element>) {
  return new Draggable(root, {
    draggable: '[data-label="stop"]',
    delay: 0,
    mirror: {
      constrainDimensions: true,
      cursorOffsetY: 60,
      appendTo: '[data-label="table"]'
    },
    classes: {
      mirror: ['z-40'],
      'source:dragging': ['!cursor-grabbing'],
      'container:placed': ['!cursor-grabbing'],
      'draggable:over': ['!cursor-grabbing']
    }
  })
}

function handleDragMirrorCreated(event: MirrorCreatedEvent) {
  event.mirror.style.display = 'none'
  event.mirror.style.border = '0'
  event.mirror.style.backgroundColor = 'transparent'
  event.mirror.style.color = 'transparent'
  const mirror = event.mirror.querySelector("[data-label='mirror']") as HTMLElement
  if (mirror) {
    mirror.style.display = 'block'
    mirror.style.position = 'absolute'
    mirror.style.top = '1px'
    mirror.style.left = '1px'
  } else {
    console.log('Draggable no found mirror cell. Mirror cell disabled')
  }
}

function hanldeDragStart() {
  document.body.classList.add('dragging')
}

function handleDragMove(ev: DragMoveEvent) {
  if (currentOverContainer) {
    const overRect = currentOverStop?.getBoundingClientRect() ?? null
    const currentSide = getSide(ev.sensorEvent.clientX, overRect)
    if (currentSide !== lastStopSide) {
      cleanStopsHighlighted(currentOverStop, currentSiblingStop, refLink.value)
      highlightStopSide(currentSide, currentOverContainer, overRect)
    }
    lastStopSide = currentSide
  }
}

function handleDragOver(ev: DragOverEvent) {
  currentOverStop = ev.over
  currentOverContainer = ev.overContainer
  lastOverStop = ev.over
  if (currentOverContainer && ev.over?.id !== lastOverStop?.id) {
    const overRect = currentOverStop?.getBoundingClientRect() ?? null
    cleanStopsHighlighted(currentOverStop, currentSiblingStop, refLink.value)
    const currentSide = getSide(ev.sensorEvent.clientX, overRect)
    lastStopSide = currentSide
    highlightStopSide(currentSide, currentOverContainer, overRect)
  }
}

function handleDragOut(/*ev: DragOutEvent*/) {
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
}

function handleDragStop(/*ev: DragStopEvent*/) {
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
}

function highlightStopSide(
  currentSide: StopSide,
  currentOverContainer: HTMLElement,
  overRect: DOMRect | null
) {
  // Am I over stop right side
  removeAllShadowStops()
  if (currentSide === StopSide.right) {
    lastStopSide = StopSide.right
    currentOverStop?.classList?.add('move-to-left')
    const closestContainer = getClosestRightElement(currentOverContainer)
    if (closestContainer?.dataset?.row === currentOverContainer.dataset?.row) {
      currentSiblingStop = highlighStopInMyRightSide(closestContainer, refLink, overRect)
      shadowAllStopsExcept([currentOverStop?.id, currentSiblingStop?.id])
    } else {
      const lastCell = tableRef.value?.querySelector(
        `[data-row='${currentOverContainer?.dataset?.row}'][data-column='${cols.value - 1}']`
      ) as HTMLElement
      highlighToTheEndOfMyRightSide(lastCell, refLink, overRect)
      shadowAllStopsExcept([currentOverStop?.id])
    }
    // Am I over stop left side
  } else {
    lastStopSide = StopSide.left
    currentOverStop?.classList?.add('move-to-right')
    const closestContainer = getClosestLeftElement(currentOverContainer)
    if (closestContainer?.dataset?.row === currentOverContainer?.dataset?.row) {
      currentSiblingStop = highlighStopInMyLeftSide(closestContainer, refLink, overRect)
      shadowAllStopsExcept([currentOverStop?.id, currentSiblingStop?.id])
    } else {
      const firstCell = tableRef.value?.querySelector(
        `[data-row='${currentOverContainer?.dataset?.row}'][data-column='0']`
      ) as HTMLElement
      highlighToTheEndOfMyLeftSide(firstCell, refLink, overRect)
      shadowAllStopsExcept([currentOverStop?.id])
    }
  }
}

function handleVirtualScrollIsVisible() {
  if (draggableInstance) {
    draggableInstance.destroy()
  }
  initDraggable()
}

function handleVirtualScrollScrollEnd() {
  if (draggableInstance) {
    draggableInstance.destroy()
  }
  initDraggable()
}
</script>

<style scoped>
.dragging {
  cursor: grabbing !important;
}
.move-to-right {
  background: lightblue;
  transition:
    background 0.5s ease,
    transform 0.8s ease;
}

.move-to-left {
  background: lightblue;
  transition:
    background 0.5s ease,
    transform 0.8s ease;
}
.shadow {
  background-color: gray;
  transition: background 0.8s ease;
}
.show-link {
  display: block;
  transition:
    background 0.5s ease,
    transform 0.5s ease;
  background: lightblue;
}
</style>
