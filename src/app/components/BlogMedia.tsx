import VideoEmbed from "./VideoEmbed";
import LinkCard from "./LinkCard";
import { parseVideoEmbed } from "../utils/videoEmbed";
import type { BlogImage } from "../types/blog";

/**
 * Renders one piece of post media — an uploaded image, or a pasted video link
 * shown as a clickable preview card. Used for the top/bottom media slots so
 * images and videos share the same layout.
 */
export default function BlogMedia({
  item,
  alt,
  className,
}: {
  item: BlogImage;
  alt?: string;
  className?: string;
}) {
  if (item.type === "link") {
    return <LinkCard item={item} />;
  }

  if (item.type === "video") {
    const embed = parseVideoEmbed(item.url);
    if (embed) return <VideoEmbed embed={embed} />;
    // Unrecognized video URL — fall back to a plain link so it's never lost.
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="my-6 block truncate rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-600 underline dark:border-zinc-800/60 dark:text-zinc-400"
      >
        {item.url}
      </a>
    );
  }

  return <img src={item.url} alt={alt ?? ""} className={className} />;
}
