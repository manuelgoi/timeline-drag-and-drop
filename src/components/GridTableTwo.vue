<template>
  <div class="h-svh w-full p-4 flex flex-col items-center justify-center h-full">
    <div
      ref="refGrid"
      data-label="grid-table"
      class="border rounded-md border-gray-200 w-full h-[500px] grid grid-cols-10"
    >
      <div
        v-for="cell in 7"
        data-label="cell"
        :key="cell"
        :data-column="cell"
        :style="{ 'grid-column-start': cell, 'grid-row-start': 1 }"
        class="bg-amber-50 border-gray-400 hover:cursor-move h-[30px] w-[80px] border rounded-md font-bold flex justify-center items-center"
      >
        {{ cell }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sortable from 'sortablejs'
import { onMounted, ref } from 'vue'

const refGrid = ref<HTMLDivElement | null>(null)

function generateSequentialObject(end: number): Record<number, number[]> {
  const result: Record<number, number[]> = {}
  const array = Array.from({ length: 10 }, (_, i) => i + 1)

  for (let i = 1; i <= end; i++) {
    result[i] = array
  }

  return result
}
// Ejemplo de uso:
const maxKeys = 1 // Puedes cambiar este valor para probar con diferentes números de claves
const sequentialObject = generateSequentialObject(maxKeys)
let sortable: Sortable | null = null

function onDragEnd(event) {
  // Lógica que se ejecuta al finalizar el arrastre
  // console.log('Elemento movido de', event.from, 'a', event.to)
}

onMounted(() => {
  try {
    sortable = Sortable.create(refGrid.value as HTMLElement, {
      animation: 150,
      ghostClass: 'ghost',
      draggable: '[data-label="cell"]',
      handle: '[data-label="cell"]',
      direction: 'vertical',
      onEnd: onDragEnd,
      onMove: (evt, oEvt) => {
        console.log('related', evt.related)
      }
    })
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.sortable-ghost {
  opacity: 0.5;
  background-color: #ddd;
}
</style>
