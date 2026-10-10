/**
 * Skip-to-content link (Part 9.3 — WCAG 2.2 AA).
 *
 * The first focusable element on every page. Visually hidden until focused,
 * which is why the styling lives in globals.css (`.skip-link`).
 */
export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a href={`#${targetId}`} className="skip-link text-accent-text text-sm font-medium">
      Skip to main content
    </a>
  );
}
