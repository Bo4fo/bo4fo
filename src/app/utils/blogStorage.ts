import { supabase } from "../../lib/supabase";
import type { BlogPost } from "../types/blog";

const VIEWED_KEY = "philip_viewed_posts";
const LIKED_KEY = "philip_liked_posts";

export async function getBlogs(): Promise<BlogPost[]> {
  // select("*") is resilient to optional columns (likes, image_url, image_position)
  // not existing yet, so the feed never breaks before a migration is run.
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(b => {
    const rawImages = Array.isArray(b.images) ? b.images : [];
    const images = rawImages.length
      ? rawImages.map((im: { url: string; position?: string }) => ({
          url: im.url,
          position: im.position === "bottom" ? "bottom" : "top",
        }))
      : b.image_url // fall back to the legacy single-image columns
        ? [{ url: b.image_url, position: b.image_position === "bottom" ? "bottom" : "top" }]
        : [];
    return {
      id: b.id,
      title: b.title,
      excerpt: b.excerpt,
      content: b.content,
      date: b.date,
      views: b.views ?? 0,
      likes: b.likes ?? 0,
      images,
    };
  }) as BlogPost[];
}

export async function uploadBlogImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("blog-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
}

export function getLikedPosts(): number[] {
  try {
    return JSON.parse(localStorage.getItem(LIKED_KEY) || "[]") as number[];
  } catch {
    return [];
  }
}

export async function toggleLike(id: number, liked: boolean): Promise<void> {
  const { error } = await supabase.rpc(
    liked ? "increment_blog_likes" : "decrement_blog_likes",
    { post_id: id }
  );
  if (error) throw error;

  const set = new Set(getLikedPosts());
  if (liked) set.add(id);
  else set.delete(id);
  localStorage.setItem(LIKED_KEY, JSON.stringify([...set]));
}

export async function createBlog(
  post: Omit<BlogPost, "id" | "views" | "likes">
): Promise<BlogPost> {
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({ ...post, views: 0 })
    .select()
    .single();

  if (error) throw error;
  return data as BlogPost;
}

export async function updateBlog(
  id: number,
  updates: Partial<Omit<BlogPost, "id" | "views" | "likes">>
): Promise<void> {
  const { error } = await supabase
    .from("blog_posts")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteBlog(id: number): Promise<void> {
  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function incrementView(id: number): Promise<void> {
  try {
    const viewed = JSON.parse(
      sessionStorage.getItem(VIEWED_KEY) || "[]"
    ) as number[];
    if (viewed.includes(id)) return;

    const { error } = await supabase.rpc("increment_blog_views", {
      post_id: id,
    });
    if (!error) {
      sessionStorage.setItem(
        VIEWED_KEY,
        JSON.stringify([...viewed, id])
      );
    }
  } catch {
    // ignore view errors
  }
}
