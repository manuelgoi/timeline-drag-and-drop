<template>
  <div class="h-svh w-full p-4 flex flex-col items-center justify-center h-full">
    <div
      ref="refGrid"
      data-label="grid-table"
      class="border rounded-md border-gray-200 w-full h-[500px] grid grid-cols-10 grid-rows-8"
    >
      <template v-for="(vals, row) in randomObject" :key="row">
        <div
          v-for="cell in 10"
          data-label="cell"
          :key="`${row}-${cell}`"
          :data-row="row"
          :data-column="cell"
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
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sortable from 'sortablejs'
import { onMounted, ref } from 'vue'

const refGrid = ref<HTMLDivElement | null>(null)

function generateRandomObject(maxKeys: number): Record<number, number[]> {
  const result = {}

  for (let i = 1; i <= maxKeys; i++) {
    const key = i
    const arrayLength = Math.floor(Math.random() * 10) + 1 // Longitud aleatoria entre 1 y 10
    const uniqueValues = generateUniqueValues(arrayLength, 1, 10)
    result[key] = uniqueValues
  }

  return result
}

function generateUniqueValues(length: number, min: number, max: number): number[] {
  const values = new Set<number>()

  while (values.size < length) {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min
    values.add(randomNumber)
  }

  return Array.from(values)
}
function generateSequentialObject(end: number): Record<number, number[]> {
  const result: Record<number, number[]> = {}
  const array = Array.from({ length: 10 }, (_, i) => i + 1)

  for (let i = 1; i <= end; i++) {
    result[i] = array
  }

  return result
}
// Ejemplo de uso:
const maxKeys = 3 // Puedes cambiar este valor para probar con diferentes números de claves
const randomObject = generateRandomObject(maxKeys)
const sequentialObject = generateSequentialObject(maxKeys)

function onDragEnd(event) {
  // Lógica que se ejecuta al finalizar el arrastre
  console.log('onDragEnd')
  if (lastElement) {
    lastElement.style.background = ''
    lastElement.style.backgroundColor = ''
  }
  if (lastClosestChild) {
    lastClosestChild.style.backgroundColor = '' // o el estilo que quieras aplicar al elemento adyacente
  }
}

let lastElement = null
let lastClosestChild = null
onMounted(() => {
  if (refGrid.value) {
    Sortable.create(refGrid.value, {
      // animation: 150,
      // ghostClass: 'sortable-ghost',
      // draggable: '[data-label="stop"]',
      // handle: '[data-label="stop"]',
      swapThreshold: 0.1,
      filter: '.ignore-elements',
      onEnd: onDragEnd,
      onMove: (evt, oEvt) => {
        const log = []
        console.log('onMove', Date.now().toString().slice(-5))
        const currentChild = evt.related.querySelector('[data-label="stop"]')
        if (lastElement) {
          lastElement.style.backgroundColor = ''
          lastElement.style.background = ''
        }
        if (currentChild) {
          const eventX = evt.originalEvent.clientX
          const rect = evt.related.getBoundingClientRect()
          log.push(currentChild.innerHTML)
          let position = ''
          if (eventX > rect.left + rect.width / 2) {
            currentChild.style.background = 'linear-gradient(to right, transparent 50%, green 50%)' // Estilo para la parte izquierda
            position = 'right'
          } else {
            currentChild.style.background = 'linear-gradient(to right, red 50%, transparent 50%)' // Estilo para la parte derecha
            position = 'left'
          }
          log.push(position)

          // Elemento mas cercano
          let closestElement = null
          if (position === 'right') {
            closestElement = evt.related.nextElementSibling
            while (closestElement && closestElement === evt.dragged) {
              closestElement = closestElement.nextElementSibling
            }
          } else if (position === 'left') {
            closestElement = evt.related.previousElementSibling
            while (closestElement && closestElement === evt.dragged) {
              closestElement = closestElement.previousElementSibling
            }
          }
          if (lastClosestChild) {
            lastClosestChild.style.backgroundColor = '' // o el estilo que quieras aplicar al elemento adyacente
          }
          if (closestElement) {
            const closestChild = closestElement.querySelector('[data-label="stop"]')
            if (closestChild) {
              log.push(closestChild.innerHTML)
              closestChild.style.backgroundColor = 'red' // o el estilo que quieras aplicar al elemento adyacente
              lastClosestChild = closestChild
              console.log(log)
            }
          }
          lastElement = currentChild
        }
      }
    })
  }
})
</script>

<style scoped>
.sortable-ghost {
  opacity: 0.5;
  background-color: #ddd;
}
</style>
