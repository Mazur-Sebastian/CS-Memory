# CS-Memory

CS-Memory is a memory game featuring Counter-Strike skins as cards, built with modern web technologies.

## Main technologies

- Vue 3
- TypeScript
- Vite
- Tailwind CSS
- Vue Router

## Project structure

- `src/views/` – main views (GameDashboard, MemoryBoard, GameHistory)
- `src/components/common/` – shared components (CSButton, ErrorHandler)
- `src/composables/` – composables (useGameMemory, useGameHistory, useErrorHandler, useSeed, useDateFormat)
- `src/functions/` – helper functions (e.g. shuffleArray)
- `src/types/` – TypeScript types

## How to run

### Requirements

- Node.js (recommended version 18+)
- npm or yarn

### Install dependencies

```bash
npm install
# or
yarn install
```

### Start development server

```bash
npm run dev
# or
yarn dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### Build for production

```bash
npm run build
# or
yarn build
```
