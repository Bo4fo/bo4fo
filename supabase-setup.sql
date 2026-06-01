-- Run this entire file in the Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- 1. Create the blog_posts table
create table public.blog_posts (
  id          bigint generated always as identity primary key,
  title       text    not null,
  excerpt     text    not null,
  content     text    not null,
  date        text    not null,
  views       integer not null default 0,
  likes       integer not null default 0,
  images      jsonb   not null default '[]'::jsonb,  -- [{ url, position: 'top' | 'bottom' }]
  created_at  timestamptz not null default now()
);

-- 2. Functions to atomically update counters (avoid race conditions).
--    SECURITY DEFINER lets anonymous visitors increment views/likes even though
--    write access is restricted to authenticated users (see RLS below).
create or replace function increment_blog_views(post_id bigint)
returns void
language sql
security definer
as $$
  update public.blog_posts set views = views + 1 where id = post_id;
$$;

create or replace function increment_blog_likes(post_id bigint)
returns void
language sql
security definer
as $$
  update public.blog_posts set likes = likes + 1 where id = post_id;
$$;

create or replace function decrement_blog_likes(post_id bigint)
returns void
language sql
security definer
as $$
  update public.blog_posts set likes = greatest(likes - 1, 0) where id = post_id;
$$;

-- 3. Row Level Security — public reads, writes only for authenticated (admin) users.
alter table public.blog_posts enable row level security;

create policy "Public read" on public.blog_posts
  for select using (true);

create policy "Auth write" on public.blog_posts
  for all to authenticated using (true) with check (true);

-- 3b. Storage for post images — a public bucket the admin can upload to.
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- Public bucket = anyone can read the image URLs; only authenticated (admin) can upload.
create policy "Authenticated can upload blog images"
on storage.objects for insert to authenticated
with check (bucket_id = 'blog-images');

-- 4. (Optional) Seed with the default 5 starter posts
insert into public.blog_posts (title, excerpt, content, date) values
(
  'Getting Started with Web Development',
  'Learn the fundamentals of modern web development and start your journey...',
  E'Web development is one of the most exciting fields in technology today. Whether you''re building a simple personal website or a complex web application, the fundamentals remain the same.\n\nHTML forms the structure of your web pages — it''s the skeleton of your content. Headings, paragraphs, images, and links all come from HTML tags.\n\nCSS brings style to your structure. From colours and fonts to layouts and animations, CSS transforms plain HTML into beautiful, responsive designs.\n\nJavaScript makes your pages interactive. It handles user events, fetches data from servers, and dynamically updates what your users see.\n\nGetting started is simpler than ever — pick a code editor like VS Code, open your browser''s developer tools, and start experimenting.',
  'April 28, 2026'
),
(
  'The Power of React and Tailwind',
  'Discover how combining React with Tailwind CSS can supercharge your projects...',
  E'React and Tailwind CSS together form one of the most productive frontend development stacks available today.\n\nReact gives you a component-based architecture that makes building complex UIs manageable. With hooks like useState and useEffect, managing state and side effects becomes intuitive and predictable.\n\nTailwind CSS takes a utility-first approach to styling. Instead of writing custom CSS for every component, you compose your designs using small, single-purpose utility classes directly in your markup.\n\nTogether, they enable rapid development without sacrificing maintainability.',
  'April 25, 2026'
),
(
  'Animation with Motion',
  'Creating beautiful, smooth animations has never been easier with Motion...',
  E'Motion (formerly Framer Motion) is a production-ready animation library for React that makes it trivially easy to add fluid, physics-based animations to your interfaces.\n\nWith just a few extra props on any HTML element, you can define entrance animations, hover effects, and complex orchestrated sequences. The declarative API means you describe what you want — not how to calculate each frame.\n\nKey features include animate-presence for enter/exit animations, gesture recognition for drag and tap interactions, and layout animations that automatically transition between layout changes.',
  'April 20, 2026'
),
(
  'Building Responsive Layouts',
  'Master the art of creating layouts that work perfectly on any device...',
  E'Responsive web design ensures your content looks great on any screen — from a 5-inch phone to a 27-inch desktop monitor.\n\nMobile-first is the guiding principle. Start by designing for the smallest screen, then add complexity as the screen grows. In Tailwind, this means writing your base styles for mobile and using responsive prefixes like sm:, md:, and lg: to override them at larger breakpoints.\n\nCSS Grid and Flexbox are your primary layout tools. Grid excels at two-dimensional layouts. Flexbox is perfect for one-dimensional flows.',
  'April 15, 2026'
),
(
  'Best Practices for Clean Code',
  'Write maintainable, scalable code that your future self will thank you for...',
  E'Writing clean code is about communication. Your code will be read far more often than it''s written — by teammates, by future you, and occasionally by people you''ve never met.\n\nMeaningful names are the foundation. A variable named userEmail tells a story; e does not.\n\nSmall functions do one thing well. If a function needs a long comment to explain what it does, it''s probably doing too much.\n\nComments explain why, not what. Code should be self-explanatory; comments should capture the reasoning behind non-obvious decisions.',
  'April 10, 2026'
);
