# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start Vite dev server
npm run build     # Production build (outputs to dist/)
```

No lint or test scripts are currently configured.

## Architecture

Personal portfolio and blog application with a React frontend and Supabase backend.

**Entry point:** `main.tsx` — sets up React Router with two routes:
- `/` → `src/app/App.tsx` (portfolio homepage with blog reader)
- `/admin` → `src/app/admin/Admin.tsx` (password-protected blog management)

**Data layer:**
- `src/lib/supabase.ts` — initializes the Supabase client from `VITE_SUPABASE_*` env vars
- `src/app/utils/blogStorage.ts` — all CRUD operations against the `blog_posts` table
- View tracking uses `sessionStorage` to avoid duplicate increments per session; increments are applied optimistically locally then synced via the `increment_blog_views()` PostgreSQL function

**Database:** Single `blog_posts` table (id, title, excerpt, content, date, views, created_at). RLS enabled with public read and anon write policies.

**UI:** shadcn/ui components (Radix UI primitives) live in `src/app/components/ui/`. Animations use Motion (Framer Motion v12). Icons from `lucide-react`. Custom Figma-specific components are in `src/app/components/figma/`.

**Styling:** Tailwind CSS v4 with custom theme variables in `src/styles/theme.css`. Dark theme (zinc-950 background). Fonts loaded via `src/styles/fonts.css` (Manrope).

**Admin auth:** Simple hardcoded password in `Admin.tsx` — not token-based.

**Vite config** includes a custom plugin to resolve Figma asset imports.

## Environment

Requires a `.env` file with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
