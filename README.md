# Blaze

**Multilingual AI support, embedded in any website.**

Blaze lets website owners add an intelligent Q&A assistant to their site in minutes. Visitors ask questions in any language — Blaze finds the answer from the site's own content. No hallucinations. No generic responses. Just grounded, accurate answers from what the site actually says.

---

## What it does

1. **Owner registers a site** on the Blaze dashboard
2. **Blaze crawls the page** using Playwright
3. **Translates the content** into selected languages via lingo.dev
4. **Embeds the content** using Google's `gemini-embedding-001` (3072 dimensions) stored in pgvector
5. **Visitor asks a question** — Blaze detects the language, runs a vector search, and generates a grounded answer via Groq (LLaMA 3.3 70B)
6. **If no answer is found** — visitor leaves their email, stored as an unanswered query for the owner to follow up

---

## Architecture
```
monorepo (turborepo + pnpm workspaces)
├── apps/
│   ├── api/          → Express backend (the brain)
│   ├── dashboard/    → Next.js owner platform
│   ├── widget/       → Vanilla JS embeddable chat widget
│   └── extension/    → Chrome extension (index any page on demand)
└── packages/
    ├── db/           → Drizzle ORM + Neon PostgreSQL + pgvector
    ├── crawler/      → Playwright page crawler
    ├── i18n/         → lingo.dev translation
    ├── embedder/     → Google Gemini embeddings
    └── types/        → Shared Zod schemas
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Backend | Express + TypeScript |
| Database | Neon (PostgreSQL) + pgvector |
| ORM | Drizzle ORM |
| Crawler | Playwright (Chromium) |
| Translation | lingo.dev SDK |
| Embeddings | Google Gemini `gemini-embedding-001` |
| LLM | Groq `llama-3.3-70b-versatile` |
| Dashboard | Next.js 15 + Tailwind CSS |
| Widget | Vanilla TypeScript + Vite |
| Extension | React + Vite + Chrome MV3 |

---

## Flow
```
POST /sites
  → crawlPage()         [Playwright]
  → translateText()     [lingo.dev]
  → embedChunks()       [Gemini]
  → store in pgvector   [Neon]

POST /ask
  → detectLanguage()    [Groq]
  → embedQuestion()     [Gemini]
  → vector search       [pgvector cosine similarity]
  → generateAnswer()    [Groq LLaMA 3.3 70B]
  → return answer or needsEmail: true

POST /ask/email
  → store in unanswered_queries
```

---

## Getting started

### Prerequisites
- Node.js 18+
- pnpm
- Neon database (free tier works)
- API keys: Google AI Studio, Groq, lingo.dev

### Install
```bash
pnpm install
```

### Environment variables

**`apps/api/.env`**
```env
DATABASE_URL=your_neon_connection_string
GOOGLE_API_KEY=your_google_ai_key
GROQ_API_KEY=your_groq_key
LINGODOTDEV_API_KEY=your_lingo_key
```

**`packages/db/.env`**
```env
DATABASE_URL=your_neon_direct_connection_string
```

### Run
```bash
# API
cd apps/api && pnpm dev

# Dashboard
cd apps/dashboard && pnpm dev

# Widget (dev build)
cd apps/widget && pnpm build

# Extension
cd apps/extension && pnpm build
# Then load apps/extension/dist in chrome://extensions
```

### Database setup
```bash
cd packages/db
npx drizzle-kit push
```

---

## The three surfaces

### Widget
Paste one script tag into any website:
```html
<script src="widget.js" data-site-id="your-site-id"></script>
```
A floating chat bubble appears. Visitors ask questions, get answers, or leave their email.

### Dashboard
Owners register sites, monitor indexing progress, copy their embed snippet, and view unanswered queries.

### Chrome Extension
Browse any website, click the Blaze icon, and index it on demand. Then ask questions about the page directly from the extension popup — no website owner required.

---

## Database schema

- `websites` — registered sites with status and languages
- `pages` — crawled pages with base text and content hash
- `translations` — translated content per language
- `embeddings` — vector chunks (3072 dim) linked to translations
- `unanswered_queries` — email captures for follow-up

---

Built for hackathon submission.