import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { TableOfContentsEntry } from "@fsjesc/domain/education/article";

/**
 * The Markdown render pipeline (Part 2, Part 7.2, Part 8.4).
 *
 * ```text
 * remark-parse → remark-gfm → remark-rehype → rehype-sanitize → rehype-slug
 *              → rehype-autolink-headings → rehype-stringify
 * ```
 *
 * **Sanitisation runs before the slug and anchor steps, deliberately.** Everything
 * before it is untrusted author input; everything after it is code this file
 * generates. Running sanitise last would mean allow-listing `id`, `className`,
 * `aria-*` and `tabindex` on arbitrary elements so that untrusted markup could
 * survive — which is exactly the mistake that turns a sanitiser into decoration.
 * Running it first means the only attributes in the final document are ones we
 * wrote ourselves.
 *
 * Raw HTML in Markdown is dropped rather than passed through: `remark-rehype` is
 * used without `allowDangerousHtml`, so an author cannot inject markup at all.
 *
 * The returned HTML is safe to render with `dangerouslySetInnerHTML`, and this
 * file is the only place in the application that does so.
 */

/** A node in the unist/hast tree, described structurally to avoid a type dependency. */
interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/** Headings that appear in the table of contents. h1 is the article title. */
const TOC_TAGS = new Set(["h2", "h3", "h4"]);

export interface RenderedMarkdown {
  html: string;
  tableOfContents: TableOfContentsEntry[];
  wordCount: number;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  // No `allowDangerousHtml`: raw HTML in a topic becomes text, never markup.
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeSlug)
  .use(rehypeAutolink)
  .use(rehypeStringify);

export function renderMarkdown(markdown: string): RenderedMarkdown {
  const file = processor.processSync(markdown);
  const tree = processor.runSync(processor.parse(markdown));

  const tableOfContents = collectHeadings(tree);

  return {
    html: String(file),
    tableOfContents,
    wordCount: countWords(markdown),
  };
}

/**
 * A minimal `rehype-autolink-headings` step.
 *
 * Written inline rather than imported so the generated anchor's shape is explicit
 * and auditable: it is `aria-hidden` and `tabindex="-1"`, so a keyboard user
 * meets one navigation mechanism (the table of contents) rather than a tab stop
 * on every heading in a long article. The visible `#` is a pointer affordance.
 */
function rehypeAutolink() {
  return (tree: HastNode): HastNode => {
    walk(tree, (node) => {
      if (!node.tagName || !TOC_TAGS.has(node.tagName)) return;
      const id = node.properties?.["id"];
      if (typeof id !== "string" || id === "") return;

      node.children = [
        ...(node.children ?? []),
        {
          type: "element",
          tagName: "a",
          properties: {
            href: `#${id}`,
            className: ["heading-anchor"],
            ariaHidden: true,
            tabIndex: -1,
          },
          children: [{ type: "text", value: "#" }],
        },
      ];
    });
    return tree;
  };
}

function collectHeadings(tree: HastNode): TableOfContentsEntry[] {
  const entries: TableOfContentsEntry[] = [];

  walk(tree, (node) => {
    if (!node.tagName || !TOC_TAGS.has(node.tagName)) return;
    const id = node.properties?.["id"];
    if (typeof id !== "string" || id === "") return;

    entries.push({
      id,
      // The autolink step has already appended its `#` glyph to this heading, so
      // that node is excluded — a table of contents entry reading "Risk #" is a
      // tell that the collector and the renderer disagree.
      text: textContent(node, true).trim(),
      depth: Number.parseInt(node.tagName.slice(1), 10),
    });
  });

  return entries;
}

function walk(node: HastNode, visit: (node: HastNode) => void): void {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

/**
 * Concatenate the text of a node's descendants. `skipAnchors` omits the
 * generated heading anchor.
 */
function textContent(node: HastNode, skipAnchors = false): string {
  if (node.type === "text") return node.value ?? "";
  if (skipAnchors && isHeadingAnchor(node)) return "";

  return (node.children ?? []).map((child) => textContent(child, skipAnchors)).join("");
}

function isHeadingAnchor(node: HastNode): boolean {
  const className = node.properties?.["className"];
  return Array.isArray(className) && className.includes("heading-anchor");
}

/**
 * Words in the body, for the reading-time estimate.
 *
 * Headings, fenced code and inline code are excluded: a topic containing a code
 * block should not report a longer read than it actually is. Table pipes and
 * markdown emphasis characters are dropped so they do not split a word.
 */
export function countWords(markdown: string): number {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
  const withoutHeadings = withoutCode.replace(/^#{1,6}\s.*$/gm, " ");
  const withoutTables = withoutHeadings.replace(/^\s*\|.*\|\s*$/gm, " ");
  const plain = withoutTables
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links keep their text
    .replace(/[*_~>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return plain === "" ? 0 : plain.split(" ").length;
}
