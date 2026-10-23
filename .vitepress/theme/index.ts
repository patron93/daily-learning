import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './quiz.css'
import LessonQuiz from './components/LessonQuiz.vue'
import CircuitDemo from './components/CircuitDemo.vue'
import Trainer from './components/Trainer.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LessonQuiz', LessonQuiz)
    app.component('CircuitDemo', CircuitDemo)
    app.component('Trainer', Trainer)
  },
} satisfies Theme
