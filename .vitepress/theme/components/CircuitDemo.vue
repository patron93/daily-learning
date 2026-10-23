<script setup lang="ts">
import { ref, computed } from 'vue'

const on = ref(true)
const onNeutral = ref(false)

// Лампа горит, только если цепь замкнута
const lit = computed(() => on.value)
// Фаза у патрона есть, если выключатель на нуле или он включён
const phaseAtLamp = computed(() => on.value || onNeutral.value)
</script>

<template>
  <div class="circuit-demo">
    <div class="controls">
      <button @click="on = !on">Выключатель: {{ on ? 'включён' : 'выключен' }}</button>
      <button @click="onNeutral = !onNeutral">Стоит на: {{ onNeutral ? 'нуле ✘' : 'фазе ✔' }}</button>
    </div>
    <svg viewBox="0 0 420 200" role="img" aria-label="Интерактивная цепь">
      <rect width="420" height="200" rx="12" fill="#f6f8fa" />
      <text x="20" y="62" font-size="13" font-weight="700" fill="#cf222e">L фаза</text>
      <text x="20" y="152" font-size="13" font-weight="700" fill="#0969da">N ноль</text>
      <!-- верхний провод (фаза) -->
      <line x1="80" y1="58" x2="140" y2="58" :stroke="onNeutral || on ? '#cf222e' : '#cf222e'" stroke-width="5" />
      <g v-if="!onNeutral">
        <circle cx="145" cy="58" r="4" fill="#24292f" />
        <line x1="145" y1="58" :x2="on ? 195 : 185" :y2="on ? 58 : 36" stroke="#24292f" stroke-width="4" />
        <circle cx="200" cy="58" r="4" fill="#24292f" />
      </g>
      <line x1="140" y1="58" x2="320" y2="58" v-if="onNeutral" stroke="#cf222e" stroke-width="5" />
      <line x1="200" y1="58" x2="320" y2="58" v-else :stroke="on ? '#cf222e' : '#8c959f'" stroke-width="5" />
      <line x1="320" y1="58" x2="320" y2="80" :stroke="phaseAtLamp ? '#cf222e' : '#8c959f'" stroke-width="5" />
      <!-- лампа -->
      <circle cx="320" cy="100" r="22" :fill="lit ? '#ffe066' : '#f6f8fa'" :stroke="phaseAtLamp && !lit ? '#cf222e' : '#57606a'" stroke-width="3" />
      <path d="M309 108 L315 92 L320 108 L325 92 L331 108" fill="none" stroke="#57606a" stroke-width="2.5" />
      <!-- нижний провод (ноль) -->
      <line x1="320" y1="122" x2="320" y2="148" stroke="#0969da" stroke-width="5" />
      <g v-if="onNeutral">
        <line x1="320" y1="148" x2="215" y2="148" stroke="#0969da" stroke-width="5" />
        <circle cx="210" cy="148" r="4" fill="#24292f" />
        <line x1="210" y1="148" :x2="on ? 160 : 170" :y2="on ? 148 : 126" stroke="#24292f" stroke-width="4" />
        <circle cx="155" cy="148" r="4" fill="#24292f" />
        <line x1="155" y1="148" x2="80" y2="148" stroke="#0969da" stroke-width="5" />
      </g>
      <line v-else x1="320" y1="148" x2="80" y2="148" stroke="#0969da" stroke-width="5" />
      <text v-if="phaseAtLamp && !lit" x="352" y="104" font-size="13" font-weight="700" fill="#cf222e">230 В на патроне!</text>
    </svg>
    <p class="verdict" :class="{ bad: phaseAtLamp && !lit }">
      <template v-if="lit">Цепь замкнута: лампа горит.</template>
      <template v-else-if="phaseAtLamp">Лампа не горит, но к патрону подведена фаза. Менять лампу опасно!</template>
      <template v-else>Цепь разомкнута, патрон без напряжения.</template>
    </p>
  </div>
</template>

<style scoped>
.circuit-demo { margin: 16px 0; max-width: 460px; }
.controls { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
button { padding: 6px 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); cursor: pointer; }
button:hover { border-color: var(--vp-c-brand-1); }
.verdict { margin: 8px 0 0; font-weight: 600; }
.verdict.bad { color: #cf222e; }
</style>
