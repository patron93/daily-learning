import { defineConfig, type DefaultTheme } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const lessonsDir = path.join(root, 'lessons')

const ICONS: Record<string, string> = { polish: '🇵🇱', tech: '💻' }

// Боковое меню: уроки по дням, новые сверху
function lessonsSidebar(): DefaultTheme.SidebarItem[] {
  const files = fs.existsSync(lessonsDir)
    ? fs.readdirSync(lessonsDir).filter((f) => f.endsWith('.md')).sort().reverse()
    : []
  const byDate = new Map<string, DefaultTheme.SidebarItem[]>()
  const dayOf = new Map<string, string>()

  for (const file of files) {
    const m = file.match(/^(\d{4}-\d{2}-\d{2})(?:-(\w+))?\.md$/)
    if (!m) continue
    const [, date, track] = m
    const src = fs.readFileSync(path.join(lessonsDir, file), 'utf8')
    const h1 = src.match(/^#\s+(.+)$/m)?.[1] ?? file
    const day = h1.match(/День\s+(\d+)/)?.[1]
    if (day) dayOf.set(date, day)
    const parts = h1.split('·').map((s) => s.trim())
    const topic = track && parts.length >= 3 ? parts[parts.length - 1] : 'Польский + профразвитие'
    const icon = (track && ICONS[track]) || '📚'
    if (!byDate.has(date)) byDate.set(date, [])
    byDate.get(date)!.push({ text: `${icon} ${topic}`, link: `/lessons/${file.replace(/\.md$/, '')}` })
  }

  return [...byDate.entries()].map(([date, items], i) => ({
    text: `${dayOf.has(date) ? `День ${dayOf.get(date)} · ` : ''}${date}`,
    collapsed: i > 6,
    // польский раньше профразвития, как в расписании
    items: items.sort((a, b) => (a.link! > b.link! ? 1 : -1)),
  }))
}

export default defineConfig({
  lang: 'ru-RU',
  title: 'Daily learning',
  description: 'Ежедневные уроки: польский и профразвитие тимлида',
  base: '/daily-learning/',
  cleanUrls: true,
  ignoreDeadLinks: true,
  srcExclude: [
    'README.md',
    'INSTRUCTIONS.md',
    'profile.md',
    'feedback.md',
    'templates/**',
    'node_modules/**',
  ],
  themeConfig: {
    nav: [
      { text: 'Уроки', link: '/' },
      { text: 'Словарь', link: '/vocabulary' },
      { text: 'Грамматика', link: '/polish/grammar' },
      { text: 'Темы', link: '/tech/topics' },
    ],
    sidebar: [
      {
        text: 'Разделы',
        items: [
          { text: '📖 Словарь', link: '/vocabulary' },
          { text: '✅ План грамматики', link: '/polish/grammar' },
          { text: '🗂 Темы профразвития', link: '/tech/topics' },
        ],
      },
      ...lessonsSidebar(),
    ],
    search: { provider: 'local' },
    outline: { label: 'На странице', level: [2, 3] },
    docFooter: { prev: 'Раньше', next: 'Позже' },
    darkModeSwitchLabel: 'Тема',
    sidebarMenuLabel: 'Меню',
    returnToTopLabel: 'Наверх',
    socialLinks: [{ icon: 'github', link: 'https://github.com/patron93/daily-learning' }],
  },
})
