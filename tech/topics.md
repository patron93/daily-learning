# Темы для профразвития

Бэклог по категориям. Берётся первая неотмеченная тема нужной категории.
Свои темы можно дописывать в любое место.

## angular
- [x] Signals глубже: computed, effect, когда effect — антипаттерн
- [ ] linkedSignal и resource / httpResource: асинхронные данные на сигналах
- [ ] Zoneless Angular: как работает change detection без zone.js и как мигрировать
- [ ] Deferrable views (@defer): стратегии триггеров и влияние на бандл
- [ ] Control flow (@if/@for/@switch) и почему track важен для производительности
- [ ] Новые signal-based формы
- [ ] SSR + hydration (incremental hydration, event replay)
- [ ] DI изнутри: иерархия инжекторов, inject() vs constructor, environment injectors
- [ ] Standalone-архитектура больших приложений, отказ от NgModule
- [ ] RxJS в мире сигналов: toSignal/toObservable, когда RxJS всё ещё нужен
- [ ] NgRx SignalStore против классического NgRx и сервисов с сигналами
- [ ] Производительность: OnPush, профилирование в Angular DevTools, бандл-анализ
- [ ] Тестирование: Jest/Vitest вместо Karma, component harnesses, тестирование сигналов

## leadership
- [x] 1:1 встречи: структура, вопросы, как не превратить их в статус-митинг
- [ ] Делегирование: матрица «навык × желание», уровни делегирования
- [ ] Code review как инструмент роста, а не бутылочное горлышко
- [ ] Feedback: модель SBI и как давать сложный фидбек
- [ ] Tech debt: как продавать его бизнесу и планировать
- [ ] Онбординг нового разработчика за 30/60/90 дней
- [ ] Psychological safety: исследование Google Project Aristotle и практика
- [ ] Метрики команды: DORA, SPACE, почему velocity — плохая метрика
- [ ] ADR (Architecture Decision Records): как фиксировать решения
- [ ] Как вести технические собеседования
- [ ] Bus factor и распространение знаний в команде
- [ ] Staff/Principal путь против менеджерского: в чём разница

## architecture
- [x] Монорепо: Nx, границы модулей, enforce-module-boundaries
- [ ] Micro-frontends: Module Federation / Native Federation, когда оно того не стоит
- [ ] Feature-sliced / domain-driven структура фронтенда
- [ ] Дизайн-системы и библиотеки компонентов: версионирование, токены
- [ ] State management: классификация состояний (server, UI, URL, form)
- [ ] BFF (Backend for Frontend) и API-контракты (OpenAPI, генерация клиентов)
- [ ] Web performance: Core Web Vitals (LCP, INP, CLS) на практике
- [ ] Кеширование на фронте: HTTP-кеш, Service Worker, stale-while-revalidate
- [ ] Error handling и observability на фронте (Sentry, OpenTelemetry)
- [ ] Feature flags и trunk-based development

## ai
- [x] Как работают LLM: токены, контекстное окно, temperature (без математики)
- [ ] AI-агенты для кодинга в команде: правила, ревью, риски
- [ ] Prompt engineering для разработчиков: структура, примеры, XML-теги
- [ ] RAG: как построить поиск по документации проекта
- [ ] MCP (Model Context Protocol): что это и зачем фронтендеру
- [ ] Встраивание LLM во фронтенд: streaming-ответы, UX ожидания
- [ ] Оценка качества LLM-фич (evals)
- [ ] Angular + AI: генерация кода, best practices, llms.txt

## backend
- [ ] Node.js event loop глубже: microtasks, libuv
- [ ] NestJS для Angular-разработчика: те же идеи DI и декораторов
- [ ] REST vs GraphQL vs tRPC: компромиссы
- [ ] Аутентификация: сессии vs JWT, OAuth2/OIDC, PKCE
- [ ] PostgreSQL: индексы, EXPLAIN, N+1
- [ ] Очереди и асинхронность: когда нужен message broker
- [ ] Docker для фронтендера: multi-stage build, nginx для SPA
- [ ] CI/CD: кеширование, affected-сборки, preview-окружения

## classic
- [ ] SOLID на примерах Angular
- [ ] Паттерны: Strategy, Facade, Adapter во фронтенде
- [ ] «Clean Code» с критикой: что устарело
- [ ] Закон Конвея и Team Topologies
- [ ] «The Pragmatic Programmer»: ключевые идеи
- [ ] «An Elegant Puzzle» (Will Larson): системы для инженерных организаций
- [ ] «The Manager's Path» (Camille Fournier): глава про тимлида
- [ ] Mythical Man-Month: закон Брукса сегодня
- [ ] Функциональное программирование в TS: иммутабельность, чистые функции
- [ ] TypeScript-типы продвинуто: conditional, mapped, template literal types

## Пройдено
<!-- формат: - YYYY-MM-DD · категория · тема -->
- 2026-10-15 · angular · Signals глубже: computed, effect, когда effect — антипаттерн
- 2026-10-16 · leadership · 1:1 встречи: структура, вопросы, как не превратить их в статус-митинг
- 2026-10-17 · news · Lockfile для GitHub Actions (public preview, 14.10.2026)
- 2026-10-18 · architecture · Монорепо: Nx, границы модулей, enforce-module-boundaries
- 2026-10-19 · ai · Как работают LLM: токены, контекстное окно, temperature (без математики)
