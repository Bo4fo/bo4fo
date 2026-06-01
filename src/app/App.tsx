import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Eye, GithubIcon, LinkedinIcon, Link2, Check, Heart, Phone, MoreHorizontal, Share2, ArrowUpRight } from "lucide-react";
import { getBlogs, incrementView, getLikedPosts, toggleLike } from "./utils/blogStorage";
import { getAbout } from "./utils/aboutStorage";
import type { AboutContent } from "./utils/aboutStorage";
import type { BlogPost } from "./types/blog";
import BookCallModal from "./components/BookCallModal";

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

export default function App() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBlog, setExpandedBlog] = useState<number | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [activeTab, setActiveTab] = useState<"writing" | "about">("writing");
  const [about, setAbout] = useState<AboutContent | null>(null);
  const [aboutLoading, setAboutLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [likedIds, setLikedIds] = useState<number[]>(() => getLikedPosts());
  const [bookOpen, setBookOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  useEffect(() => {
    getBlogs()
      .then(setBlogs)
      .finally(() => setLoading(false));
  }, []);

  // Open & scroll to a post when arriving via a shared link (?post=<id>)
  useEffect(() => {
    if (loading || blogs.length === 0) return;
    const postId = Number(new URLSearchParams(window.location.search).get("post"));
    if (postId && blogs.some(b => b.id === postId)) {
      if (!showMore && blogs.findIndex(b => b.id === postId) >= 5) setShowMore(true);
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

  const visibleBlogs = blogs.slice(0, showMore ? blogs.length : 5);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-16">

      {/* Scrollable content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16">

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
              className="group inline-flex items-center rounded-full bg-gray-300 px-2.5 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              <Phone size={14} />
              {/* Hidden on mobile; on desktop, slides in on hover */}
              <span className="hidden sm:block max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 ease-out group-hover:ml-1.5 group-hover:max-w-[90px] group-hover:opacity-100">
                Book a call
              </span>
            </button>

            <nav className="flex items-center gap-0.5 bg-zinc-900 rounded-lg p-1">
              {(["writing", "about"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors duration-150 ${activeTab === tab
                    ? "text-white bg-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300"
                    }`}
                >
                  {tab}
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
                        <div className="h-3 bg-zinc-800 rounded w-2/3 mb-2.5" />
                        <div className="h-2.5 bg-zinc-800/70 rounded w-full mb-1" />
                        <div className="h-2.5 bg-zinc-800/50 rounded w-4/5" />
                      </div>
                    ))}
                  </div>
                ) : blogs.length === 0 ? (
                  <p className="text-sm text-zinc-600">No posts yet.</p>
                ) : (
                  <>
                    <div className="divide-y divide-zinc-800/60">
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
                              <h2 className="text-base font-medium text-zinc-100 group-hover:text-white transition-colors leading-snug">
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
                            <span className="inline-flex items-center gap-1 mt-3 text-xs text-zinc-700 group-hover:text-zinc-400 transition-colors">
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
                                <div className="mt-5 pt-5 border-t border-zinc-800/60">
                                  {(blog.images ?? []).filter(im => im.position !== "bottom").map((im, i) => (
                                    <img
                                      key={`top-${i}`}
                                      src={im.url}
                                      alt={blog.title}
                                      className="mb-6 w-full rounded-xl border border-zinc-800/60 object-cover"
                                    />
                                  ))}
                                  <p className="text-base leading-[1.9] whitespace-pre-wrap" style={{ color: "#878787" }}>
                                    {blog.content}
                                  </p>
                                  {(blog.images ?? []).filter(im => im.position === "bottom").map((im, i) => (
                                    <img
                                      key={`bottom-${i}`}
                                      src={im.url}
                                      alt={blog.title}
                                      className="mt-6 w-full rounded-xl border border-zinc-800/60 object-cover"
                                    />
                                  ))}

                                  <div className="mt-8 flex items-center gap-3">
                                    <button
                                      onClick={e => handleLike(e, blog)}
                                      aria-pressed={likedIds.includes(blog.id)}
                                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${likedIds.includes(blog.id)
                                        ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                                        : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
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
                                          : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
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
                                              className="absolute left-0 bottom-full z-20 mb-2 w-40 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/40"
                                            >
                                              <button
                                                role="menuitem"
                                                onClick={e => shareLink(e, blog)}
                                                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
                                              >
                                                <Share2 size={13} /> Share
                                              </button>
                                              <button
                                                role="menuitem"
                                                onClick={e => copyLink(e, blog)}
                                                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
                                              >
                                                <Link2 size={13} /> Copy link
                                              </button>
                                            </motion.div>
                                          </>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.article>
                      ))}
                    </div>

                    {blogs.length > 5 && !showMore && (
                      <button
                        onClick={() => setShowMore(true)}
                        className="mt-2 text-sm text-zinc-600 hover:text-zinc-300 transition-colors"
                      >
                        Show {blogs.length - 5} more →
                      </button>
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
                        <div className="h-2 bg-zinc-800 rounded mb-4" style={{ width: `${w}px` }} />
                        <div className="h-2.5 bg-zinc-800/70 rounded w-full mb-2" />
                        <div className="h-2.5 bg-zinc-800/50 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-12 sm:space-y-14">
                    {/* Intro */}
                    <section>
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-600 mb-4">{about.role}</p>
                      <p className="text-base text-zinc-300 leading-relaxed">{about.intro}</p>
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
                                    className="group inline-flex items-center gap-1 text-base text-zinc-300 underline decoration-zinc-700 underline-offset-4 leading-relaxed transition-colors hover:text-white hover:decoration-zinc-400"
                                  >
                                    {item.desc}
                                    <ArrowUpRight
                                      size={14}
                                      className="shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                                    />
                                  </a>
                                ) : (
                                  <p className="text-base text-zinc-400 leading-relaxed">{item.desc}</p>
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

      </div>

      {/* Fixed footer */}
      <footer className="fixed bottom-0 inset-x-0 bg-[#050505] border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-zinc-700">© 2026 Philip Boafo</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Bo4fo" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-zinc-700 hover:text-zinc-300 transition-colors">
              <GithubIcon size={14} />
            </a>
            <a href="https://x.com/bo4fo" target="_blank" rel="noopener noreferrer" aria-label="X" className="text-zinc-700 hover:text-zinc-300 transition-colors">
              <XIcon size={13} />
            </a>
            <a href="https://www.threads.com/@bo4fo" target="_blank" rel="noopener noreferrer" aria-label="Threads" className="text-zinc-700 hover:text-zinc-300 transition-colors">
              <ThreadsIcon size={14} />
            </a>
            <a href="https://www.linkedin.com/in/bo4fo" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-zinc-700 hover:text-zinc-300 transition-colors">
              <LinkedinIcon size={14} />
            </a>
          </div>
        </div>
      </footer>

      <BookCallModal open={bookOpen} onClose={() => setBookOpen(false)} />

    </div>
  );
}
