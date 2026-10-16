import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './quiz.css'
import LessonQuiz from './components/LessonQuiz.vue'
import Trainer from './components/Trainer.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LessonQuiz', LessonQuiz)
    app.component('Trainer', Trainer)
  },
} satisfies Theme
