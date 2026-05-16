# c.ai

Минималистичный аналог Character.AI. Next.js 14 (App Router) + TypeScript + Tailwind + Prisma + Groq (streaming).

## Быстрый старт (Windows)

```cmd
npm install
npx prisma db push
npm run dev
```

Открой http://localhost:3000

Зарегистрируйся, создай персонажа (кнопка "Создать персонажа"), нажми "Начать чат".

## Переменные окружения (.env)

- `DATABASE_URL` — SQLite по умолчанию (`file:./dev.db`). Для Postgres укажите `postgresql://user:pass@host:5432/db` и смените `provider` в `prisma/schema.prisma` на `postgresql`, затем `npx prisma db push`.
- `JWT_SECRET` — любая длинная строка.
- `GROQ_API_KEY` — уже прописан.
- `GROQ_MODEL` — `llama-3.3-70b-versatile` (можно менять).
- `REDIS_URL` — опционально. Если не задан, используется in-memory кэш.

## Что внутри

- Авторизация через JWT в httpOnly cookie.
- Персонажи: публичные/приватные, лайки, категории, теги, аватары (data URL или ссылка).
- AI-помощник по созданию персонажа (`/api/characters/assist`).
- Чат со стримингом (`/api/chats/[id]/messages`), regenerate, обрезка истории по токен-бюджету и роллинг-саммари.
- Тёмная/светлая тема, shadcn-style UI, React Query.

## Скрипты

- `npm run dev` — запуск
- `npm run build && npm start` — продакшн
- `npm run db:studio` — Prisma Studio (просмотр БД)
