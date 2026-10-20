---
title: Уроки
---

<script setup>
import { withBase } from 'vitepress'
import { data as lessons } from './.vitepress/lessons.data.mts'
</script>

# 📚 Daily learning

Каждый день три коротких урока: 🇵🇱 польский в 19:53, 💻 профразвитие в 20:01 и ⚡ электрика в 20:09 (по Варшаве).

## Все уроки

<ul>
  <li v-for="l in lessons" :key="l.url">
    <a :href="withBase(l.url)">{{ l.title }}</a>
  </li>
</ul>
