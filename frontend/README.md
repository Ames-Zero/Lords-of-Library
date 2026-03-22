# Lords of Library Frontend

Frontend prototype for the arXiv swipe recommender demo.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS

## Routes

- /: Swipe feed shell with onboarding-aware featured paper selection.
- /saved: MVP saved papers view (mock data).
- /connections: Static connections cards (local data).
- /onboarding: Lightweight topic selection persisted to local storage.

## Development

```bash
npm install
npm run dev
```

## Build Check

```bash
npm run build
```

## Current Scope

- Frontend-first delivery with typed local mock data and route scaffolding.
- API integration is intentionally deferred until backend endpoints are ready.
