import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, ArrowRight, Mail, Lock, Link2, Save, X, LogOut, Loader, FileText, User, Image as ImageIcon, ArrowUp, ArrowDown, Film, Play, Globe } from "lucide-react";
import bpLogo from "../../../assets/images/bp.png";
import type { BlogPost, BlogImage } from "../types/blog";
import { getBlogs, createBlog, updateBlog, deleteBlog, uploadBlogImage } from "../utils/blogStorage";
import { parseVideoEmbed } from "../utils/videoEmbed";
import { fetchLinkPreview, faviconFor } from "../utils/linkPreview";
import { getAbout, saveAbout } from "../utils/aboutStorage";
import type { AboutContent, AboutSection } from "../utils/aboutStorage";
import { supabase } from "../../lib/supabase";

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  date: string;
  images: BlogImage[];
}

// Accept a pasted URL with or without a scheme; returns a normalized absolute
// URL (defaulting to https://) or null if it can't be made into one.
function normalizeUrl(raw: string): string | null {
  for (const candidate of [raw, `https://${raw}`]) {
    try {
      const u = new URL(candidate);
      if (u.hostname.includes(".")) return u.href;
    } catch {
      // try next candidate
    }
  }
  return null;
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const inputCls = "w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-all";
const labelCls = "block text-xs font-medium text-zinc-400 mb-2";

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, notice }: { onLogin: () => void; notice?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      onLogin();
    }
  };

  const fieldWrap = "group relative flex items-center";
  const iconCls = "absolute left-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors pointer-events-none";
  const fieldCls = "w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-white/10 focus:bg-zinc-900 transition-all";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0b] text-white flex items-center justify-center px-6">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10%] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[10%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 40%, transparent 100%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {/* Brand mark */}
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-zinc-800/80 shadow-inner shadow-white/5">
              <img src={bpLogo} alt="" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-sm font-medium tracking-wide text-zinc-400">Philip Boafo</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 mb-7 text-sm text-zinc-500">Sign in to manage your dashboard</p>

          {notice && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
              <Lock size={13} className="shrink-0" /> {notice}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className={labelCls}>Email address</label>
              <div className={fieldWrap}>
                <Mail size={16} className={iconCls} />
                <input
                  type="email"
                  value={email}
                  autoFocus
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  className={fieldCls}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Password</label>
              <div className={fieldWrap}>
                <Lock size={16} className={iconCls} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  className={`${fieldCls} pr-11 ${error ? "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/10" : ""}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                >
                  <X size={13} /> {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-white/5 transition-all hover:bg-zinc-100 hover:shadow-white/10 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        <a
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft size={13} /> Back to site
        </a>
      </motion.div>
    </div>
  );
}

// ─── Blog Post Form ───────────────────────────────────────────────────────────
function PostForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: BlogPost | null;
  onSave: (data: BlogFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<BlogFormData>(
    initial
      ? {
        title: initial.title,
        excerpt: initial.excerpt,
        content: initial.content,
        date: initial.date,
        images: initial.images ?? [],
      }
      : { title: "", excerpt: "", content: "", date: todayLabel(), images: [] }
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  // Media section: switch between uploading an image, pasting a video link, or
  // adding a website link preview.
  const [mediaType, setMediaType] = useState<"image" | "video" | "link">("image");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");

  const valid = form.title.trim() && form.excerpt.trim() && form.content.trim();

  const addVideo = () => {
    const url = videoUrl.trim();
    if (!url) return;
    if (!parseVideoEmbed(url)) {
      setVideoError("Not a recognized video link (YouTube, Vimeo, or Loom).");
      return;
    }
    setForm(f => ({ ...f, images: [...f.images, { url, position: "top", type: "video" }] }));
    setVideoUrl("");
    setVideoError("");
  };

  const addLink = async () => {
    const url = linkUrl.trim();
    if (!url) return;
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setLinkError("Enter a valid URL, e.g. https://example.com");
      return;
    }
    setLinkLoading(true);
    setLinkError("");
    const preview = await fetchLinkPreview(normalized);
    setForm(f => ({
      ...f,
      images: [...f.images, {
        url: preview.url,
        position: "top",
        type: "link",
        title: preview.title,
        description: preview.description,
        image: preview.image,
      }],
    }));
    setLinkUrl("");
    setLinkLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file later
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const urls = await Promise.all(files.map(uploadBlogImage));
      setForm(f => ({ ...f, images: [...f.images, ...urls.map(url => ({ url, position: "top" as const, type: "image" as const }))] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (i: number) => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  const setImagePosition = (i: number, position: "top" | "bottom") =>
    setForm(f => ({ ...f, images: f.images.map((img, idx) => (idx === i ? { ...img, position } : img)) }));

  const handleSave = async () => {
    if (!valid) return;

    // Flush a video/link that was pasted but not yet "Added" so it isn't lost
    // when the author clicks Publish straight after pasting.
    let images = form.images;
    const pendingVideo = videoUrl.trim();
    if (pendingVideo) {
      if (!parseVideoEmbed(pendingVideo)) {
        setMediaType("video");
        setVideoError("Not a recognized video link (YouTube, Vimeo, or Loom).");
        return;
      }
      images = [...images, { url: pendingVideo, position: "top", type: "video" }];
    }
    const pendingLink = linkUrl.trim();
    if (pendingLink) {
      const normalized = normalizeUrl(pendingLink);
      if (!normalized) {
        setMediaType("link");
        setLinkError("Enter a valid URL, e.g. https://example.com");
        return;
      }
      setLinkLoading(true);
      const preview = await fetchLinkPreview(normalized);
      setLinkLoading(false);
      images = [...images, {
        url: preview.url,
        position: "top",
        type: "link",
        title: preview.title,
        description: preview.description,
        image: preview.image,
      }];
    }
    if (images !== form.images) {
      setForm(f => ({ ...f, images }));
      setVideoUrl("");
      setLinkUrl("");
    }

    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, images });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <h1 className="text-base font-semibold">{initial ? "Edit post" : "New post"}</h1>
              <p className="text-xs text-zinc-600 mt-0.5">{initial ? "Update your blog post" : "Create a new blog post"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-zinc-800 rounded-xl transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <X size={13} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!valid || saving}
              className="px-4 py-2 text-sm bg-white text-zinc-950 rounded-xl font-semibold hover:bg-zinc-100 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? "Saving…" : "Publish"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Title + Date side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className={inputCls}
                placeholder="Post title"
              />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="text"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className={inputCls}
                placeholder="May 6, 2026"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className={labelCls}>Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={e => setForm({ ...form, excerpt: e.target.value })}
              className={`${inputCls} resize-none`}
              placeholder="Short description shown in the blog list..."
              rows={3}
            />
          </div>

          {/* Media — images and/or video links */}
          <div>
            <label className={labelCls}>Media (optional)</label>

            {form.images.length > 0 && (
              <div className="mb-3 space-y-2">
                {form.images.map((img, i) => {
                  const embed = img.type === "video" ? parseVideoEmbed(img.url) : null;
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-2">
                      {/* Thumbnail — video preview, link preview, or uploaded image */}
                      {img.type === "video" ? (
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                          {embed?.thumbnail ? (
                            <img src={embed.thumbnail} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-zinc-500"><Film size={18} /></div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white">
                              <Play size={12} className="ml-0.5 fill-current" />
                            </span>
                          </div>
                        </div>
                      ) : img.type === "link" ? (
                        <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
                          {img.image ? (
                            <img src={img.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                          ) : (
                            <img src={faviconFor(img.url)} alt="" referrerPolicy="no-referrer" className="h-6 w-6" />
                          )}
                        </div>
                      ) : (
                        <img src={img.url} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                      )}
                      <div className="flex flex-1 flex-wrap items-center gap-1.5">
                        {(["top", "bottom"] as const).map(pos => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setImagePosition(i, pos)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${img.position === pos
                              ? "border-zinc-500 bg-zinc-800 text-white"
                              : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                              }`}
                          >
                            {pos === "top" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            {pos === "top" ? "Top" : "Bottom"}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label="Remove media"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-red-400/10 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Image / Video / Link switch */}
            <div className="mb-3 flex w-fit gap-1 rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-1">
              {([
                { key: "image", label: "Image", icon: ImageIcon },
                { key: "video", label: "Video", icon: Film },
                { key: "link", label: "Link", icon: Globe },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setMediaType(key); setVideoError(""); setLinkError(""); }}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm transition-all ${mediaType === key ? "bg-zinc-700 text-white font-medium" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            {mediaType === "image" ? (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-6 text-zinc-500 transition-all hover:border-zinc-500 hover:text-zinc-300">
                {uploading ? (
                  <><Loader size={16} className="animate-spin" /> <span className="text-sm">Uploading…</span></>
                ) : (
                  <><ImageIcon size={18} /> <span className="text-sm">{form.images.some(m => !m.type || m.type === "image") ? "Add more images" : "Click to upload image(s)"}</span></>
                )}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            ) : mediaType === "video" ? (
              <div>
                <div className="flex gap-2">
                  <div className="relative flex flex-1 items-center">
                    <Link2 size={15} className="absolute left-3.5 text-zinc-600 pointer-events-none" />
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={e => { setVideoUrl(e.target.value); setVideoError(""); }}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addVideo(); } }}
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-all"
                      placeholder="Paste a YouTube / Vimeo / Loom link…"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addVideo}
                    disabled={!videoUrl.trim()}
                    className="shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                {videoError && <p className="mt-2 text-xs text-red-400">{videoError}</p>}
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <div className="relative flex flex-1 items-center">
                    <Globe size={15} className="absolute left-3.5 text-zinc-600 pointer-events-none" />
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={e => { setLinkUrl(e.target.value); setLinkError(""); }}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                      disabled={linkLoading}
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-all disabled:opacity-60"
                      placeholder="Paste a website link — https://…"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addLink}
                    disabled={!linkUrl.trim() || linkLoading}
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {linkLoading ? <><Loader size={13} className="animate-spin" /> Fetching…</> : "Add"}
                  </button>
                </div>
                {linkError && <p className="mt-2 text-xs text-red-400">{linkError}</p>}
                <p className="mt-2 text-xs text-zinc-600">Fetches the page's title, description, and image to build a preview card.</p>
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label className={labelCls}>Content</label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className={`${inputCls} resize-none font-mono`}
              placeholder="Full blog post content..."
              rows={20}
            />
            <p className="mt-2 text-xs text-zinc-600">
              Supports Markdown. Use <code className="rounded bg-zinc-800/80 px-1 py-0.5 text-zinc-300">```js … ```</code> for
              colored code blocks, <code className="rounded bg-zinc-800/80 px-1 py-0.5 text-zinc-300">`backticks`</code> for inline code,
              plus <span className="text-zinc-400">#</span> headings, <span className="text-zinc-400">-</span> lists and <span className="text-zinc-400">**bold**</span>.
              Paste a <span className="text-zinc-400">YouTube</span> link on its own line to embed a clickable video preview.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── About Editor ─────────────────────────────────────────────────────────────
