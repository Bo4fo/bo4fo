import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
// Syntax-highlighting token colors (applied to `.hljs` produced by rehype-highlight).
import "highlight.js/styles/github-dark.css";

/**
 * Renders a blog post body as Markdown with syntax-highlighted code blocks.
 *
 * Authors write plain text or Markdown in the admin; fenced code blocks
 * (```js … ```) are highlighted and inline `code` is styled. Single line
 * breaks are preserved (remark-breaks) so older plain-text posts still read
 * the way they were written. HTML in content is NOT rendered (no rehype-raw),
 * keeping post content XSS-safe.
 */
export default function PostContent({ content }: { content: string }) {
  return (
    <div className="md-body text-base leading-[1.9]" style={{ color: "#878787" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          p: ({ children }) => <p className="mb-5 last:mb-0">{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-white hover:decoration-zinc-400"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => <h1 className="mt-8 mb-3 text-xl font-semibold text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-8 mb-3 text-lg font-semibold text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-6 mb-2 text-base font-semibold text-zinc-200">{children}</h3>,
          ul: ({ children }) => <ul className="mb-5 list-disc space-y-1.5 pl-5 marker:text-zinc-600">{children}</ul>,
          ol: ({ children }) => <ol className="mb-5 list-decimal space-y-1.5 pl-5 marker:text-zinc-600">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-zinc-200">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="my-5 border-l-2 border-zinc-700 pl-4 italic text-zinc-400">{children}</blockquote>
          ),
          hr: () => <hr className="my-8 border-zinc-800" />,
          img: ({ src, alt }) => (
            <img src={src as string} alt={alt ?? ""} className="my-6 w-full rounded-xl border border-zinc-800/60 object-cover" />
          ),
          // Container for fenced code blocks. github-dark.css gives the inner
          // `code.hljs` its padding/background/colors; we add the rounded frame.
          pre: ({ children }) => (
            <pre className="my-5 overflow-hidden rounded-xl border border-zinc-800/80 bg-[#0d1117] text-sm">{children}</pre>
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
              <code className="rounded-md bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-200">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-zinc-800 px-3 py-2 text-left font-medium text-zinc-300">{children}</th>,
          td: ({ children }) => <td className="border border-zinc-800 px-3 py-2 text-zinc-400">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
