<template>
  <div class="h-svh w-full p-4 flex flex-col items-center justify-center">
    <fieldset class="border rounded-md border-gray-200 p-4 mb-4 flex flex-col">
      <legend class="font-bold">Grid Six Stats</legend>
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
    <div
      ref="tableRef"
      data-label="table"
      class="border rounded-md border-gray-200 p-2 h-[500px] w-full"
    >
      <VirtualizedGrid
        :items="data"
        @visible="handleVirtualScrollIsVisible"
        @scrollend="handleVirtualScrollScrollEnd"
        @scroll.passive="handleVirtualScrollScrollStart"
        class="recycle-scroller-parent"
      >
        <template #leftPanel="{ row, rowType }">
          <header v-if="rowType === RowType.header" class="bg-white">Cabecera del Panel</header>
          <header v-else class="bg-white h-full">{{ row?.[0]?.row }}</header>
        </template>
        <template #default="{ row, rowType, hour, colIndex }">
          <header v-if="rowType === RowType.header" class="bg-white z-30">
            {{ hour }}
          </header>
          <div
            v-if="row?.[colIndex]?.col === 0 && rowType === RowType.content"
            data-label="horizontal-guide"
            class="absolute z-10 bg-gray-200 h-1 top-1/2 pointer-events-none"
            :style="{ width: scrollWidthTable + 'px' }"
          />
          <div
            v-if="rowType === RowType.content"
            data-label="cell"
            :id="row?.[colIndex]?.row + '-' + row?.[colIndex]?.col"
            :data-row="row?.[colIndex]?.row"
            :data-column="row?.[colIndex]?.col"
            :data-has-stop="row?.[colIndex]?.value !== null"
            :data-has-stops="isArray(row?.[colIndex]?.value)"
            :class="[
              'rounded-md border border-dashed border-dashed-orange-200 relative size-full box-border flex items-center',
              { 'ignore-elements': row?.[colIndex]?.value === null }
            ]"
          >
            <span class="absolute top-1 left-1 text-[0.5rem] rounded-full bg-gray-100">
              {{ row?.[colIndex]?.row }}/{{ row?.[colIndex]?.col }}
            </span>
            <div
              v-if="row?.[colIndex]?.value !== null && !isArray(row?.[colIndex]?.value)"
              :id="row?.[colIndex]?.id"
              data-label="stop"
              class="absolute z-20 bg-amber-50 border-gray-200 hover:cursor-move h-[30px] border rounded-md font-bold flex justify-center items-center"
              :style="{ width: row?.[colIndex]?.width + 'px' }"
            >
              {{ row?.[colIndex]?.value }}
              <MirrorCell class="hidden" />
            </div>
            <template
              v-else-if="row?.[colIndex]?.value !== null && isArray(row?.[colIndex]?.value)"
            >
              <div
                v-for="subitem in row?.[colIndex]?.value"
                :key="subitem?.id"
                :id="subitem?.id"
                data-label="stop"
                class="absolute z-20 bg-amber-50 border-gray-200 hover:cursor-move h-[30px] border rounded-md font-bold flex justify-center items-center"
                :style="{ width: subitem?.width + 'px', left: subitem?.left + 'px' }"
              >
                {{ subitem?.value }}
                <MirrorCell class="hidden" />
              </div>
            </template>
          </div>
        </template>
      </VirtualizedGrid>
      <div ref="refLink" class="absolute hidden h-1" />
    </div>
  </div>
</template>

<script setup lang="ts">
/*
 * TODO
 *  - Varios stops en la misma celda
 *  - Varios stops solapados por tiempo
 *  - No se debe iluminar el lugar de partida del arrastre
 */
import isArray from 'lodash-es/isArray'
import sortBy from 'lodash-es/sortBy'
import {
  child,
  cleanStopsHighlighted,
  generateRandomCollection,
  getClosestLeftElement,
  getClosestRightElement,
  getSide,
  hideLinkBetweenStops,
  highlighToTheEndOfMyLeftSide,
  highlighToTheEndOfMyRightSide,
  highlisghtStops,
  isChildVisible,
  isMouseInsideContainer,
  removeAllSelectedStop,
  removeAllShadowStops,
  shadowAllStopsExcept
} from '@/utilsSeven'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import VirtualizedGrid, { type ComplexValue, type GridItem } from '@/components/VirtualizedGrid'
import { RowType } from '@/components/VirtualizedGrid'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import {
  Draggable,
  type DragMoveEvent,
  type DragOutContainerEvent,
  type DragOverContainerEvent,
  type DragOverEvent,
  type MirrorCreatedEvent
} from '@shopify/draggable'
import MirrorCell from '@/components/MirrorCell.vue'
import { ElementSide } from '@/index'

