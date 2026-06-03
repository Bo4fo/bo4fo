// Recognizes common video URLs and returns the data needed to render a
// clickable preview card (thumbnail + link) inside a blog post. Authors just
// paste a link on its own line; PostContent turns it into a YouTube-style card.

export interface VideoEmbed {
  platform: "youtube" | "vimeo" | "loom";
  /** Canonical watch URL the card links to. */
  href: string;
  /** Preview image URL, or null when the platform needs an API to fetch one. */
  thumbnail: string | null;
  label: string;
}

/**
 * Parse a URL into video-embed data, or return null if it isn't a recognized
 * video link. Only matches bare links so normal inline links are untouched.
 */
export function parseVideoEmbed(rawUrl: string): VideoEmbed | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  // ── YouTube ──────────────────────────────────────────────────────────────
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    if (id) return youtube(id);
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    // watch?v=ID, /embed/ID, /shorts/ID, /live/ID
    const v = url.searchParams.get("v");
    if (v) return youtube(v);
    const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
    if (m) return youtube(m[1]);
  }

  // ── Vimeo ────────────────────────────────────────────────────────────────
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/(\d+)/);
    if (m) {
      return {
        platform: "vimeo",
        href: `https://vimeo.com/${m[1]}`,
        thumbnail: null, // Vimeo thumbnails require an API call; show a placeholder card.
        label: "Watch on Vimeo",
      };
    }
  }

  // ── Loom ─────────────────────────────────────────────────────────────────
  if (host === "loom.com") {
    const m = url.pathname.match(/\/share\/([^/?]+)/);
    if (m) {
      return {
        platform: "loom",
        href: `https://www.loom.com/share/${m[1]}`,
        thumbnail: `https://cdn.loom.com/sessions/thumbnails/${m[1]}-00001.jpg`,
        label: "Watch on Loom",
      };
    }
  }

  return null;
}

function youtube(id: string): VideoEmbed {
  return {
    platform: "youtube",
    href: `https://www.youtube.com/watch?v=${id}`,
    // hqdefault exists for every video (maxresdefault often 404s on older ones).
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    label: "Watch on YouTube",
  };
}
