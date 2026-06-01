import { supabase } from "../../lib/supabase";

export interface AboutItem {
  label: string;
  desc: string;
}

export interface AboutSection {
  title: string;
  items: AboutItem[];
}

export interface AboutContent {
  id: number;
  role: string;
  intro: string;
  stack: { name: string; category: string }[];
  sections: AboutSection[];
}

// The DB `currently` (jsonb) column now stores the dynamic `sections` array.
// We keep the column name to avoid a migration and normalize both the old
// shape ([{label, desc}]) and the new shape ([{title, items}]) on read.
function normalizeSections(raw: unknown): AboutSection[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const first = raw[0] as Record<string, unknown>;
  // Old shape: a flat list of {label, desc} -> wrap into one "Currently" section.
  if (first && "label" in first && !("items" in first)) {
    return [{ title: "Currently", items: raw as AboutItem[] }];
  }
  // New shape: list of {title, items}.
  return (raw as Record<string, unknown>[]).map(s => ({
    title: typeof s.title === "string" ? s.title : "",
    items: Array.isArray(s.items) ? (s.items as AboutItem[]) : [],
  }));
}

export async function getAbout(): Promise<AboutContent | null> {
  const { data, error } = await supabase
    .from("about_content")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) return null;
  return {
    id: data.id,
    role: data.role,
    intro: data.intro,
    stack: data.stack ?? [],
    sections: normalizeSections(data.currently),
  };
}

export async function saveAbout(content: Omit<AboutContent, "id">): Promise<void> {
  const { error } = await supabase
    .from("about_content")
    .upsert({
      id: 1,
      role: content.role,
      intro: content.intro,
      stack: content.stack, // kept dormant to satisfy any NOT NULL column constraint
      currently: content.sections, // sections persist into the existing `currently` jsonb column
    });
  if (error) throw new Error(error.message);
}
