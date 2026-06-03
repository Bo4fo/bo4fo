export interface BlogImage {
  url: string;
  position: "top" | "bottom";
  // "image" (default, uploaded file), "video" (a pasted YouTube/Vimeo/Loom link
  // shown as a play card), or "link" (a website preview/unfurl card). Missing =
  // "image" for old posts.
  type?: "image" | "video" | "link";
  // For type "link": metadata fetched once at add-time so reader views don't
  // re-fetch. `url` holds the destination; `image` is the preview/OG image.
  title?: string;
  description?: string;
  image?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  views: number;
  likes: number;
  images?: BlogImage[];
  // Legacy single-image fields — still read for backward compatibility.
  image_url?: string | null;
  image_position?: "top" | "bottom";
}
