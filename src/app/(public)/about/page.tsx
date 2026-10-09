import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Container, Divider, Section, SectionHeading } from "@/components/layout/container";
import { DISC_3, SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "About the club",
  description:
    "The mission, method and academic standard of the FSJESC Financial Markets Club, a student association at FSJES Casablanca.",
  alternates: { canonical: "/about" },
};

/**
 * About page (Part 7.1).
 *
 * Static and fully prerenderable: it makes no claims that depend on current data,
 * and it does not describe any real market, data source, or partnership (N8).
 */
export default function AboutPage() {
  return (
    <main id="main-content" className="flex-1">
      <Container className="py-16">
        <SectionHeading
          as="h1"
          title="A student association for serious study of financial markets"
          lead={`${SITE.name} is a club at ${SITE.campus}. We teach market mechanics, we let members practise them without consequence, and we measure the results honestly.`}
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-10">
            <article>
              <h2 className="text-xl font-semibold tracking-tight">Why we exist</h2>
              <div className="text-foreground-secondary mt-4 space-y-4 text-base leading-relaxed">
                <p>
                  Most economics students meet financial markets as a chapter in a textbook: a
                  supply-and-demand curve, a volatility formula, and a sentence about risk aversion.
                  The mechanics that govern execution (how an order becomes a fill, why quoted prices
                  differ from achievable executions, and how a drawdown feels while unfolding) are
                  usually left implicit.
                </p>
                <p>
                  That gap is the reason the club exists. We run a written programme, a simulator
                  built on a documented price model, and scenario challenges that are scored on risk
                  as well as return. The aim is competence: a member who finishes a session can
                  explain what a number means, where it originated, and what limitations it carries.
                </p>
              </div>
            </article>

            <Divider />

            <article>
              <h2 className="text-xl font-semibold tracking-tight">How we work</h2>
              <div className="text-foreground-secondary mt-4 space-y-4 text-base leading-relaxed">
                <p>
                  Our programme has three parts that reinforce each other. Education supplies the
                  concepts and the vocabulary. The simulator supplies practice with immediate,
                  permanent consequences. Challenges supply the pressure of a deadline and a
                  measured outcome.
                </p>
                <p>
                  Everything a member does in the simulator is recorded and cannot be edited. That
                  constraint is deliberate. Research only means something if the record underneath
                  it cannot be quietly improved.
                </p>
              </div>
            </article>

            <Divider />

            <article>
              <h2 className="text-xl font-semibold tracking-tight">What we do not do</h2>
              <div className="text-foreground-secondary mt-4 space-y-4 text-base leading-relaxed">
                <p>
                  Being explicit about the limits of a project is part of teaching statistics
                  honestly, so the following are stated plainly rather than left to be discovered.
                </p>
                <ul className="space-y-3">
                  {[
                    "We do not connect to any exchange, broker, or market data vendor. There is no live feed and no real trading.",
                    "We do not offer investment advice, recommendations, or personalised guidance of any kind.",
                    "We do not sell, buy, or hold real financial instruments, and no member of the club holds club funds in any market.",
                    "We do not present simulated performance as evidence about real markets. A result in the simulator describes a fictional world.",
                    "We do not collect more personal data than an account and a profile require, and we do not run third-party tracking.",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        aria-hidden
                        className="bg-accent mt-2.5 size-1.5 shrink-0 rounded-full"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <Divider />

            <article>
              <h2 className="text-xl font-semibold tracking-tight">Membership &amp; access</h2>
              <div className="text-foreground-secondary mt-4 space-y-4 text-base leading-relaxed">
                <p>
                  Any student of the faculty can create an account and use the education centre, the
                  simulator, competitions and event registration. Membership is granted by a club
                  executive and adds member-only material, responsibility for parts of the
                  programme, and access to planning meetings.
                </p>
                <p>
                  Members take on real work: curating and reviewing topics, designing scenarios,
                  computing and presenting competition analytics, and running sessions. The standard
                  is academic. In exchange, members shape the programme rather than consuming it.
                </p>
              </div>
            </article>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card padding="lg">
              <CardHeader>
                <CardTitle>At a glance</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4 text-sm">
                  {[
                    ["Founded", "Academic year 2025-2026"],
                    ["Home", SITE.campusShort],
                    ["Language", "Instruction and material in English and French"],
                    ["Currency", "Moroccan dirham (MAD), simulated"],
                    ["Programme", "Sessions, publications, simulator, challenges"],
                    ["Open to", "All students of the faculty"],
                  ].map(([term, detail]) => (
                    <div key={term}>
                      <dt className="text-2xs text-foreground-muted font-semibold tracking-wide uppercase">
                        {term}
                      </dt>
                      <dd className="text-foreground mt-0.5">{detail}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Alert tone="information" title="About the simulation">
              <p>
                Prices are generated by a deterministic model, documented in full in our market
                simulation notes. The same input always produces the same price on every machine,
                which is what makes a classroom discussion of results possible.
              </p>
              <p className="mt-2">{DISC_3}</p>
            </Alert>

            <Card padding="lg">
              <CardHeader>
                <CardTitle>Next steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild fullWidth variant="secondary">
                  <Link href="/education">Read the education centre</Link>
                </Button>
                <Button asChild fullWidth variant="secondary">
                  <Link href="/events">Attend a session</Link>
                </Button>
                <Button asChild fullWidth>
                  <Link href="/create-account">Create an account</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </Container>

      <Section contained={false} className="border-rule bg-surface-raised border-t">
        <Container size="prose">
          <h2 className="text-xl font-semibold tracking-tight">Common questions</h2>
          <dl className="divide-rule mt-6 divide-y">
            {[
              [
                "Is the simulator connected to a real market?",
                "No. There is no exchange connection, no data vendor, and no live feed. Prices come from a model we publish the specification of.",
              ],
              [
                "Can I lose real money here?",
                "No. There is no mechanism to move value off the platform. Simulated capital exists only as a ledger balance.",
              ],
              [
                "Is the analysis investment advice?",
                "No. Statistics shown in the simulator are educational metrics computed from your own simulated activity.",
              ],
              [
                "Do I need prior experience?",
                "No. The education programme is written to be read from the beginning, and introductory sessions run each year for new members.",
              ],
              [
                "What data do you hold about me?",
                "An account (email, password hash) and an optional profile (name, and optionally a student ID and academic track). Nothing else is required, and there is no third-party tracking.",
              ],
            ].map(([question, answer]) => (
              <div key={question} className="py-5">
                <dt className="text-foreground text-sm font-medium">{question}</dt>
                <dd className="text-foreground-secondary mt-2 text-sm leading-relaxed">{answer}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>
    </main>
  );
}
