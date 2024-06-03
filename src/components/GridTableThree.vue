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
        <GridCell
          v-for="cell in 10"
          :key="`${row}-${cell}`"
          :cells="vals"
          :row="row"
          :cell="cell"
        />
        <!--
        <div
          v-for="cell in 10"
          data-label="cell"
          :key="`${row}-${cell}`"
          :data-row="row"
          :data-column="cell"
          :data-has-stops="vals.includes(cell)"
          :class="['relative flex items-center', { 'ignore-elements': !vals.includes(cell) }]"
          :style="{
            'grid-column-start': cell,
            'grid-row-start': row
          }"
        >
          <div v-if="cell === 1" class="absolute bg-gray-300 h-1 w-[1000%] top-1/2" />
          <div
            v-if="vals.includes(cell)"
            data-label="stop"
            class="absolute bg-amber-50 border-gray-400 hover:cursor-move h-[30px] w-[80px] border rounded-md font-bold flex justify-center items-center"
          >
            {{ row }}-{{ cell }}

            <svg
              data-label="mirror"
              class="hidden"
              width="50"
              height="75"
              viewBox="0 0 100 150"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M50 0 C77.61 0 100 22.39 100 50 C100 83.97 50 150 50 150 C50 150 0 83.97 0 50 C0 22.39 22.39 0 50 0 Z"
                fill="#007BFF"
              />
            </svg>
          </div>
        </div>
        -->
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Draggable } from '@shopify/draggable'
import { generateSequentialObject, generateRandomObject } from '@/utils'
import GridCell from '@/components/GridCell.vue'

const refInputRows = ref<HTMLInputElement | null>(null)
const refGrid = ref<HTMLDivElement | null>(null)
const rows = ref(90)
const totalCells = ref(0)
const totalStops = ref(0)
// const iteratorObject = generateSequentialObject(rows.value)
const iteratorObject = ref(generateRandomObject(rows.value))

let draggableInstance: Draggable | null = null
let lastOverContainer = null
let lastSiblingStop = null

function handleSetRows() {
  rows.value = refInputRows.value?.value
  iteratorObject.value = generateRandomObject(rows.value)
}

function createLink(starRect, endRect) {
  const nodo = document.getElementById('line')
  nodo?.remove()
  const startX = starRect.right
  const endX = endRect.left
  const y = starRect.top + starRect.height / 2 - 1
  const line = document.createElement('div')
  line.id = 'line'
  line.style.top = `${y}px`
  line.style.left = `${startX}px`
  line.style.width = `${endX - startX}px`
  line.style.position = 'absolute'
  line.style.height = '4px'
  line.style.backgroundColor = 'lightblue'
  line.style.backgroundColor = 'lightblue'

  // Add the line to the body
  document.body.appendChild(line)
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

      draggableInstance.on('mirror:created', (event) => {
        // event.data.mirror.style.display = 'none'
        event.data.mirror.style.border = '0'
        event.data.mirror.style.backgroundColor = 'transparent'
        event.data.mirror.style.color = 'transparent'
        const mirror = event.data.mirror.querySelector("[data-label='mirror']")
        mirror.style.zIndex = '40'
        mirror.style.display = 'block'
        mirror.style.position = 'absolute'
        mirror.style.bottom = '25px'
        mirror.style.left = '15px'
      })

      draggableInstance.on('drag:start', (event) => {
        document.body.classList.add('dragging')
      })

      draggableInstance.on('drag:move', (ev) => {
        if (lastOverContainer) {
          const overStop = lastOverContainer.querySelector('[data-label="stop"]')
          const overRect = overStop.getBoundingClientRect()
          const eventX = ev.sensorEvent.clientX

          overStop.classList.remove('highlight-left', 'highlight-right')
          if (lastSiblingStop) {
            lastSiblingStop.classList.remove('highlight-left', 'highlight-right')
          }

          if (eventX > overRect.left + overRect.width / 2) {
            // RIGHT SIDE
            overStop.classList.add('highlight-right')
            let closestElement = lastOverContainer.nextElementSibling
            while (
              closestElement.dataset?.hasStops === 'false' &&
              closestElement.dataset?.row === lastOverContainer.dataset?.row
            ) {
              closestElement = closestElement.nextElementSibling
            }
            if (closestElement.dataset?.row !== lastOverContainer.dataset?.row) {
              // No hay elementos con columnas a la derecha
              console.log('No previus Sibling elements at right side')
            } else {
              // console.log(lastOverContainer.dataset?.column, closestElement.dataset?.column)
              lastSiblingStop = closestElement.querySelector('[data-label="stop"]')
              lastSiblingStop.classList.add('highlight-left')
              const nodo = document.getElementById('line')
              nodo?.remove()
              const siblingRect = lastSiblingStop.getBoundingClientRect()
              createLink(overRect, siblingRect)
            }
          } else {
            // LEFT SIDE
            overStop.classList.add('highlight-left')
            let closestElement = lastOverContainer?.previousElementSibling
            while (
              closestElement?.dataset?.hasStops === 'false' &&
              closestElement?.dataset?.row === lastOverContainer?.dataset?.row
            ) {
              closestElement = closestElement?.previousElementSibling
            }
            if (closestElement?.dataset?.row !== lastOverContainer?.dataset?.row) {
              // No hay elementos con columnas a la izquierda
              console.log('No previus Sibling elements at left side')
            } else {
              // console.log(lastOverContainer?.dataset?.column, closestElement?.dataset?.column)
              lastSiblingStop = closestElement.querySelector('[data-label="stop"]')
              lastSiblingStop.classList.add('highlight-right')
              const nodo = document.getElementById('line')
              nodo?.remove()
              const siblingRect = lastSiblingStop.getBoundingClientRect()
              createLink(siblingRect, overRect)
            }
          }
        }
      })
      draggableInstance.on('drag:over', (ev) => {
        lastOverContainer = ev.overContainer
      })

      draggableInstance.on('drag:out', (ev) => {
        if (lastOverContainer) {
          const overStop = ev.overContainer.querySelector('[data-label="stop"]')
          overStop.classList.remove('highlight-left', 'highlight-right')
          lastOverContainer = null
        }
        if (lastSiblingStop) {
          lastSiblingStop.classList.remove('highlight-left', 'highlight-right')
          lastSiblingStop = null
        }
        const nodo = document.getElementById('line')
        nodo?.remove()
      })

      draggableInstance.on('drag:stop', (ev) => {
        if (lastOverContainer) {
          const overStop = lastOverContainer.querySelector('[data-label="stop"]')
          overStop.classList.remove('highlight-left', 'highlight-right')
          lastOverContainer = null
        }
        if (lastSiblingStop) {
          lastSiblingStop.classList.remove('highlight-left', 'highlight-right')
          lastSiblingStop = null
        }
        const nodo = document.getElementById('line')
        nodo?.remove()
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
</style>
