<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { pickPolishVoice } from '../../quiz/speech'

const props = defineProps<{ text: string }>()

const voice = ref<SpeechSynthesisVoice | null>(null)

function refresh() {
  voice.value = pickPolishVoice(window.speechSynthesis.getVoices())
}

onMounted(() => {
  if (!('speechSynthesis' in window)) return
  refresh()
  window.speechSynthesis.addEventListener('voiceschanged', refresh)
})

onBeforeUnmount(() => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.removeEventListener('voiceschanged', refresh)
  }
})

function speak() {
  if (!voice.value) return
  const u = new SpeechSynthesisUtterance(props.text)
  u.lang = 'pl-PL'
  u.voice = voice.value
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}
</script>

<template>
  <button v-if="voice" type="button" class="qz-speak" aria-label="Произнести" title="Произнести" @click="speak">🔊</button>
</template>
