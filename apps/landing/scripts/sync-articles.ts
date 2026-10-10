/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getSupabaseServerClient } from "../src/lib/supabase/server";

async function main() {
  const supabase = getSupabaseServerClient();
  const dir = path.join(process.cwd(), "src/content/topics");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();

  console.log(`Syncing ${files.length} articles to Supabase...`);

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;

    // Estimate reading time: 200 words per minute, min 1
    const words = parsed.content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.round(words / 200));

    let publishedAt = new Date().toISOString().slice(0, 10);
    if (typeof data.date === "string" || typeof data.date === "number" || data.date instanceof Date) {
      publishedAt = new Date(data.date).toISOString().slice(0, 10);
    }

    const row = {
      slug,
      title: typeof data.title === "string" ? data.title : slug,
      category: typeof data.category === "string" ? data.category : "foundations",
      summary: typeof data.summary === "string" ? data.summary : "",
      content: parsed.content.trim(),
      essential: Boolean(data.essential),
      reading_time: readingTime,
      related: Array.isArray(data.related) ? (data.related as string[]) : [],
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("articles").upsert(row, { onConflict: "slug" });
    if (error) {
      console.error(`Error syncing ${slug}:`, error.message);
    } else {
      console.log(`Synced: ${slug} (${words} words, category: ${row.category})`);
    }
  }

  console.log("All articles synced successfully to Supabase!");
}

main().catch((err: unknown) => {
  console.error("Fatal error syncing articles:", err);
  process.exit(1);
});
