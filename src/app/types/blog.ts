export interface BlogImage {
  url: string;
  position: "top" | "bottom";
  // "image" (default, uploaded file) or "video" (a pasted YouTube/Vimeo/Loom
  // link rendered as a clickable preview card). Missing = "image" for old posts.
  type?: "image" | "video";
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
