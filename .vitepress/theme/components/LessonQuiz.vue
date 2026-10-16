<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../../quiz.data.mts'
import { mulberry32 } from '../../quiz/rng'
import { selectLessonQuiz } from '../../quiz/select'
import type { QuizItem, Track } from '../../quiz/types'
import QuizQuestion from './QuizQuestion.vue'

const props = defineProps<{ date: string; track: Track }>()

const items = ref<QuizItem[]>([])
const index = ref(0)
const score = ref(0)
const answered = ref(false)
const ready = ref(false)

function draw() {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0]
  const rng = mulberry32(seed)
  items.value = selectLessonQuiz({ date: props.date, track: props.track, vocab: data.vocab, quizzes: data.quizzes, rng })
  index.value = 0
  score.value = 0
  answered.value = false
  ready.value = true
}

onMounted(draw)

const finished = computed(() => index.value >= items.value.length)
const current = computed(() => items.value[index.value])

function onAnswered(ok: boolean) {
  answered.value = true
  if (ok) score.value++
}

function next() {
  answered.value = false
  index.value++
}
</script>

<template>
  <div v-if="ready && items.length" class="qz-root">
    <template v-if="!finished">
      <p class="qz-progress">{{ index + 1 }} / {{ items.length }}</p>
      <QuizQuestion :key="current.key" :item="current" @answered="onAnswered" />
      <div class="qz-actions">
        <button v-if="answered" type="button" class="qz-btn qz-primary" @click="next">
          {{ index + 1 >= items.length ? 'Результат' : 'Дальше' }}
        </button>
      </div>
    </template>
    <div v-else class="qz-result">
      <p class="qz-score">{{ score }} из {{ items.length }}</p>
      <div class="qz-actions">
        <button type="button" class="qz-btn qz-primary" @click="draw">Ещё раз</button>
        <a class="qz-btn" :href="withBase('/trainer')">Тренажёр</a>
      </div>
    </div>
  </div>
</template>
