import { supabase } from "../../lib/supabase";
import type { BlogPost } from "../types/blog";

const VIEWED_KEY = "philip_viewed_posts";

export async function getBlogs(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, excerpt, content, date, views")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BlogPost[];
}

export async function createBlog(
  post: Omit<BlogPost, "id" | "views">
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
  updates: Partial<Omit<BlogPost, "id" | "views">>
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
