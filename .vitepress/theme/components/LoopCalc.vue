<script setup lang="ts">
import { ref, computed } from 'vue'

// Упрощённый расчёт петли короткого замыкания в системе TN (медь, PE того же сечения, без реактанса)
const length = ref(30) // м
const section = ref(2.5) // мм²
const breaker = ref('B16')
const ze = ref(0.4) // Ом, сопротивление сети до щита

const RHO = 0.0175 // Ом·мм²/м, медь при 20 °C
const U0 = 230

const ia = computed(() => {
  const letter = breaker.value[0]
  const inom = Number(breaker.value.slice(1))
  const k = letter === 'B' ? 5 : letter === 'C' ? 10 : 20
  return k * inom
})
const rLine = computed(() => (RHO * 2 * length.value) / section.value)
const zs = computed(() => ze.value + rLine.value)
const ik = computed(() => U0 / zs.value)
const zsMax = computed(() => U0 / ia.value)
const zsMaxMeasured = computed(() => (2 / 3) * zsMax.value)
const status = computed(() => {
  if (zs.value <= zsMaxMeasured.value) return 'ok'
  if (zs.value <= zsMax.value) return 'edge'
  return 'bad'
})
const fmt = (x: number, d = 2) => x.toFixed(d).replace('.', ',')
</script>

<template>
  <div class="loop-calc">
    <div class="row">
      <label>Длина линии: <b>{{ length }} м</b>
        <input type="range" min="5" max="200" step="5" v-model.number="length" />
      </label>
    </div>
    <div class="row">
      <label>Сечение:
        <select v-model.number="section">
          <option :value="1.5">1,5 мм²</option>
          <option :value="2.5">2,5 мм²</option>
          <option :value="4">4 мм²</option>
          <option :value="6">6 мм²</option>
          <option :value="10">10 мм²</option>
        </select>
      </label>
      <label>Автомат:
        <select v-model="breaker">
          <option>B10</option><option>B16</option><option>B20</option><option>B25</option>
          <option>C10</option><option>C16</option><option>C20</option>
        </select>
      </label>
      <label>Ze сети:
        <select v-model.number="ze">
          <option :value="0.2">0,2 Ом (новый дом рядом с ТП)</option>
          <option :value="0.4">0,4 Ом (типично)</option>
          <option :value="0.8">0,8 Ом (старая сеть, далеко от ТП)</option>
        </select>
      </label>
    </div>
    <table>
      <tr><td>Сопротивление провода туда и обратно (L + PE)</td><td>{{ fmt(rLine) }} Ом</td></tr>
      <tr><td>Петля Zs = Ze + провод</td><td><b>{{ fmt(zs) }} Ом</b></td></tr>
      <tr><td>Ток короткого замыкания Ik = 230 / Zs</td><td><b>{{ fmt(ik, 0) }} А</b></td></tr>
      <tr><td>Нужно для мгновенного отключения {{ breaker }} (Ia)</td><td>{{ ia }} А</td></tr>
      <tr><td>Допустимая Zs (расчёт / с запасом 2/3 для измерения)</td><td>{{ fmt(zsMax) }} / {{ fmt(zsMaxMeasured) }} Ом</td></tr>
    </table>
    <p class="verdict" :class="status">
      <template v-if="status === 'ok'">✔ Автомат отключит короткое замыкание на корпус за доли секунды, с запасом.</template>
      <template v-else-if="status === 'edge'">⚠ На грани: по расчёту хватает, но после нагрева провода и с погрешностью измерения — нет. Электрик такой протокол не подпишет.</template>
      <template v-else>✘ Ток слишком мал: электромагнитная часть не сработает, отключит только медленный тепловой расцепитель — слишком поздно. Нужно сечение больше, автомат B вместо C или УЗО.</template>
    </p>
    <p class="note">Упрощённая модель: медь, PE того же сечения, без индуктивности. Настоящее значение даёт только измерение электриком.</p>
  </div>
</template>

<style scoped>
.loop-calc { margin: 16px 0; padding: 12px 16px; border: 1px solid var(--vp-c-divider); border-radius: 12px; background: var(--vp-c-bg-soft); }
.row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
input[type='range'] { width: 260px; max-width: 100%; }
select { padding: 4px 6px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1); }
table { width: 100%; font-size: 14px; margin: 8px 0; display: table; }
td { padding: 4px 8px; }
.verdict { font-weight: 600; padding: 8px; border-radius: 8px; }
.verdict.ok { background: #dcfce7; color: #14532d; }
.verdict.edge { background: #fef9c3; color: #713f12; }
.verdict.bad { background: #fee2e2; color: #7f1d1d; }
.note { font-size: 12px; color: var(--vp-c-text-2); }
</style>
