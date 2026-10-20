import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const readTemplate = (track: 'polish' | 'tech' | 'electric') =>
  readFileSync(resolve(root, 'templates', `${track}.md`), 'utf8');

const lines = (md: string) => md.split('\n');

describe('polish template', () => {
  it('has no static review, exercise or answer sections', () => {
    const md = readTemplate('polish');
    expect(md).not.toMatch(/Повторение/);
    expect(md).not.toMatch(/Упражнение/);
    expect(md).not.toMatch(/Ответы/);
  });
});

describe.each(['polish', 'tech', 'electric'] as const)('%s template quiz section', (track) => {
  const md = readTemplate(track);

  it('ends with the quiz heading as the last level-2 heading', () => {
    const h2 = lines(md).filter((line) => line.startsWith('## '));
    expect(h2.at(-1)).toBe('## 🧩 Квиз');
  });

  it(`embeds LessonQuiz for the ${track} track right before the footer`, () => {
    const all = lines(md);
    const subIndex = all.findIndex((line) => line.startsWith('<sub>'));
    expect(subIndex).toBeGreaterThan(-1);

    let i = subIndex - 1;
    while (i >= 0 && all[i].trim() === '') i--;

    expect(all[i].trim()).toBe(`<LessonQuiz date="{YYYY-MM-DD}" track="${track}" />`);
  });
});
