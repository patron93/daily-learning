<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QuizItem } from '../../quiz/types'
import { checkItem, type CheckResult } from '../../quiz/check'
import SpeakButton from './SpeakButton.vue'
import DiacriticsKeyboard from './DiacriticsKeyboard.vue'

const props = defineProps<{ item: QuizItem }>()
const emit = defineEmits<{ answered: [ok: boolean] }>()

const result = ref<CheckResult | null>(null)
const picked = ref<string | null>(null)
const typed = ref('')
const input = ref<HTMLInputElement | null>(null)
const placed = ref<number[]>([])

const answered = computed(() => result.value !== null)

const label = computed(() => {
  const it = props.item
  if (it.source === 'file') return it.kind === 'gap' ? 'Впиши пропущенное' : 'Выбери ответ'
  if (it.kind === 'sentence') return 'Собери предложение'
  if (it.kind === 'choice') return 'Выбери перевод'
  return it.dir === 'pl-ru' ? 'Переведи на русский' : 'Переведи на польский'
})

const promptText = computed(() => {
  const it = props.item
  if (it.source === 'file') return it.question.prompt
  if (it.kind === 'sentence') return it.translation
  return it.prompt
})

// Polish text spoken together with the prompt (null when the prompt is not Polish).
const promptSpeech = computed(() => {
  const it = props.item
  if (it.source === 'file') return it.track === 'polish' ? it.question.prompt : null
  if (it.kind === 'sentence') return null
  return it.dir === 'pl-ru' ? it.prompt : null
})

// Polish text spoken after answering.
const answerSpeech = computed(() => {
  const it = props.item
  if (!result.value || it.source === 'file') return null
  if (it.kind === 'sentence') return it.sentence
  return it.dir === 'ru-pl' ? it.kind === 'choice' ? it.answer : result.value.correct : null
})

const options = computed(() => {
  const it = props.item
  return it.kind === 'choice' ? it.options : []
})

const isTyped = computed(() => props.item.kind === 'typed' || props.item.kind === 'gap')

const tokens = computed(() => (props.item.kind === 'sentence' ? props.item.tokens : []))
const available = computed(() => tokens.value.map((t, i) => ({ t, i })).filter((x) => !placed.value.includes(x.i)))
const line = computed(() => placed.value.map((i) => ({ t: tokens.value[i], i })))

const hintParts = computed(() => {
  const h = result.value?.hint
  if (!h) return []
  return [...h.correct].map((ch, i) => ({ ch, mark: h.marks.includes(i) }))
})

function finish(answer: string | string[]) {
  if (answered.value) return
  result.value = checkItem(props.item, answer)
  emit('answered', result.value.ok)
}

function pick(opt: string) {
  if (answered.value) return
  picked.value = opt
  finish(opt)
}

function submitTyped() {
  if (answered.value || !typed.value.trim()) return
  finish(typed.value)
}

function insert(ch: string) {
  const el = input.value
  if (!el || answered.value) return
  const s = el.selectionStart ?? typed.value.length
  const e = el.selectionEnd ?? s
  typed.value = typed.value.slice(0, s) + ch + typed.value.slice(e)
  el.focus()
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(s + ch.length, s + ch.length)
  })
}

function addToken(i: number) {
  if (!answered.value) placed.value = [...placed.value, i]
}

function removeToken(i: number) {
  if (!answered.value) placed.value = placed.value.filter((x) => x !== i)
}

function reset() {
  if (!answered.value) placed.value = []
}

function submitSentence() {
  if (answered.value || placed.value.length === 0) return
  finish(line.value.map((x) => x.t))
}

function optionClass(opt: string) {
  if (!answered.value || !result.value) return ''
  if (opt === result.value.correct) return 'is-correct'
  if (opt === picked.value) return 'is-wrong'
  return ''
}
</script>

<template>
  <div class="qz-question">
    <p class="qz-label">{{ label }}</p>
    <p class="qz-prompt">
      <span>{{ promptText }}</span>
      <SpeakButton v-if="promptSpeech" :text="promptSpeech" />
    </p>

    <div v-if="options.length" class="qz-options">
      <button
        v-for="opt in options"
        :key="opt"
        type="button"
        class="qz-option"
        :class="optionClass(opt)"
        :disabled="answered"
        @click="pick(opt)"
      >
        {{ opt }}
      </button>
    </div>

    <form v-else-if="isTyped" class="qz-typed" @submit.prevent="submitTyped">
      <div class="qz-row">
        <input
          ref="input"
          v-model="typed"
          class="qz-input"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          :readonly="answered"
          aria-label="Ответ"
        />
        <button type="submit" class="qz-btn qz-primary" :disabled="answered">Проверить</button>
      </div>
      <DiacriticsKeyboard v-if="!answered" @insert="insert" />
    </form>

    <div v-else class="qz-sentence">
      <div class="qz-line" :class="{ 'is-empty': !line.length }">
        <button v-for="x in line" :key="x.i" type="button" class="qz-token" :disabled="answered" @click="removeToken(x.i)">
          {{ x.t }}
        </button>
        <span v-if="!line.length" class="qz-placeholder">Нажимай на слова по порядку</span>
      </div>
      <div class="qz-tokens">
        <button v-for="x in available" :key="x.i" type="button" class="qz-token" :disabled="answered" @click="addToken(x.i)">
          {{ x.t }}
        </button>
      </div>
      <div v-if="!answered" class="qz-row">
        <button type="button" class="qz-btn" @click="reset">Сбросить</button>
        <button type="button" class="qz-btn qz-primary" :disabled="!placed.length" @click="submitSentence">Проверить</button>
      </div>
    </div>

    <div v-if="result" class="qz-feedback" :class="result.ok ? 'is-correct' : 'is-wrong'" role="status">
      <p class="qz-verdict">{{ result.ok ? 'Верно!' : 'Неверно' }}</p>
      <p v-if="result.hint" class="qz-hint">
        Правильно пишется:
        <span v-for="(p, i) in hintParts" :key="i"><mark v-if="p.mark">{{ p.ch }}</mark><template v-else>{{ p.ch }}</template></span>
      </p>
      <p v-if="!result.ok" class="qz-correct">
        <span>{{ result.correct }}</span>
        <SpeakButton v-if="answerSpeech && item.kind !== 'sentence'" :text="answerSpeech" />
      </p>
      <p v-if="result.explain" class="qz-explain">{{ result.explain }}</p>
      <p v-if="result.ok && answerSpeech" class="qz-correct">
        <span>{{ answerSpeech }}</span>
        <SpeakButton :text="answerSpeech" />
      </p>
      <SpeakButton v-if="!result.ok && item.kind === 'sentence' && answerSpeech" :text="answerSpeech" />
    </div>
  </div>
</template>
