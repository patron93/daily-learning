// Prefer a pl-PL voice, else any voice whose lang starts with "pl". Null when none.
export function pickPolishVoice<V extends { lang: string }>(voices: V[]): V | null {
  const norm = (lang: string) => lang.replace(/_/g, '-').toLowerCase()
  const exact = voices.find((v) => norm(v.lang) === 'pl-pl')
  if (exact) return exact
  return voices.find((v) => norm(v.lang).startsWith('pl')) ?? null
}
