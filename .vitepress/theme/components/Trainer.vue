<script setup lang="ts">
import { ref } from 'vue'
import { data } from '../../quiz.data.mts'
import { mulberry32 } from '../../quiz/rng'
import { createTrainer, type Trainer } from '../../quiz/select'
import type { QuizItem, Track } from '../../quiz/types'
import QuizQuestion from './QuizQuestion.vue'

const track = ref<Track>('polish')
const phase = ref<'setup' | 'running' | 'done'>('setup')
const current = ref<QuizItem | null>(null)
const answered = ref(false)
const correct = ref(0)
const total = ref(0)
const deal = ref(0)
let trainer: Trainer | null = null

function start() {
  const rng = mulberry32(crypto.getRandomValues(new Uint32Array(1))[0])
  trainer = createTrainer({ track: track.value, vocab: data.vocab, quizzes: data.quizzes, rng })
  correct.value = 0
  total.value = 0
  answered.value = false
  current.value = trainer.next()
  deal.value++
  phase.value = 'running'
}

function onAnswered(ok: boolean) {
  answered.value = true
  total.value++
  if (ok) correct.value++
}

function next() {
  answered.value = false
  current.value = trainer ? trainer.next() : null
  deal.value++
}

function stop() {
  phase.value = 'done'
}

function restart() {
  phase.value = 'setup'
  current.value = null
}
</script>

<template>
  <div class="qz-root">
    <div v-if="phase === 'setup'" class="qz-setup">
      <label class="qz-field">
        Трек
        <select v-model="track" class="qz-select">
          <option value="polish">Польский</option>
          <option value="tech">Профразвитие</option>
        </select>
      </label>
      <button type="button" class="qz-btn qz-primary" @click="start">Начать</button>
    </div>

    <template v-else-if="phase === 'running'">
      <p v-if="!current" class="qz-empty">Пока нет вопросов</p>
      <template v-else>
        <p class="qz-progress">Счёт: {{ correct }} из {{ total }}</p>
        <QuizQuestion :key="`${deal}-${current.key}`" :item="current" @answered="onAnswered" />
      </template>
      <div class="qz-actions">
        <button v-if="answered" type="button" class="qz-btn qz-primary" @click="next">Дальше</button>
        <button type="button" class="qz-btn" @click="stop">Хватит</button>
      </div>
    </template>

    <div v-else class="qz-result">
      <p class="qz-score">Счёт: {{ correct }} из {{ total }}</p>
      <div class="qz-actions">
        <button type="button" class="qz-btn qz-primary" @click="restart">Начать заново</button>
      </div>
    </div>
  </div>
</template>
