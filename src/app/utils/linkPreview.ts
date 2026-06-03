// Fetches Open Graph–style preview data for a website link so it can be shown
// as an unfurl card. The browser can't read another site's page directly
// (CORS), so we use microlink's free, CORS-enabled API. This runs once in the
// admin when a link is added; the result is saved with the post, so reader
// views never re-fetch and aren't subject to rate limits.

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

/** Bare hostname (no www.) for display, or the raw string if it won't parse. */
export function linkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Google's favicon service — a reliable favicon for any domain. */
export function faviconFor(url: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(linkDomain(url))}&sz=64`;
}

/**
 * Resolve preview metadata for a URL. Always returns at least `{ url }`, so a
 * card can still render (favicon + domain) when a site exposes no preview or
 * the service is unreachable.
 */
export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview> {
  const url = rawUrl.trim();
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    const json = await res.json();
    if (json?.status === "success" && json.data) {
      const d = json.data;
      return {
        url: d.url || url,
        title: d.title || undefined,
        description: d.description || undefined,
        image: d.image?.url || d.logo?.url || undefined,
      };
    }
  } catch {
    // network/parse failure → fall through to the bare-url fallback
  }
  return { url };
}
