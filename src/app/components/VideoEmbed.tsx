import { useState } from "react";
import { Play } from "lucide-react";
import type { VideoEmbed as VideoEmbedData } from "../utils/videoEmbed";

/**
 * A clickable video preview card. Shows the platform thumbnail with a play
 * overlay; clicking opens the video in a new tab. Falls back to a plain
 * play-button card when the thumbnail is missing or fails to load.
 */
export default function VideoEmbed({ embed }: { embed: VideoEmbedData }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = embed.thumbnail && !imgFailed;

  return (
    <a
      href={embed.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={embed.label}
      className="group relative my-6 block overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800/60 dark:bg-zinc-900"
    >
      <div className="relative aspect-video w-full">
        {showImage ? (
          <img
            src={embed.thumbnail!}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900" />
        )}

        {/* Darkening overlay for play-button contrast */}
        <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/25" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-black/75">
            <Play size={22} className="ml-0.5 fill-current" />
          </span>
        </div>
      </div>

      {/* Caption bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <Play size={11} className="fill-current" />
        {embed.label}
      </div>
    </a>
  );
}