function AboutEditor() {
  const [form, setForm] = useState<Omit<AboutContent, "id">>({
    role: "",
    intro: "",
    stack: [],
    sections: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAbout().then(data => {
      if (data) {
        setForm({ role: data.role, intro: data.intro, stack: data.stack, sections: data.sections });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await saveAbout(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const addSection = () =>
    setForm(f => ({ ...f, sections: [...f.sections, { title: "", items: [] }] }));

  const removeSection = (si: number) =>
    setForm(f => ({ ...f, sections: f.sections.filter((_, idx) => idx !== si) }));

  const updateSectionTitle = (si: number, title: string) =>
    setForm(f => ({ ...f, sections: f.sections.map((s, idx) => idx === si ? { ...s, title } : s) }));

  const addItem = (si: number) =>
    setForm(f => ({ ...f, sections: f.sections.map((s, idx) => idx === si ? { ...s, items: [...s.items, { label: "", desc: "" }] } : s) }));

  const removeItem = (si: number, ii: number) =>
    setForm(f => ({ ...f, sections: f.sections.map((s, idx) => idx === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s) }));

  const updateItem = (si: number, ii: number, key: "label" | "desc" | "link", val: string) =>
    setForm(f => ({ ...f, sections: f.sections.map((s, idx) => idx === si ? { ...s, items: s.items.map((it, j) => j === ii ? { ...it, [key]: val } : it) } : s) }));

  const moveItem = (si: number, ii: number, dir: -1 | 1) =>
    setForm(f => ({
      ...f, sections: f.sections.map((s, idx) => {
        if (idx !== si) return s;
        const target = ii + dir;
        if (target < 0 || target >= s.items.length) return s;
        const items = [...s.items];
        [items[ii], items[target]] = [items[target], items[ii]];
        return { ...s, items };
      })
    }));

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader size={16} className="animate-spin text-zinc-700" />
    </div>
  );

  return (
    <div className="space-y-8">

      {/* Identity */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Identity</p>
        <div>
          <label className={labelCls}>Role</label>
          <input
            type="text"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            className={inputCls}
            placeholder="Software Engineer"
          />
        </div>
        <div>
          <label className={labelCls}>Intro</label>
          <textarea
            value={form.intro}
            onChange={e => setForm(f => ({ ...f, intro: e.target.value }))}
            className={`${inputCls} resize-none`}
            rows={4}
            placeholder="Short intro paragraph shown on your about page..."
          />
        </div>
      </div>

      {/* Currently */}
      {/* Sections (e.g. Currently, Work, Projects) */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Sections</p>
        <button
          onClick={addSection}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white border border-zinc-700 rounded-lg px-3 py-1.5 transition-all hover:border-zinc-500"
        >
          <Plus size={11} /> Add section
        </button>
      </div>

      {form.sections.length === 0 ? (
        <p className="text-sm text-zinc-700 py-4 text-center border border-dashed border-zinc-800/60 rounded-2xl">
          No sections yet. Add one like “Currently”, “Work”, or “Projects”.
        </p>
      ) : (
        form.sections.map((section, si) => (
          <div key={si} className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={section.title}
                onChange={e => updateSectionTitle(si, e.target.value)}
                className={`${inputCls} font-medium`}
                placeholder="Section title — e.g. Work"
              />
              <button
                onClick={() => removeSection(si)}
                title="Remove section"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {section.items.length === 0 ? (
              <p className="text-sm text-zinc-700 py-2 text-center">No items yet.</p>
            ) : (
              <div className="space-y-2">
                {section.items.map((item, ii) => (
                  <div key={ii} className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-3 space-y-2">
                    <div className="flex gap-2 items-center">
                      <div className="flex flex-col shrink-0">
                        <button
                          onClick={() => moveItem(si, ii, -1)}
                          disabled={ii === 0}
                          title="Move up"
                          className="w-7 h-5 flex items-center justify-center rounded-md text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          onClick={() => moveItem(si, ii, 1)}
                          disabled={ii === section.items.length - 1}
                          title="Move down"
                          className="w-7 h-5 flex items-center justify-center rounded-md text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                      <span className="w-5 shrink-0 text-center text-xs tabular-nums text-zinc-600">{ii + 1}</span>
                      <input
                        type="text"
                        value={item.label}
                        onChange={e => updateItem(si, ii, "label", e.target.value)}
                        className="w-32 shrink-0 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-all"
                        placeholder="Label"
                      />
                      <input
                        type="text"
                        value={item.desc}
                        onChange={e => updateItem(si, ii, "desc", e.target.value)}
                        className={inputCls}
                        placeholder="Description"
                      />
                      <button
                        onClick={() => removeItem(si, ii)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Link2 size={14} className="absolute left-3.5 text-zinc-600 pointer-events-none" />
                      <input
                        type="url"
                        value={item.link ?? ""}
                        onChange={e => updateItem(si, ii, "link", e.target.value)}
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-all"
                        placeholder="Link (optional) — https://…"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => addItem(si)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white border border-zinc-700 rounded-lg px-3 py-1.5 transition-all hover:border-zinc-500"
            >
              <Plus size={11} /> Add item
            </button>
          </div>
        ))
      )}

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto px-6 py-3 text-sm bg-white text-zinc-950 rounded-xl font-semibold hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader size={13} className="animate-spin" /> : <Save size={13} />}
        {saving ? "Saving…" : saved ? "✓ Saved" : "Save changes"}
      </button>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"posts" | "about">("posts");
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [editing, setEditing] = useState<BlogPost | null | "new">(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadBlogs = () => {
    setLoadingBlogs(true);
    setFetchError("");
    getBlogs()
      .then(setBlogs)
      .catch(err => setFetchError(err.message ?? "Failed to load posts"))
      .finally(() => setLoadingBlogs(false));
  };

  useEffect(() => { loadBlogs(); }, []);

  const handleSave = async (data: BlogFormData) => {
    if (editing === "new") {
      const created = await createBlog(data);
      setBlogs(prev => [created, ...prev]);
    } else {
      await updateBlog((editing as BlogPost).id, data);
      setBlogs(prev =>
        prev.map(b => b.id === (editing as BlogPost).id ? { ...b, ...data } : b)
      );
    }
    setEditing(null);
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await deleteBlog(id);
      setBlogs(prev => prev.filter(b => b.id !== id));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (editing !== null) {
    return (
      <PostForm
        initial={editing === "new" ? null : editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Philip Boafo</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-zinc-800 rounded-xl transition-all hover:border-zinc-600"
            >
              View site
            </a>
            {tab === "posts" && (
              <button
                onClick={() => setEditing("new")}
                className="px-4 py-2 text-sm bg-white text-zinc-950 rounded-xl font-semibold hover:bg-zinc-100 transition-colors flex items-center gap-2"
              >
                <Plus size={13} /> New post
              </button>
            )}
            <button
              onClick={onLogout}
              className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:text-white border border-zinc-800 rounded-xl transition-all hover:border-zinc-600"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-1 mb-8 w-fit">
          {([
            { key: "posts", label: "Posts", icon: FileText },
            { key: "about", label: "About", icon: User },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${tab === key
                ? "bg-zinc-700 text-white font-medium"
                : "text-zinc-500 hover:text-zinc-300"
                }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Posts tab */}
        {tab === "posts" && (
          <>
            {fetchError && (
              <div className="mb-6 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 flex items-center justify-between">
                <span>{fetchError}</span>
                <button onClick={loadBlogs} className="underline hover:no-underline text-xs">Retry</button>
              </div>
            )}

            {loadingBlogs ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse py-5 border-b border-zinc-800/60">
                    <div className="h-3 bg-zinc-800 rounded w-1/2 mb-2" />
                    <div className="h-2.5 bg-zinc-800/70 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-24">
                <FileText size={28} className="text-zinc-800 mx-auto mb-3" />
                <p className="text-zinc-600 text-sm">No posts yet.</p>
                <button
                  onClick={() => setEditing("new")}
                  className="mt-4 text-sm text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
                >
                  Create your first post
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {blogs.map(blog => (
                  <motion.div
                    key={blog.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-4 flex items-center justify-between gap-4 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-zinc-100 group-hover:text-white transition-colors">{blog.title}</p>
                      <p className="text-zinc-600 text-xs mt-0.5">{blog.date}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-zinc-700">
                        <Eye size={12} />
                        <span className="text-xs tabular-nums">{blog.views}</span>
                      </div>
                      <button
                        onClick={() => setEditing(blog)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all"
                        title="Edit"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteId(blog.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "about" && <AboutEditor />}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => !deleting && setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <Trash2 size={16} className="text-red-400" />
              </div>
              <h3 className="text-base font-semibold mb-1">Delete post?</h3>
              <p className="text-zinc-500 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 text-sm border border-zinc-700 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId!)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {deleting ? <Loader size={12} className="animate-spin" /> : null}
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [expired, setExpired] = useState(false);
  const manualLogout = useRef(false);
  const wasAuthed = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      wasAuthed.current = !!session;
      setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthed = !!session;
      // Session ended while we weren't expecting it (token refresh failed /
      // server-side timeout) rather than the user clicking "Sign out".
      if (!isAuthed && wasAuthed.current && !manualLogout.current) {
        setExpired(true);
      }
      manualLogout.current = false;
      wasAuthed.current = isAuthed;
      setAuthed(isAuthed);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    manualLogout.current = true;
    await supabase.auth.signOut();
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <Loader size={18} className="animate-spin text-zinc-700" />
      </div>
    );
  }

  if (!authed) {
    return (
      <LoginScreen
        onLogin={() => { setExpired(false); setAuthed(true); }}
        notice={expired ? "Your session expired. Please sign in again." : ""}
      />
    );
  }
  return <Dashboard onLogout={logout} />;
}
