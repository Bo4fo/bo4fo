import { useState } from "react";
import type { BlogImage } from "../types/blog";
import { linkDomain, faviconFor } from "../utils/linkPreview";

/**
 * A clickable website preview card (an "unfurl") built from metadata saved at
 * add-time. Shows the preview image, title, description, and domain; tapping
 * opens the link in a new tab. Degrades gracefully when fields are missing.
 */
export default function LinkCard({ item }: { item: BlogImage }) {
  const [imgFailed, setImgFailed] = useState(false);
  const domain = linkDomain(item.url);
  const title = item.title || domain;
  const showImage = item.image && !imgFailed;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group my-6 block overflow-hidden rounded-xl border border-zinc-200 bg-white transition-colors hover:border-zinc-300 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
    >
      {showImage && (
        <div className="aspect-[1.91/1] w-full overflow-hidden border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800/60 dark:bg-zinc-800">
          <img
            src={item.image!}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="p-4">
        <p className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {item.description}
          </p>
        )}
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          <img src={faviconFor(item.url)} alt="" width={14} height={14} className="rounded-sm" referrerPolicy="no-referrer" />
          <span className="truncate">{domain}</span>
        </div>
      </div>
    </a>
  );
}