enum DragOverType {
  cell,
  stop
}

const rows = ref(69)
const cols = ref(25)
const maxStopsByCol = ref(4)
const cellHeight = ref(70)
const cellWidth = ref(130)
const MIRROR_OFFSET_X: Readonly<number> = 13

const data = computed<GridItem[][]>(
  () => generateRandomCollection(rows.value, cols.value, maxStopsByCol.value, cellWidth.value) ?? []
)
const stopLength = computed(
  () => data.value?.reduce((acc, next) => (next.value > 0 ? (acc = acc + 1) : acc), 0) ?? 0
)
const tableRef = ref<HTMLDivElement | null>(null)
const scrollWidthTable = ref(0)
const refInputRows = ref<HTMLInputElement | null>(null)
const refLink = ref<HTMLDivElement | null>(null)
const teleportTo = ref<string | null>('body')
const leftPanel = ref<number[]>([])

let draggableInstance: Draggable | null = null
let currentOverContainer: HTMLElement | null = null
let currentOverStop: HTMLElement | null = null
let currentSiblingStop: HTMLElement | null = null
let lastOverStop: HTMLElement | null = null
let lastStopSide: ElementSide | null = null
let draggableCells: HTMLElement[] | null = null
let currentContainerOverType: DragOverType | null = null
let currentStopOverType: DragOverType | null = null

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
  shadowAllStopsExcept([])
}

function handleDragMove(ev: DragMoveEvent) {
  if (currentStopOverType === DragOverType.stop) {
    processOverStopMovement(ev)
  } else if (currentContainerOverType === DragOverType.cell) {
    processOverCellMovement(ev)
  }
}

function handleDragOver(ev: DragOverEvent) {
  currentStopOverType = DragOverType.stop
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
  currentContainerOverType = DragOverType.cell
  currentOverContainer = ev.overContainer
}

function handleDragOut() {
  currentStopOverType = null
  if (currentOverStop) {
    lastOverStop = currentOverStop
    currentOverStop = null
  }
  if (currentSiblingStop) {
    currentSiblingStop = null
  }
  hideLinkBetweenStops(refLink)
  lastStopSide = null
}

function handleDragOutContainer(ev: DragOutContainerEvent) {
  currentContainerOverType = null
  // Comprobamos si continua en el mismo contenedor, porque la linea que une las paradas
  // genera un drag:out:container
  const continueInsideTheSameContainer = isMouseInsideContainer(
    ev.overContainer.getBoundingClientRect(),
    ev.sensorEvent?.clientX,
    ev.sensorEvent?.clientY
  )
  if (!continueInsideTheSameContainer) {
    resetTable()
  }
}

function handleDragStop() {
  resetTable()
  removeAllShadowStops()
  removeAllSelectedStop()
}

