<template>
  <div class="h-svh w-full p-4 flex flex-col items-center justify-center">
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
        class="overflow-auto h-[500px] recycle-scroller-parent"
        listClass="recycle-scroller-vertical"
        @visible="handleVirtualScrollIsVisible"
        @scrollend="handleVirtualScrollScrollEnd"
        @scroll="handleVirtualScrollScrollStart"
        v-slot="{ item }"
      >
        <div
          v-if="item?.col === 0"
          data-label="horizontal-guide"
          class="absolute z-10 bg-gray-200 h-1 top-1/2"
          :style="{ width: scrollWidthTable + 'px' }"
        />
        <div
          data-label="cell"
          :id="item?.row + '-' + item?.col"
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
            class="absolute z-20 bg-amber-50 border-gray-200 hover:cursor-move h-[30px] w-[80px] border rounded-md font-bold flex justify-center items-center"
          >
            {{ item?.value }}
            <MirrorCell class="hidden" />
          </div>
        </div>
      </RecycleScroller>
      <div ref="refLink" class="absolute hidden h-1" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  child,
  cleanStopsHighlighted,
  generateRandomCollection,
  getClosestLeftElement,
  getClosestRightElement,
  getSide,
  hideLinkBetweenStops,
  highlighStopInMyLeftSide,
  highlighStopInMyRightSide,
  highlighToTheEndOfMyLeftSide,
  highlighToTheEndOfMyRightSide,
  highlisghtStops,
  isChildVisible,
  removeAllShadowStops,
  shadowAllStopsExcept
} from '@/utilsFive'
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import {
  Draggable,
  type DragMoveEvent,
  type DragOutContainerEvent,
  type DragOverContainerEvent,
  type DragOverEvent,
  type MirrorCreatedEvent,
  type SensorEvent
} from '@shopify/draggable'
import MirrorCell from '@/components/MirrorCell.vue'
import { ElementSide } from '@/index'

enum DragOverType {
  cell,
  stop
}

const rows = ref(93)
const cols = ref(23)
const cellHeight = ref(70)
const cellWidth = ref(150)
const MIRROR_OFFSET_X: Readonly<number> = 13

const data = computed(() => generateRandomCollection(rows.value, cols.value) ?? [])
const stopLength = computed(
  () => data.value?.reduce((acc, next) => (next.value > 0 ? (acc = acc + 1) : acc), 0) ?? 0
)
const tableRef = ref<HTMLDivElement | null>(null)
const scrollWidthTable = ref(0)
const refInputRows = ref<HTMLInputElement | null>(null)
const refLink = ref<HTMLDivElement | null>(null)

let draggableInstance: Draggable | null = null
let currentOverContainer: HTMLElement | null = null
let currentOverStop: HTMLElement | null = null
let currentSiblingStop: HTMLElement | null = null
let lastOverStop: HTMLElement | null = null
let lastStopSide: ElementSide | null = null
let draggableCells: HTMLElement[] | null = null
let currentOverType: DragOverType | null = null

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
  const cells = tableRef.value?.querySelectorAll('[data-label="cell"]') ?? null
  if (cells) {
    draggableCells = Array.from(cells) as HTMLElement[]
    draggableInstance = createDraggable(draggableCells)
    draggableInstance.on('mirror:created', handleDragMirrorCreated)
    draggableInstance.on('drag:start', hanldeDragStart)
    draggableInstance.on('drag:move', handleDragMove)
    draggableInstance.on('drag:over', handleDragOver)
    draggableInstance.on('drag:out', handleDragOut)
    draggableInstance.on('drag:stop', handleDragStop)
    draggableInstance.on('drag:over:container', handleDragOverContainer)
    draggableInstance.on('drag:out:container', handleDragOutContainer)
  } else {
    console.error('No table found. Draggable is disabled !')
  }
}

