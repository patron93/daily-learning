---
title: Уроки
---

<script setup>
import { withBase } from 'vitepress'
import { data as lessons } from './.vitepress/lessons.data.mts'
</script>

# 📚 Daily learning

Каждый день два коротких урока: 🇵🇱 польский в 19:53 и 💻 профразвитие в 20:01 (по Варшаве).

## Все уроки

<ul>
  <li v-for="l in lessons" :key="l.url">
    <a :href="withBase(l.url)">{{ l.title }}</a>
  </li>
</ul>
