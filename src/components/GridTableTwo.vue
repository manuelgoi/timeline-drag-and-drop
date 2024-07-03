<template>
  <div class="h-svh w-full p-4 flex flex-col items-center justify-center h-full">
    <fieldset class="border rounded-md border-gray-200 p-4 mb-4 flex flex-col">
      <legend class="font-bold">Grid Two Stats</legend>
      <label>Rows: {{ rows }} </label>
      <label>Cells: {{ data?.length }} </label>
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
      ref="tableRef"
      data-label="table"
      class="border rounded-md border-gray-200 flex flex-wrap gap-2 p-2 w-full"
    >
      <template v-for="(row, rowIndex) in data" :key="rowIndex">
        <div
          v-for="(cell, cellIndex) in row"
          :key="cellIndex"
          :class="[
            'p-6 w-[150px] rounded-md border border-orange-200 flex items-center justify-center font-bold text-xl',
            { 'ignore-elements': !cell }
          ]"
        >
          {{ cell }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { generateRandomArray } from '@/utils'
import { computed, onMounted, ref } from 'vue'
import Sortable from 'sortablejs'

const rows = ref(5)
const cols = ref(10)
const data = computed(() => generateRandomArray(rows.value, cols.value))
const tableRef = ref<HTMLDivElement | null>(null)
const refInputRows = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (tableRef.value) {
    new Sortable(tableRef.value, {
      filter: '.ignore-elements',
      animation: 150,
      ghostClass: 'bg-blue-100'
    })
  } else {
    console.error('No table found. Draggable is disabled !')
  }
})

function handleSetRows() {
  if (rows.value) {
    rows.value = parseInt(refInputRows.value?.value ?? '0')
  }
}
</script>
