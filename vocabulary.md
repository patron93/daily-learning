---
title: Словарь
---

<script setup>
import { computed } from 'vue'
import vocab from './polish/vocabulary.json'

const DUE = new Date().toISOString().slice(0, 10)
const words = computed(() =>
  [...vocab.words].sort((a, b) => b.added.localeCompare(a.added) || a.pl.localeCompare(b.pl))
)
const due = computed(() => words.value.filter((w) => w.next_review <= DUE).length)
const gender = { 'noun-m': 'm', 'noun-f': 'ż', 'noun-n': 'n' }
</script>

# 📖 Словарь

Всего слов: **{{ words.length }}**, к повторению сегодня: **{{ due }}**. Уровень (box) растёт от 1 до 5: чем выше, тем реже слово повторяется.

<table>
  <thead>
    <tr><th>Польский</th><th>Род</th><th>Перевод</th><th>Пример</th><th>Box</th><th>Повтор</th></tr>
  </thead>
  <tbody>
    <tr v-for="w in words" :key="w.pl">
      <td><strong>{{ w.pl }}</strong></td>
      <td>{{ gender[w.pos] ?? w.pos }}</td>
      <td>{{ w.ru }}</td>
      <td>{{ w.example }}</td>
      <td>{{ w.box }}</td>
      <td>{{ w.next_review }}</td>
    </tr>
  </tbody>
</table>
