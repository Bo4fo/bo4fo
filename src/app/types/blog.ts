export interface BlogImage {
  url: string;
  position: "top" | "bottom";
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
