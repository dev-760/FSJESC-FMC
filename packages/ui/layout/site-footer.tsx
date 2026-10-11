import Link from "next/link";
import { Container } from "./container";
import { FmcLogo } from "../brand/fmc-mark";
import { ThemeSwitcher } from "./theme-switcher";
import { FOOTER_NAV } from "@fsjesc/config/navigation";
import { SITE } from "@fsjesc/config/site";

/**
 * Site footer.
 *
 * Static Server Component shell with ThemeSwitcher client control.
 */
export function SiteFooter() {
  const year = SITE.foundingYear;

  return (
    <footer className="border-rule bg-surface-sunken mt-auto border-t">
      <Container size="wide" className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <FmcLogo variant="wordmark" height={32} alt={SITE.name} className="mb-3.5" />
            <p className="text-foreground-secondary max-w-sm text-sm leading-relaxed">
              A student-led academic platform for learning, researching, and simulating Moroccan and
              global financial markets at {SITE.campusShort}.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="border-rule bg-surface text-foreground-secondary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-medium">
                <span aria-hidden="true" className="bg-bull size-1.5 rounded-full" />
                <span>38 CSE Equities</span>
              </span>
              <span className="border-rule bg-surface text-foreground-secondary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-medium">
                <span>110 Total Instruments</span>
              </span>
              <span className="border-rule bg-surface text-foreground-secondary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-medium">
                <span>MAD Settlement</span>
              </span>
            </div>
          </div>

          {FOOTER_NAV.map((section) => (
            <nav key={section.id} aria-label={section.title}>
              <h2 className="label text-foreground font-semibold">{section.title}</h2>
              <ul className="mt-3.5 space-y-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-foreground-secondary hover:text-foreground focus-visible:outline-ring rounded-sm text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-rule bg-surface mt-10 rounded-xl border p-4 text-xs leading-relaxed text-foreground-secondary">
          <strong className="text-foreground font-semibold">
            Educational &amp; Simulated Environment Notice:
          </strong>{" "}
          All portfolios, order executions, market feeds, and balances on {SITE.shortName} are
          simulated in Moroccan dirhams (MAD) for academic instruction at {SITE.campus}. No real
          capital is accepted, held, or placed at risk. Nothing on this platform constitutes
          investment advice, brokerage services, or a solicitation to trade securities.
        </div>

        <div className="border-rule text-foreground-muted mt-6 flex flex-col gap-4 border-t pt-6 text-xs leading-relaxed sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name} · {SITE.campus}.
          </p>
          <div className="shrink-0">
            <ThemeSwitcher />
          </div>
        </div>
      </Container>
    </footer>
  );
}
