<template>
  <div class="h-svh w-full grid-rows-[min-content_1fr]">
    <select name="select" v-model="gridSelected" @change="handleSelect">
      <option value="GridTableOne">Grid Table Sample One</option>
      <!-- Solo draggable con sortablejs -->
      <option value="GridTableTwo">Grid Table Sample Two</option>
      <!-- El mas estable con animacion de backgrund -->
      <option value="GridTableThree">Grid Table Sample Three</option>
      <!-- ENSEÑABLE: El Mejor hasta ahora: Ejemplo de virtual scroller -->
      <option value="GridTableFour">Grid Table Sample Four</option>
      <option value="GridTableFive">Grid Table Sample Five</option>
      <option value="GridTableSix">Grid Table Sample Six</option>
      <option value="GridTableSeven">Grid Table Sample Seven</option>
      <option value="GridTableNine">Grid Table Sample NINE !!</option>
    </select>
    <component :is="grids[gridSelected]" />
  </div>
</template>

<script setup lang="ts">
import GridTableOne from '@/components/GridTableOne.vue'
import GridTableTwo from '@/components/GridTableTwo.vue'
import GridTableThree from '@/components/GridTableThree.vue'
import GridTableFour from './components/GridTableFour.vue'
import GridTableFive from '@/components/GridTableFive.vue'
import GridTableSix from './components/GridTableSix.vue'
import GridTableSeven from './components/GridTableSeven.vue'
import GridTableNine from './components/GridTableNine'
import { ref } from 'vue'

const gridSelected = ref('GridTableNine')
const grids = {
  GridTableOne,
  GridTableTwo,
  GridTableThree,
  GridTableFour,
  GridTableFive,
  GridTableSix,
  GridTableSeven,
  GridTableNine
}

function handleSelect(e: Event): void {
  const target = e.target as HTMLSelectElement
  gridSelected.value = target.value
  console.log(gridSelected.value)
}
</script>
