import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import VideoEmbed from "./VideoEmbed";
import { parseVideoEmbed } from "../utils/videoEmbed";
// Syntax-highlighting token colors — follows the system light/dark setting.
import "../../styles/code-theme.css";

// Minimal shape of the hast node react-markdown hands each component, just
// enough to detect a paragraph that is nothing but a single autolinked URL.
type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

// If a paragraph contains only a bare video link (YouTube/Vimeo/Loom), return
// its embed data so we can render a preview card instead of a plain link.
function loneVideoEmbed(node?: HastNode) {
  const kids = (node?.children ?? []).filter(
    c => !(c.type === "text" && (c.value ?? "").trim() === "")
  );
  if (kids.length !== 1) return null;
  const only = kids[0];
  if (only.type !== "element" || only.tagName !== "a") return null;
  const href = only.properties?.href;
  if (typeof href !== "string") return null;
  return parseVideoEmbed(href);
}

/**
 * Renders a blog post body as Markdown with syntax-highlighted code blocks.
 *
 * Authors write plain text or Markdown in the admin; fenced code blocks
 * (```js … ```) are highlighted and inline `code` is styled. Single line
 * breaks are preserved (remark-breaks) so older plain-text posts still read
 * the way they were written. HTML in content is NOT rendered (no rehype-raw),
 * keeping post content XSS-safe. Colors adapt to the system theme.
 */
export default function PostContent({ content }: { content: string }) {
  return (
    <div className="md-body text-base leading-[1.9] text-zinc-600 dark:text-[#878787]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          p: ({ children, node }) => {
            const embed = loneVideoEmbed(node as unknown as HastNode);
            if (embed) return <VideoEmbed embed={embed} />;
            return <p className="mb-5 last:mb-0">{children}</p>;
          },
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500 dark:text-zinc-300 dark:decoration-zinc-700 dark:hover:text-white dark:hover:decoration-zinc-400"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => <h1 className="mt-8 mb-3 text-xl font-semibold text-zinc-900 dark:text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-8 mb-3 text-lg font-semibold text-zinc-900 dark:text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-6 mb-2 text-base font-semibold text-zinc-800 dark:text-zinc-200">{children}</h3>,
          ul: ({ children }) => <ul className="mb-5 list-disc space-y-1.5 pl-5 marker:text-zinc-400 dark:marker:text-zinc-600">{children}</ul>,
          ol: ({ children }) => <ol className="mb-5 list-decimal space-y-1.5 pl-5 marker:text-zinc-400 dark:marker:text-zinc-600">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-zinc-900 dark:text-zinc-200">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="my-5 border-l-2 border-zinc-300 pl-4 italic text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">{children}</blockquote>
          ),
          hr: () => <hr className="my-8 border-zinc-200 dark:border-zinc-800" />,
          img: ({ src, alt }) => (
            <img src={src as string} alt={alt ?? ""} className="my-6 w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-800/60" />
          ),
          // Container for fenced code blocks. The highlight.js theme gives the
          // inner `code.hljs` its padding/background/colors; we add the frame.
          pre: ({ children }) => (
            <pre className="my-5 overflow-hidden rounded-xl border border-zinc-200 bg-[#f6f8fa] text-sm dark:border-zinc-800/80 dark:bg-[#0d1117]">{children}</pre>
          ),
          // Distinguish inline code from block code: block code carries a
          // `language-`/`hljs` class from rehype-highlight or spans multiple lines.
          code: ({ className, children, ...props }) => {
            const isBlock = /language-|hljs/.test(className ?? "") || String(children).includes("\n");
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-zinc-200 px-3 py-2 text-left font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">{children}</th>,
          td: ({ children }) => <td className="border border-zinc-200 px-3 py-2 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
