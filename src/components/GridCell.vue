<template>
  <div
    data-label="cell"
    :data-row="row"
    :data-column="cell"
    :data-has-stops="cells.includes(cell)"
    :class="['relative flex items-center', { 'ignore-elements': !cells.includes(cell) }]"
    :style="{
      'grid-column-start': cell,
      'grid-row-start': row
    }"
  >
    <div v-if="cell === 1" class="absolute bg-gray-300 h-1 w-[1000%] top-1/2" />
    <div
      v-if="cells.includes(cell)"
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
</template>
<script setup lang="ts">
defineProps<{
  row: number
  cell: number
  cells: number[]
}>()
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