function createDraggable(root: HTMLElement[]) {
  const verticalScrollElement = document.querySelector('.recycle-scroller-parent') as HTMLElement
  return new Draggable(root, {
    draggable: '[data-label="stop"]',
    delay: 0,
    scrollable: {
      speed: 3,
      scrollableElements: [verticalScrollElement]
    },
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
  event.mirror.dataset.label = 'mirror'
  const mirror = event.mirror.querySelector("[data-label='mirror']") as HTMLElement
  if (mirror) {
    const sourceRect = event.source.getBoundingClientRect()
    const left = event.sensorEvent.clientX - sourceRect.left - MIRROR_OFFSET_X
    mirror.style.display = 'block'
    mirror.style.position = 'absolute'
    mirror.style.top = '1px'
    mirror.style.left = `${left}px`
  } else {
    console.log('Draggable no found mirror cell. Mirror cell disabled')
  }
}

function hanldeDragStart() {
  document.body.classList.add('dragging')
}

function handleDragMove(ev: DragMoveEvent) {
  if (currentOverType === DragOverType.stop) {
    processOverStopMovement(ev)
  } else if (currentOverType === DragOverType.cell) {
    processOverCellMovement(ev)
  }
}

function handleDragOver(ev: DragOverEvent) {
  currentOverType = DragOverType.stop
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

function handleDragOverContainer(ev: DragOverContainerEvent) {
  currentOverType = DragOverType.cell
  currentOverContainer = ev.overContainer
}

function handleDragOut(/*ev: DragOutEvent*/) {
  console.log('OUT stop')
  currentOverType = null
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
  hideLinkBetweenStops(refLink)
  lastStopSide = null
  removeAllShadowStops()
}

function handleDragOutContainer() {
  resetTable()
}

function handleDragStop() {
  resetTable()
}

function resetTable() {
  if (currentOverStop) {
    currentOverStop.classList.remove('move-to-left', 'move-to-right')
    currentOverContainer = null
    currentOverStop = null
  }
  if (currentSiblingStop) {
    currentSiblingStop.classList.remove('move-to-left', 'move-to-right')
    currentSiblingStop = null
  }
  hideLinkBetweenStops(refLink)
  lastStopSide = null
  removeAllShadowStops()
}

function processOverStopMovement(ev: DragMoveEvent) {
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

function processOverCellMovement(ev) {
  if (currentOverContainer) {
    let side: ElementSide | null = null
    if (currentOverContainer?.dataset?.hasStops === 'true') {
      const overContainerRect = currentOverContainer?.getBoundingClientRect()
      side = getSide(ev.sensorEvent.clientX, overContainerRect)
    }
    let rightSiblingContainer: HTMLElement | null = null
    let leftSiblingContainer: HTMLElement | null = null
    if (side === ElementSide.left) {
      rightSiblingContainer = currentOverContainer
      leftSiblingContainer = getClosestLeftElement(currentOverContainer)
    } else if (side === ElementSide.right) {
      leftSiblingContainer = currentOverContainer
      rightSiblingContainer = getClosestRightElement(currentOverContainer)
    } else {
      rightSiblingContainer = getClosestRightElement(currentOverContainer)
      leftSiblingContainer = getClosestLeftElement(currentOverContainer)
    }
    if (rightSiblingContainer && leftSiblingContainer) {
      const { leftStop, rightStop } = highlisghtStops(
        leftSiblingContainer,
        rightSiblingContainer,
        refLink
      )
      shadowAllStopsExcept([leftStop?.id, rightStop?.id])
      currentOverStop = leftStop
      currentSiblingStop = rightStop
    }
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
    const isClosestContainerVisible = isChildVisible(tableRef.value, closestContainer)
    if (
      isClosestContainerVisible &&
      closestContainer?.dataset?.row === currentOverContainer.dataset?.row
    ) {
      currentSiblingStop = highlighStopInMyRightSide(closestContainer, refLink, overRect)
      shadowAllStopsExcept([currentOverStop?.id, currentSiblingStop?.id])
    } else {
      console.log('no current sibling')
      highlighToTheEndOfMyRightSide(tableRef.value, refLink, overRect, 8)
      shadowAllStopsExcept([currentOverStop?.id])
    }
    // Am I over stop left side
  } else {
    lastStopSide = ElementSide.left
    currentOverStop?.classList?.add('move-to-right')
    const closestContainer = getClosestLeftElement(currentOverContainer)
    const isClosestContainerVisible = isChildVisible(tableRef.value, closestContainer)
    if (
      isClosestContainerVisible &&
      closestContainer?.dataset?.row === currentOverContainer?.dataset?.row
    ) {
      currentSiblingStop = highlighStopInMyLeftSide(closestContainer, refLink, overRect)
      shadowAllStopsExcept([currentOverStop?.id, currentSiblingStop?.id])
    } else {
      highlighToTheEndOfMyLeftSide(tableRef.value, refLink, overRect, 8)
      shadowAllStopsExcept([currentOverStop?.id])
    }
  }
}

function handleVirtualScrollIsVisible() {
  if (draggableInstance) {
    draggableInstance.destroy()
  }
  initDraggable()
  const recycleVertical = tableRef.value?.querySelector('.recycle-scroller-vertical') as HTMLElement
  if (recycleVertical) {
    scrollWidthTable.value = recycleVertical?.scrollWidth ?? 0
    recycleVertical.style.minWidth = `${scrollWidthTable.value}px`
  }
}

function handleVirtualScrollScrollStart() {
  const guides = tableRef.value?.querySelectorAll('[data-label="horizontal-guide"]')
  if (guides) {
    guides.forEach((el) => el.classList.add('hide-guide'))
  }
  hideLinkBetweenStops(refLink)
  removeAllShadowStops()
}

function handleVirtualScrollScrollEnd() {
  if (draggableInstance && draggableCells) {
    draggableInstance.removeContainer(...draggableCells)
    const cells = tableRef.value?.querySelectorAll('[data-label="cell"]') ?? null
    if (cells) {
      draggableCells = Array.from(cells) as HTMLElement[]
      draggableInstance.addContainer(...draggableCells)
    }
  }
  const guides = tableRef.value?.querySelectorAll('[data-label="horizontal-guide"]')
  if (guides) {
    setTimeout(() => {
      guides.forEach((el) => el.classList.remove('hide-guide'))
    }, 200)
  }
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

.hide-guide {
  opacity: 0;
  transition: opacity 0.5s ease;
}
</style>
