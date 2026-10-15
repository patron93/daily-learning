import { createContentLoader } from 'vitepress'

export interface Lesson {
  url: string
  title: string
  date: string
  track: string
}

export default createContentLoader('lessons/*.md', {
  includeSrc: true,
  transform(raw): Lesson[] {
    return raw
      .map((p) => {
        const name = p.url.split('/').pop() ?? ''
        const [, date = '', track = 'all'] = name.match(/^(\d{4}-\d{2}-\d{2})(?:-(\w+))?/) ?? []
        return { url: p.url, title: p.src?.match(/^#\s+(.+)$/m)?.[1] ?? name, date, track }
      })
      .sort((a, b) => (a.date === b.date ? a.url.localeCompare(b.url) : b.date.localeCompare(a.date)))
  },
})
