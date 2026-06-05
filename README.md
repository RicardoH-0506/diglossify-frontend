# Diglossify

A real-time AI-powered translation web app built with React 19, TypeScript, and Vite. Supports text and voice translation between English, Spanish, and German, with a clean light/dark theme.

## Features

- **Text translation** — Debounced, real-time translation as you type
- **Voice translation** — Record audio and receive transcription + translation via WebSocket
- **Auto language detection** — Set the source language to "Auto" and let the API decide
- **Language swap** — Instantly interchange source and target languages
- **Light / Dark theme** — Persisted in `localStorage`, respects system preference on first load
- **Lazy loading** — The translation feature is code-split for a faster initial load

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Language | TypeScript 5.8 |
| Bundler | Vite 7 + SWC |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (radix-nova) |
| Icons | Lucide React |
| Testing | Vitest + Testing Library |

## Getting Started

### Prerequisites

- Node.js 18+
- A running backend that exposes a translation REST endpoint and WebSocket (see [Environment Variables](#environment-variables))

### Installation

```bash
git clone https://github.com/RicardoH-0506/diglossify-frontend.git
cd diglossify-frontend
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Environment Variables

Create a `.env` file at the project root:

```env
VITE_TRANSLATE_API_URL=http://localhost:1234/translate
```

| Variable | Default | Description |
|---|---|---|
| `VITE_TRANSLATE_API_URL` | `http://localhost:1234/translate` | Base URL for the translation REST API and WebSocket endpoint |

The app derives the WebSocket URL automatically from this variable (swapping `http` → `ws` / `https` → `wss`).

## API Contract

### REST — `POST /translate`

**Request body:**
```json
{
  "fromLang": "en",
  "toLang": "es",
  "text": "Hello world"
}
```

**Response body:**
```json
{
  "data": {
    "translatedText": "Hola mundo"
  }
}
```

### WebSocket — `ws://<host>/translate`

**Client → Server:**

| Message | Description |
|---|---|
| `{ type: "setup", fromLang, toLang }` | Sent on connection open |
| Binary `ArrayBuffer` chunks | Raw audio data (webm/ogg) |
| `{ type: "stop" }` | Signals end of recording |

**Server → Client:**

| Message | Description |
|---|---|
| `{ type: "status", message: "Transcribing..." }` | Progress update |
| `{ type: "status", message: "Translating..." }` | Progress update |
| `{ type: "result", text, translatedText }` | Final result |
| `{ type: "error", message }` | Error from server |

## Supported Languages

| Code | Language |
|---|---|
| `auto` | Auto-detect |
| `en` | English |
| `es` | Spanish |
| `de` | German |

## Project Structure

```
src/
├── App.tsx                            # Root component — theme logic, lazy loading
├── main.tsx                           # React entry point
├── components/
│   └── ui/                            # shadcn/ui base components (Button, Card, Select, Textarea)
└── features/
    └── translation/
        ├── TranslationContainer.tsx   # Orchestrator component
        ├── types.ts                   # TypeScript types and interfaces
        ├── constants.ts               # Supported languages
        ├── api/
        │   └── translation.api.ts     # REST fetch + response validation
        ├── hooks/
        │   ├── useTranslation.ts      # Translation state, debounce, abort controller
        │   ├── useAudioRecorder.ts    # MediaRecorder + WebSocket audio pipeline
        │   ├── useStore.ts            # Global translation state (reducer)
        │   └── useDebounce.ts         # Generic debounce hook
        └── components/
            ├── LanguageSelector.tsx   # Language dropdown
            ├── TextArea.tsx           # Source / target text areas
            └── Icons.tsx              # SVG icon components
```

## Testing

```bash
npm test            # Watch mode
npm run test:run    # Single run (CI)
npm run test:ui     # Vitest UI
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:ui` | Open Vitest UI |

## License

MIT
