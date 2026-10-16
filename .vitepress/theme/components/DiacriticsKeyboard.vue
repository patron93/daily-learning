<script setup lang="ts">
const emit = defineEmits<{ insert: [ch: string] }>()
const letters = ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż']
</script>

<template>
  <div class="qz-keyboard">
    <button
      v-for="ch in letters"
      :key="ch"
      type="button"
      class="qz-key"
      @pointerdown.prevent
      @mousedown.prevent
      @click="emit('insert', ch)"
    >
      {{ ch }}
    </button>
  </div>
</template>
