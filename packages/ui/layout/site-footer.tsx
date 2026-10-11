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
      <Container size="wide" className="py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FmcLogo variant="wordmark" height={30} alt={SITE.name} className="mb-3" />
            <p className="text-foreground-secondary max-w-xs text-sm leading-relaxed">
              A student-led platform for learning, researching and simulating financial markets at{" "}
              {SITE.campusShort}.
            </p>
          </div>

          {FOOTER_NAV.map((section) => (
            <nav key={section.id} aria-label={section.title}>
              <h2 className="label">{section.title}</h2>
              <ul className="mt-3 space-y-1.5">
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

        <div className="border-rule text-foreground-muted mt-10 border-t pt-6 text-xs leading-relaxed flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p>
              © {year} {SITE.name}. {SITE.campus}.
            </p>
            <p className="mt-2 max-w-3xl">
              Educational project. All portfolios, order executions and balances are simulated in
              Moroccan dirhams (MAD) with no real money at risk. Nothing on this platform is
              investment advice, a recommendation, or a solicitation to trade.
            </p>
          </div>
          <div className="shrink-0">
            <ThemeSwitcher />
          </div>
        </div>
      </Container>
    </footer>
  );
}
