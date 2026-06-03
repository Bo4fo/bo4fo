import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, lazy, Suspense } from "react";
import { Eye, GithubIcon, LinkedinIcon, Link2, Check, Heart, Phone, MoreHorizontal, Share2, ArrowUpRight, ArrowLeft, ArrowUp, ArrowRight, Volume2, Square, Pause, Play } from "lucide-react";
import { getBlogs, incrementView, getLikedPosts, toggleLike } from "./utils/blogStorage";
import { getAbout } from "./utils/aboutStorage";
import type { AboutContent } from "./utils/aboutStorage";
import type { BlogPost } from "./types/blog";
import BookCallModal from "./components/BookCallModal";
import BlogMedia from "./components/BlogMedia";
import { Play as PlayIcon } from "lucide-react";
import { parseVideoEmbed } from "./utils/videoEmbed";

// First video in a post (if any), resolved to its preview data — used to show
// a thumbnail on the collapsed list card before the post is opened.
function firstVideoEmbed(blog: BlogPost) {
  const v = (blog.images ?? []).find(im => im.type === "video");
  return v ? parseVideoEmbed(v.url) : null;
}

// Compact video thumbnail shown on the collapsed post card. referrerPolicy
// "no-referrer" avoids YouTube's CORB/hotlink blocking of the thumbnail image.
function ListVideoThumb({ blog }: { blog: BlogPost }) {
  const embed = firstVideoEmbed(blog);
  const [failed, setFailed] = useState(false);
  if (!embed) return null;
  const showImg = embed.thumbnail && !failed;
  return (
    <div className="relative mt-3 aspect-video w-full max-w-[18rem] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800/60">
      {showImg ? (
        <img
          src={embed.thumbnail!}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
          <PlayIcon size={16} className="ml-0.5 fill-current" />
        </span>
      </div>
    </div>
  );
}

// Markdown + syntax highlighting is heavy (highlight.js); load it only when a
// post is actually opened so it stays out of the initial bundle.
const PostContent = lazy(() => import("./components/PostContent"));

// While the chunk loads, show the raw text so content never flashes empty.
function PostBody({ content }: { content: string }) {
  return (
    <Suspense
      fallback={
        <div className="text-base leading-[1.9] whitespace-pre-wrap text-zinc-600 dark:text-[#878787]">
          {content}
        </div>
      }
    >
      <PostContent content={content} />
    </Suspense>
  );
}

function ThreadsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 192 192"
      fill="currentColor"
    >
      <path d="M141.537 88.988c-1.302-.617-2.635-1.18-3.99-1.69-2.327-20.502-13.952-32.298-35.246-32.43h-.469c-12.806 0-23.464 5.454-30.01 15.37l11.077 7.588c4.87-7.377 12.517-8.95 18.933-8.95h.308c7.328.047 12.86 2.173 16.44 6.318 2.606 2.988 4.355 7.13 5.229 12.364a86.97 86.97 0 0 0-14.478-1.205c-22.27 1.235-36.595 13.824-35.726 31.3.44 8.746 4.73 16.278 12.056 21.202 6.232 4.176 14.263 6.228 22.604 5.766 11.056-.603 19.735-4.831 25.808-12.565 4.683-5.998 7.643-13.76 8.85-23.565 5.307 3.204 9.238 7.44 11.463 12.625 3.852 9.007 4.08 23.843-7.79 35.733-10.497 10.51-23.124 15.061-42.278 15.2-21.192-.159-37.256-6.954-47.743-20.199-9.88-12.495-14.945-30.706-15.06-54.145.115-23.438 5.18-41.65 15.06-54.144 10.487-13.246 26.551-20.04 47.743-20.2 21.322.16 37.601 7.001 48.395 20.333 5.282 6.487 9.265 14.71 11.9 24.43l13.498-3.604c-3.1-11.49-8.044-21.534-14.805-29.878C145.64 9.972 125.758 1.093 97.51.9 69.315 1.094 49.257 10.007 36.012 26.484 23.896 41.608 17.61 63.296 17.424 91.5c.186 28.204 6.472 49.892 18.588 65.016 13.245 16.477 33.303 25.39 61.499 25.583 25.7-.175 43.887-6.894 57.92-21.77 16.756-17.694 16.277-39.847 10.753-54.18-3.955-10.36-11.926-18.803-24.647-22.16zM98.17 129.01c-9.6 0-15.6-4.55-15.6-11.84 0-7.52 6.1-11.97 15.6-11.97 9.51 0 15.6 4.45 15.6 11.97 0 7.29-6 11.84-15.6 11.84z" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Number of posts shown per page in the writing list.
const POSTS_PER_PAGE = 6;

// Is the browser's text-to-speech available?
const TTS_SUPPORTED = typeof window !== "undefined" && "speechSynthesis" in window;

// Turn Markdown into readable plain text for text-to-speech: drop code blocks,
// images and markup so the voice reads prose, not backticks and hashes.
function toSpeechText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ". ")        // fenced code blocks
    .replace(/`([^`]+)`/g, "$1")              // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")     // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")  // links → link text
    .replace(/^#{1,6}\s+/gm, "")              // headings
    .replace(/^\s*>\s?/gm, "")                // blockquotes
    .replace(/^\s*[-*+]\s+/gm, "")            // list bullets
    .replace(/^\s*\|.*\|\s*$/gm, "")          // table rows
    .replace(/^\s*-{3,}\s*$/gm, "")           // horizontal rules
    .replace(/(\*\*|__|\*|_|~~)/g, "")        // emphasis markers
    .replace(/\n{2,}/g, ". ")                 // paragraph breaks → pause
    .replace(/\s+/g, " ")
    .trim();
}

// Split text into short, sentence-sized chunks. Chrome fails to start (and cuts
// off) very long single utterances, so we queue many small ones instead.
function chunkForSpeech(text: string, max = 180): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if (current && (current + s).length > max) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export default function App() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBlog, setExpandedBlog] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"writing" | "about">("writing");
  const [about, setAbout] = useState<AboutContent | null>(null);
  const [aboutLoading, setAboutLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [likedIds, setLikedIds] = useState<number[]>(() => getLikedPosts());
  const [bookOpen, setBookOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [readingPost, setReadingPost] = useState<BlogPost | null>(null);

  // Posts longer than this show a faded preview + "Read more" instead of the full
  // body inline; "Read more" opens the dedicated in-page reading view.
  const LONG_THRESHOLD = 600;

  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll so the floating audio control only shows once you've scrolled
  // past the top controls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openReading = (blog: BlogPost) => {
    setMenuOpenId(null);
    setReadingPost(blog);
    window.scrollTo({ top: 0 });
  };

  // Read the current post aloud via the Web Speech API; toggles play/stop.
  const toggleSpeak = () => {
    if (!TTS_SUPPORTED || !readingPost) return;
    const synth = window.speechSynthesis;
    if (speaking || synth.speaking) {
      synth.cancel();
      setSpeaking(false);
      setPaused(false);
      return;
    }
    const chunks = chunkForSpeech(`${readingPost.title}. ${toSpeechText(readingPost.content)}`);
    if (!chunks.length) return;
    // Recover the engine if a prior cancel() left it paused, without an extra
    // cancel() (cancel-then-speak on the same tick is silently dropped in Chrome).
    synth.resume();
    setSpeaking(true);
    setPaused(false);
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      u.rate = 1;
      if (i === chunks.length - 1) u.onend = () => { setSpeaking(false); setPaused(false); };
      u.onerror = () => { setSpeaking(false); setPaused(false); };
      synth.speak(u); // utterances queue and play in order
    });
  };

  // Pause / resume the current narration (used by the floating control).
  const togglePause = () => {
    if (!TTS_SUPPORTED) return;
    const synth = window.speechSynthesis;
    if (paused) {
      synth.resume();
      setPaused(false);
    } else {
      synth.pause();
      setPaused(true);
    }
  };

  // Stop narration whenever the post changes/closes, and on unmount.
  useEffect(() => {
    if (!TTS_SUPPORTED) return;
    setSpeaking(false);
    setPaused(false);
    return () => window.speechSynthesis.cancel();
  }, [readingPost]);

  useEffect(() => {
    getBlogs()
      .then(setBlogs)
      .finally(() => setLoading(false));
  }, []);

  // Open & scroll to a post when arriving via a shared link (?post=<id>)
  useEffect(() => {
    if (loading || blogs.length === 0) return;
    const postId = Number(new URLSearchParams(window.location.search).get("post"));
    const idx = blogs.findIndex(b => b.id === postId);
    if (postId && idx >= 0) {
      setPage(Math.floor(idx / POSTS_PER_PAGE) + 1);
      setExpandedBlog(postId);
      requestAnimationFrame(() =>
        document.getElementById(`post-${postId}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  }, [loading, blogs]);

  const handleLike = async (e: React.MouseEvent, blog: BlogPost) => {
    e.stopPropagation();
    const liked = !likedIds.includes(blog.id);
    // Optimistic update
    setLikedIds(prev => liked ? [...prev, blog.id] : prev.filter(id => id !== blog.id));
    setBlogs(prev =>
      prev.map(b => b.id === blog.id ? { ...b, likes: Math.max(0, b.likes + (liked ? 1 : -1)) } : b)
    );
    try {
      await toggleLike(blog.id, liked);
    } catch {
      // Revert on failure
      setLikedIds(prev => liked ? prev.filter(id => id !== blog.id) : [...prev, blog.id]);
      setBlogs(prev =>
        prev.map(b => b.id === blog.id ? { ...b, likes: Math.max(0, b.likes + (liked ? -1 : 1)) } : b)
      );
    }
  };

  const postUrl = (blog: BlogPost) => `${window.location.origin}/?post=${blog.id}`;

  const shareLink = async (e: React.MouseEvent, blog: BlogPost) => {
    e.stopPropagation();
    setMenuOpenId(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: blog.title, text: blog.excerpt, url: postUrl(blog) });
        return;
      }
      // No native share (most desktops) — fall back to copying
      await navigator.clipboard.writeText(postUrl(blog));
      setCopiedId(blog.id);
      setTimeout(() => setCopiedId(c => (c === blog.id ? null : c)), 2000);
    } catch {
      /* share dismissed or clipboard unavailable */
    }
  };

  const copyLink = async (e: React.MouseEvent, blog: BlogPost) => {
    e.stopPropagation();
    setMenuOpenId(null);
    try {
      await navigator.clipboard.writeText(postUrl(blog));
      setCopiedId(blog.id);
      setTimeout(() => setCopiedId(c => (c === blog.id ? null : c)), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  // Like + share row — shared by the inline expansion and the full reading view.
  const renderActions = (blog: BlogPost) => (
    <div className="mt-8 flex items-center gap-3">
      <button
        onClick={e => handleLike(e, blog)}
        aria-pressed={likedIds.includes(blog.id)}
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${likedIds.includes(blog.id)
          ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
          : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-white"
          }`}
      >
        <motion.span
          key={likedIds.includes(blog.id) ? "liked" : "unliked"}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 14 }}
          className="inline-flex"
        >
          <Heart size={13} fill={likedIds.includes(blog.id) ? "currentColor" : "none"} />
        </motion.span>
        <span className="tabular-nums">{blog.likes}</span>
      </button>
      <div className="relative">
        <button
          onClick={e => {
            e.stopPropagation();
            setMenuOpenId(menuOpenId === blog.id ? null : blog.id);
          }}
          aria-label="Share options"
          aria-haspopup="menu"
          aria-expanded={menuOpenId === blog.id}
          className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-all ${copiedId === blog.id
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-white"
            }`}
        >
          {copiedId === blog.id ? (
            <span className="inline-flex items-center gap-2"><Check size={14} /> Link copied</span>
          ) : (
            <MoreHorizontal size={16} />
          )}
        </button>

        <AnimatePresence>
          {menuOpenId === blog.id && (
            <>
              {/* click-away backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={e => { e.stopPropagation(); setMenuOpenId(null); }}
              />
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 bottom-full z-20 mb-2 w-40 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-black/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40"
              >
                <button
                  role="menuitem"
                  onClick={e => shareLink(e, blog)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Share2 size={13} /> Share
                </button>
                <button
                  role="menuitem"
                  onClick={e => copyLink(e, blog)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Link2 size={13} /> Copy link
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  useEffect(() => {
    if (activeTab !== "about" || about !== null) return;
    setAboutLoading(true);
    getAbout()
      .then(setAbout)
      .finally(() => setAboutLoading(false));
  }, [activeTab]);

  const handleTapToRead = async (blog: BlogPost) => {
    if (expandedBlog === blog.id) {
      setExpandedBlog(null);
      return;
    }
    setExpandedBlog(blog.id);
    const alreadyViewed = JSON.parse(
      sessionStorage.getItem("philip_viewed_posts") || "[]"
    ) as number[];
    if (!alreadyViewed.includes(blog.id)) {
      setBlogs(prev =>
        prev.map(b => b.id === blog.id ? { ...b, views: b.views + 1 } : b)
      );
    }
    await incrementView(blog.id);
  };

  const totalPages = Math.max(1, Math.ceil(blogs.length / POSTS_PER_PAGE));
  const visibleBlogs = blogs.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const goToPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    if (next === page) return;
    setPage(next);
    setExpandedBlog(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-16 dark:bg-[#050505] dark:text-white">

      {/* Scrollable content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16">

        {readingPost ? (
          /* ─── In-page reading view (full post + back) ─── */
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-10 flex items-center justify-between gap-3">
              <button
                onClick={() => setReadingPost(null)}
                className="group inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
              >
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                Back
              </button>

              {TTS_SUPPORTED && (
                <button
                  onClick={toggleSpeak}
                  aria-pressed={speaking}
                  aria-label={speaking ? "Stop reading aloud" : "Read this post aloud"}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${speaking
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-zinc-300 text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
                    }`}
                >
                  {speaking ? <Square size={13} fill="currentColor" /> : <Volume2 size={14} />}
                  {speaking ? "Stop" : "Listen"}
                </button>
              )}
            </div>

            <article>
              <div className="mb-6 flex items-center gap-2.5 text-zinc-600">
                <div className="flex items-center gap-1">
                  <Eye size={12} />
                  <span className="text-xs tabular-nums">{readingPost.views}</span>
                </div>
                <span className="text-zinc-300 dark:text-zinc-800">·</span>
                <span className="text-xs">{readingPost.date}</span>
              </div>

              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white">
                {readingPost.title}
              </h1>
              <p className="mt-3 text-base text-zinc-500 leading-relaxed">{readingPost.excerpt}</p>

              <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800/60 pt-8">
                {(readingPost.images ?? []).filter(im => im.position !== "bottom").map((im, i) => (
                  <BlogMedia
                    key={`r-top-${i}`}
                    item={im}
                    alt={readingPost.title}
                    className="mb-6 w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-800/60"
                  />
                ))}
                <PostBody content={readingPost.content} />
                {(readingPost.images ?? []).filter(im => im.position === "bottom").map((im, i) => (
                  <BlogMedia
                    key={`r-bottom-${i}`}
                    item={im}
                    alt={readingPost.title}
                    className="mt-6 w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-800/60"
                  />
                ))}
                {renderActions(readingPost)}

                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="group mt-12 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white"
                >
                  <ArrowUp size={15} className="transition-transform group-hover:-translate-y-0.5" />
                  Back to top
                </button>
              </div>
            </article>

            {/* Sticky audio control — reachable while scrolled into a long post */}
            <AnimatePresence>
              {speaking && scrolled && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 8 }}
                  transition={{ duration: 0.18 }}
                  onClick={togglePause}
                  aria-label={paused ? "Resume reading aloud" : "Pause reading aloud"}
                  className="fixed bottom-24 right-4 sm:right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 shadow-lg shadow-black/10 transition-transform hover:scale-105 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:shadow-black/40"
                >
                  {paused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
        <>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-10 sm:mb-16"
        >
          <div>
            <h1 className="text-base font-semibold tracking-tight">Philip Boafo</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Software & Mobile Developer</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setBookOpen(true)}
              aria-label="Book a call"
              className="group inline-flex items-center rounded-full bg-zinc-900 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-gray-300 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              <Phone size={14} />
              {/* Hidden on mobile; on desktop, slides in on hover */}
              <span className="hidden sm:block max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 ease-out group-hover:ml-1.5 group-hover:max-w-[90px] group-hover:opacity-100">
                Book a call
              </span>
            </button>

            <nav className="flex items-center gap-0.5 bg-zinc-100 rounded-full p-1 dark:bg-zinc-900">
              {(["writing", "about"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs rounded-full capitalize transition-colors duration-150 ${activeTab === tab
                    ? "bg-white text-zinc-900 shadow-sm dark:text-white dark:bg-zinc-700 dark:shadow-none"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                    }`}
                >
                  {tab === "writing" ? "blog" : tab}
                </button>
              ))}
            </nav>
          </div>
        </motion.header>

        {/* Content */}
        <main>
          <AnimatePresence mode="wait">
            {activeTab === "writing" ? (
              <motion.div
                key="writing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {loading ? (
                  <div className="space-y-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3 mb-2.5" />
                        <div className="h-2.5 bg-zinc-200/70 dark:bg-zinc-800/70 rounded w-full mb-1" />
                        <div className="h-2.5 bg-zinc-200/60 dark:bg-zinc-800/50 rounded w-4/5" />
                      </div>
                    ))}
                  </div>
                ) : blogs.length === 0 ? (
                  <p className="text-sm text-zinc-600">No posts yet.</p>
                ) : (
                  <>
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                      {visibleBlogs.map((blog, index) => (
                        <motion.article
                          key={blog.id}
                          id={`post-${blog.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.35, delay: index * 0.05 }}
                          className="py-6 sm:py-7 first:pt-0 scroll-mt-20"
                        >
                          <button
                            className="w-full text-left group"
                            onClick={() => handleTapToRead(blog)}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h2 className="text-base font-medium text-zinc-900 group-hover:text-black transition-colors leading-snug dark:text-zinc-100 dark:group-hover:text-white">
                                {blog.title}
                              </h2>
                              <div className="flex flex-col items-end sm:flex-row sm:items-center gap-1 sm:gap-2.5 shrink-0 text-zinc-600 pt-0.5">
                                <div className="flex items-center gap-1">
                                  <Eye size={11} />
                                  <span className="text-xs tabular-nums">{blog.views}</span>
                                </div>
                                <span className="text-xs">{blog.date}</span>
                              </div>
                            </div>
                            <p className="text-sm text-zinc-500 leading-relaxed">{blog.excerpt}</p>
                            {expandedBlog !== blog.id && <ListVideoThumb blog={blog} />}
                            <span className="inline-flex items-center gap-1 mt-3 text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors dark:text-zinc-700 dark:group-hover:text-zinc-400">
                              {expandedBlog === blog.id ? "Collapse" : "Read"}
                              <motion.span
                                animate={{ rotate: expandedBlog === blog.id ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="inline-block"
                              >
                                →
                              </motion.span>
                            </span>
                          </button>

                          <AnimatePresence initial={false}>
                            {expandedBlog === blog.id && (
                              <motion.div
                                key="content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-800/60">
                                  {(blog.images ?? []).filter(im => im.position !== "bottom").map((im, i) => (
                                    <BlogMedia
                                      key={`top-${i}`}
                                      item={im}
                                      alt={blog.title}
                                      className="mb-6 w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-800/60"
                                    />
                                  ))}
                                  {blog.content.length > LONG_THRESHOLD ? (
                                    <>
                                      {/* Long post: faded preview that breaks off into "Read more" */}
                                      <div className="relative max-h-52 overflow-hidden">
                                        <PostBody content={blog.content} />
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#050505] dark:via-[#050505]/80" />
                                      </div>
                                      <button
                                        onClick={() => openReading(blog)}
                                        className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 transition-all hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
                                      >
                                        Read more <ArrowUpRight size={13} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <PostBody content={blog.content} />
                                      {(blog.images ?? []).filter(im => im.position === "bottom").map((im, i) => (
                                        <BlogMedia
                                          key={`bottom-${i}`}
                                          item={im}
                                          alt={blog.title}
                                          className="mt-6 w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-800/60"
                                        />
                                      ))}
                                      {renderActions(blog)}
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.article>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
                        <button
                          onClick={() => goToPage(page - 1)}
                          disabled={page === 1}
                          aria-label="Previous page"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-all hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:hover:border-zinc-200 disabled:hover:text-zinc-500 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:text-white dark:disabled:hover:border-zinc-800"
                        >
                          <ArrowLeft size={14} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                          <button
                            key={p}
                            onClick={() => goToPage(p)}
                            aria-current={p === page ? "page" : undefined}
                            className={`h-8 min-w-8 rounded-lg px-2 text-xs tabular-nums transition-all ${p === page
                              ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-700 dark:text-white"
                              : "border border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:hover:border-zinc-700 dark:hover:text-white"
                              }`}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          onClick={() => goToPage(page + 1)}
                          disabled={page === totalPages}
                          aria-label="Next page"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-all hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:hover:border-zinc-200 disabled:hover:text-zinc-500 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:text-white dark:disabled:hover:border-zinc-800"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </nav>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {aboutLoading || !about ? (
                  <div className="space-y-10 animate-pulse">
                    {[100, 220, 180].map((w, i) => (
                      <div key={i}>
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded mb-4" style={{ width: `${w}px` }} />
                        <div className="h-2.5 bg-zinc-200/70 dark:bg-zinc-800/70 rounded w-full mb-2" />
                        <div className="h-2.5 bg-zinc-200/60 dark:bg-zinc-800/50 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-12 sm:space-y-14">
                    {/* Intro */}
                    <section>
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-600 mb-4">{about.role}</p>
                      <p className="text-base text-zinc-700 leading-relaxed dark:text-zinc-300">{about.intro}</p>
                    </section>

                    {/* Sections */}
                    {about.sections.map((section, si) => (
                      section.items.length > 0 && (
                        <section key={si}>
                          <p className="text-xs uppercase tracking-[0.12em] text-zinc-600 mb-6">{section.title}</p>
                          <div className="space-y-5">
                            {section.items.map((item, i) => (
                              <div key={i} className="flex flex-col sm:flex-row sm:gap-8 gap-1">
                                <p className="text-sm text-zinc-600 sm:w-24 shrink-0">{item.label}</p>
                                {item.link ? (
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-1 text-base text-zinc-700 underline decoration-zinc-300 underline-offset-4 leading-relaxed transition-colors hover:text-zinc-900 hover:decoration-zinc-500 dark:text-zinc-300 dark:decoration-zinc-700 dark:hover:text-white dark:hover:decoration-zinc-400"
                                  >
                                    {item.desc}
                                    <ArrowUpRight
                                      size={14}
                                      className="shrink-0 text-zinc-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-900 dark:text-zinc-600 dark:group-hover:text-white"
                                    />
                                  </a>
                                ) : (
                                  <p className="text-base text-zinc-600 leading-relaxed dark:text-zinc-400">{item.desc}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        </>
        )}

      </div>

      {/* Fixed footer */}
      <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-zinc-200 dark:bg-[#050505] dark:border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-zinc-400 dark:text-zinc-700">© 2026 Philip Boafo</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Bo4fo" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-zinc-400 hover:text-zinc-900 transition-colors dark:text-zinc-700 dark:hover:text-zinc-300">
              <GithubIcon size={14} />
            </a>
            <a href="https://x.com/bo4fo" target="_blank" rel="noopener noreferrer" aria-label="X" className="text-zinc-400 hover:text-zinc-900 transition-colors dark:text-zinc-700 dark:hover:text-zinc-300">
              <XIcon size={13} />
            </a>
            <a href="https://www.threads.com/@bo4fo" target="_blank" rel="noopener noreferrer" aria-label="Threads" className="text-zinc-400 hover:text-zinc-900 transition-colors dark:text-zinc-700 dark:hover:text-zinc-300">
              <ThreadsIcon size={14} />
            </a>
            <a href="https://www.linkedin.com/in/bo4fo" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-zinc-400 hover:text-zinc-900 transition-colors dark:text-zinc-700 dark:hover:text-zinc-300">
              <LinkedinIcon size={14} />
            </a>
          </div>
        </div>
      </footer>

      <BookCallModal open={bookOpen} onClose={() => setBookOpen(false)} />

    </div>
  );
}
