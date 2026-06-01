# Philip Boafo — Portfolio & Blog

A personal portfolio and writing space built as a fast, single-page React app with a Supabase backend. It features a minimal dark UI, a blog reader with live view tracking, and a private, authenticated admin dashboard for managing posts and "About" content — no redeploy needed to publish.

## ✨ Features

- **Portfolio homepage** with an About section and a writing feed
- **Blog reader** — expandable posts with per-session view counting
- **Dynamic About sections** — add, rename, and reorder custom sections (e.g. *Currently*, *Work*, *Projects*) and their items from the dashboard
- **Authenticated admin dashboard** — create, edit, and delete posts and About content, secured by Supabase Auth + row-level security
- **Smooth animations** via Motion, **accessible UI** via Radix / shadcn/ui
- **Production-ready** — SPA routing config for Vercel, optimized Vite build

## 🛠 Tech Stack

| Area        | Tech                                                      |
| ----------- | --------------------------------------------------------- |
| Framework   | React 18 + TypeScript                                     |
| Build tool  | Vite 6                                                     |
| Routing     | React Router 7                                             |
| Styling     | Tailwind CSS v4, custom theme variables                   |
| UI          | shadcn/ui (Radix primitives), lucide-react icons          |
| Animation   | Motion (Framer Motion v12)                                |
| Backend     | Supabase (PostgreSQL, Auth, Row-Level Security)           |
| Hosting     | Vercel                                                    |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Install
```bash
npm install
```

### 2. Configure environment
Create a `.env` file in the project root:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up the database
Run the SQL in [`supabase-setup.sql`](./supabase-setup.sql) in your Supabase SQL editor to create the tables, policies, and the `increment_blog_views()` function.

> **Security note:** write policies are restricted to authenticated users; public visitors have read-only access. Keep it that way before going live.

### 4. Run
```bash
npm run dev      # start the dev server
npm run build    # production build → dist/
```

## 📁 Project Structure

```
src/
├── app/
│   ├── App.tsx              # Portfolio homepage + blog reader
│   ├── admin/               # Protected admin dashboard
│   ├── components/          # UI components (shadcn/ui + custom)
│   └── utils/               # Data access (blog & about storage)
├── lib/supabase.ts          # Supabase client
├── styles/                  # Tailwind theme, fonts, globals
└── main.tsx                 # App entry + routes
```

## ☁️ Deployment (Vercel)

1. Import the repository into Vercel — the **Vite** preset is auto-detected.
2. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
3. Deploy. The included [`vercel.json`](./vercel.json) handles SPA routing so deep links don't 404.

## 📄 License

© 2026 Philip Boafo. All rights reserved.