function resetTable() {
  if (currentOverStop) {
    currentOverContainer = null
    currentOverStop = null
  }
  if (currentSiblingStop) {
    currentSiblingStop = null
  }
  hideLinkBetweenStops(refLink)
  lastStopSide = null
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

function processOverCellMovement(ev: DragMoveEvent) {
  if (currentOverContainer) {
    let side: ElementSide | null = null
    if (currentOverContainer?.dataset?.hasStop === 'true') {
      const overContainerRect = currentOverContainer?.getBoundingClientRect()
      side = getSide(ev.sensorEvent.clientX, overContainerRect)
    }
    let rightSiblingContainer: HTMLElement | null = null
    let leftSiblingContainer: HTMLElement | null = null
    if (side === ElementSide.left) {
      // Estoy en una celda con stops en su lado izquierdo (left === current)
      rightSiblingContainer = currentOverContainer
      leftSiblingContainer = getClosestLeftElement(currentOverContainer)
    } else if (side === ElementSide.right) {
      // Estoy en una celda con stops en su lado derecho (right === current)
      leftSiblingContainer = currentOverContainer
      rightSiblingContainer = getClosestRightElement(currentOverContainer)
    } else {
      // Estoy en una celda sin stops
      rightSiblingContainer = getClosestRightElement(currentOverContainer)
      leftSiblingContainer = getClosestLeftElement(currentOverContainer)
    }
    // Esta entre dos Stops
    if (leftSiblingContainer && rightSiblingContainer) {
      const { leftStop, rightStop } = highlisghtStops(
        leftSiblingContainer,
        rightSiblingContainer,
        refLink,
        side
      )
      shadowAllStopsExcept([leftStop?.id, rightStop?.id])
      currentOverStop = leftStop
      currentSiblingStop = rightStop
    } else if (!leftSiblingContainer && rightSiblingContainer) {
      // Esta al principio del timeline y no tiene stop a su izquierda
      const rightStop = child(rightSiblingContainer, 'stop')
      const overRect = rightStop?.getBoundingClientRect() ?? ({} as DOMRect)
      rightStop?.classList?.add('lighting')
      highlighToTheEndOfMyLeftSide(tableRef.value, refLink, overRect, 8)
      shadowAllStopsExcept([rightStop?.id])
    } else if (leftSiblingContainer && !rightSiblingContainer) {
      // Esta el final del timeline y no tiene stop a su derecha
      const leftCellStops = leftSiblingContainer?.querySelectorAll('[data-label="stop"]') ?? null
      const leftStop = leftCellStops?.[leftCellStops?.length - 1]
      const overRect = leftStop?.getBoundingClientRect() ?? ({} as DOMRect)
      leftStop?.classList?.add('lighting')
      highlighToTheEndOfMyRightSide(tableRef.value, refLink, overRect, 8)
      shadowAllStopsExcept([leftStop?.id])
    }
  }
}

function highlightStopSide(
  currentSide: ElementSide,
  currentOverContainer: HTMLElement,
  overRect: DOMRect | null
) {
  hideLinkBetweenStops(refLink)
  // Am I over stop right side
  if (currentSide === ElementSide.right) {
    lastStopSide = ElementSide.right
    const rightSiblingStop = currentOverStop?.nextElementSibling as HTMLElement
    if (rightSiblingStop && rightSiblingStop?.dataset?.label === 'stop') {
      rightSiblingStop?.classList?.add('lighting')
      currentOverStop?.classList?.add('lighting')
      shadowAllStopsExcept([currentOverStop?.id, rightSiblingStop?.id])
    } else {
      const rightSiblingContainer = getClosestRightElement(currentOverContainer)
      const isRightSiblingContainerVisible = isChildVisible(tableRef.value, rightSiblingContainer)
      if (
        isRightSiblingContainerVisible &&
        rightSiblingContainer?.dataset?.row === currentOverContainer.dataset?.row
      ) {
        const { leftStop, rightStop } = highlisghtStops(
          currentOverContainer,
          rightSiblingContainer,
          refLink,
          ElementSide.right
        )
        shadowAllStopsExcept([leftStop?.id, rightStop?.id])
        currentOverStop = leftStop
        currentSiblingStop = rightStop
      } else {
        currentOverStop?.classList?.add('lighting')
        highlighToTheEndOfMyRightSide(tableRef.value, refLink, overRect, 8)
        shadowAllStopsExcept([currentOverStop?.id])
      }
    }
    // Am I over stop left side
  } else {
    lastStopSide = ElementSide.left
    const leftSiblingStop = currentOverStop?.previousElementSibling as HTMLElement
    if (leftSiblingStop && leftSiblingStop?.dataset?.label === 'stop') {
      leftSiblingStop?.classList?.add('lighting')
      currentOverStop?.classList?.add('lighting')
      shadowAllStopsExcept([leftSiblingStop?.id, currentOverStop?.id])
      console.log(leftSiblingStop?.innerText, currentOverStop?.innerText)
    } else {
      const leftSiblingContainer = getClosestLeftElement(currentOverContainer)
      const isLeftSiblingContainerVisible = isChildVisible(tableRef.value, leftSiblingContainer)
      if (
        isLeftSiblingContainerVisible &&
        leftSiblingContainer?.dataset?.row === currentOverContainer?.dataset?.row
      ) {
        const { leftStop, rightStop } = highlisghtStops(
          leftSiblingContainer,
          currentOverContainer,
          refLink,
          ElementSide.left
        )
        shadowAllStopsExcept([leftStop?.id, rightStop?.id])
        currentOverStop = rightStop
        currentSiblingStop = leftStop
      } else {
        currentOverStop?.classList?.add('lighting')
        highlighToTheEndOfMyLeftSide(tableRef.value, refLink, overRect, 8)
        shadowAllStopsExcept([currentOverStop?.id])
      }
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

.lighting {
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

.vue-recycle-scroller {
  display: grid;
  grid-template-columns: min-content 1fr;
  grid-template-rows: min-content 1fr;
}

:deep(.vue-recycle-scroller__slot:has(> header)) {
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 10;
  grid-column: 2 / span 2;
}

:deep(.vue-recycle-scroller__item-wrapper) {
  grid-column: 2 / span 2;
}
</style>
<style>
.vue-recycle-scroller__external {
  position: sticky;
  left: 0;
  z-index: 20;
  background: lightgray;
  grid-column-start: 1;
  grid-row: 1 / span 2;
  width: 200px;
}
</style>
