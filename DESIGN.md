# Design system

<!-- impeccable:design-schema 1 -->

The visual world of the FSJESC Financial Markets Club platform.

**One line:** a research terminal for students — dense, exacting, and legible under fluorescent light on a laptop in a seminar room.

Product truth lives in [`PRODUCT.md`](./PRODUCT.md). This file records only what the built interface actually does.

---

## The governing idea

A terminal's job is to make a quantity legible at a glance and traceable to its source. That is also this product's job: a student must be able to read a figure and ask where it came from.

Every structural decision follows from that. Panels are separated by hairlines rather than boxes, because a rule is structure and a box is decoration. Figures are set in a monospaced face on a shared column so a column of digits can be scanned vertically. The first screen of a market page is a **board**, not a pitch, because that is what a terminal opens with.

The world this replaced was a card grid: identical rounded boxes floating in whitespace, each holding an icon, a heading and a paragraph. It was legible and it communicated nothing. Nothing about it said _research_.

---

## Colour

Semantic tokens only. A colour is chosen for what it means, never for decoration.

| Token                         | Meaning                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `--accent`                    | Interactive and brand. A deep institutional blue.                       |
| `--positive` / `--negative`   | Direction of a signed value.                                            |
| `--warning`                   | "Read this before relying on it" — simulation markers, honesty notices. |
| `--information` / `--neutral` | Non-directional emphasis and chrome.                                    |
| `--series-1..5`               | Chart series, ordered for a reader who cannot rely on hue alone.        |

Three surfaces (`--canvas`, `--surface`, `--surface-sunken`) and three rules (`--rule-hairline`, `--rule`, `--rule-strong`). No more. Depth comes from surface difference and hairline, never from a shadow on a panel.

**Both themes are contrast-checked for WCAG 2.2 AA** — body text ≥ 4.5:1, large text and component boundaries ≥ 3:1. Dark mode is not an inversion; it is a separate set of values, because an inverted blue fails contrast.

**Colour is never the sole carrier of meaning.** A signed figure states its sign in text and carries a direction glyph. Tone always accompanies a label.

## Type

**IBM Plex Sans** for interface and prose, **IBM Plex Mono** for every figure, label and instrument code. Both self-hosted through `next/font`. Pinned by the product brief.

Mono is not a costume for "technical". It is used where alignment _is_ the meaning: prices, quantities, percentages, dates, tickers, and column heads. Prose is never set in it.

A real scale with steps between a 13px label and a 30px heading, because the earlier two-body-size scale made every section look the same weight. Headings carry their own weight — **no kicker or eyebrow above a heading anywhere on the platform**; a small tracked mono label sits above a table or beside a figure, annotating content, never introducing a title.

Body copy holds a 68ch measure via `.measure`, applied deliberately rather than globally — a blanket `max-width` on `p` also constrains text inside panels, which is how alert and table copy ends up ragged.

## Space and structure

A 4px-based scale. One rhythm throughout, with more space above a heading than below it.

Structural devices, in order of use: hairline rule, then surface difference, then gutter. Cards exist only where a discrete object is genuinely being grouped — a dashboard tile, a dialog. They are never used as a page's layout.

## Radius and elevation

Panels and controls are 8px; larger panels are 14px. Pills are reserved for small controls.

**Elevation is declared once.** A panel carries a hairline and no shadow — a 1px border under a wide soft shadow is a ghost card. `--shadow-float` exists for things that genuinely sit above the page: dialogs and popovers.

## Components

| Component         | Notes                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `QuoteBoard`      | The thesis, rendered. Ticker · instrument · sector · price · change · modelled vol · drift. Responsive card fallback below `md`. |
| `RuledList`       | The terminal's replacement for a card grid. Term/detail pairs separated by hairlines; 1 or 2 columns.                            |
| `Table`           | Dense. Tracked mono column heads, tabular numerals, right-aligned numeric columns, caption below.                                |
| `DataTable`       | The same rows reflowed into cards on mobile — never a shrunken desktop table.                                                    |
| `ChangeIndicator` | Sign + direction glyph + colour, always all three.                                                                               |
| `Alert`           | Icon and text label alongside tone. `role="alert"` for blocking errors, `role="status"` for everything else.                     |
| `Badge`           | Square-cornered, tracked, always paired with text.                                                                               |
| `Button`          | Six variants, no glow, no scale-on-hover. Hover changes surface colour and nothing else.                                         |

## Motion

**One authored moment.** The quote board's rows settle in sequence on load — 420ms, exponential ease-out, staggered 45ms — like a terminal painting a frame. Nothing else on the platform moves. No scroll reveals, no hover lifts.

Fully disabled under `prefers-reduced-motion`, where the rows are simply present.

## Browser surfaces

Selection, caret, scrollbars, focus rings, and underline offset are themed from the palette. These ship with browser defaults that belong to no design system, and theming them is the cheapest signal that a page was built rather than assembled.

## Voice

Calm and analytical. Controls name their action; errors name the problem and the recovery. Never promotional. Where a page makes a claim, it states its limits in the same visual neighbourhood, not in a footer.

## What this system will not do

- Eyebrows above headings.
- Identical card grids as page structure.
- Gradients, glass, or blur used as decoration.
- Shadows on panels.
- A KPI row of big numbers as a page's argument.
- Colour carrying meaning alone.
- Monospace as a costume.
- Emoji as an icon system.
- Illustration that carries no information.
