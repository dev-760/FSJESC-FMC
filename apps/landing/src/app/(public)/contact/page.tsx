import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@fsjesc/ui/alert";
import { Button } from "@fsjesc/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@fsjesc/ui/card";
import { Container, Section, SectionHeading } from "@fsjesc/ui/layout/container";
import { ContactForm } from "@fsjesc/ui/forms/contact-form";
import { ACADEMIC_TRACKS } from "@fsjesc/domain/team";
import { parseContactResult } from "@fsjesc/domain/education/contact";
import { SITE } from "@fsjesc/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${SITE.shortName}: email, on-campus presence, and answers to common questions.`,
  alternates: { canonical: "/contact" },
};

/**
 * Contact page (Part 7.1).
 *
 * The form posts to a Server Action that validates with Zod. The page reads the
 * submission result from `searchParams`, so `searchParams` is request-bound and
 * the route is dynamically rendered — which is correct here, and the only public
 * route where it happens.
 */
export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const params = await searchParams;
  const { status, fields } = parseContactResult(params);

  return (
    <main id="main-content" className="flex-1">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <SectionHeading
            as="h1"
            title="Get in touch"
            lead="Questions about the programme, the simulator, or a collaboration are all welcome. We read everything and reply as a group."
          />

          <div className="space-y-6">
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Send a message</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactForm status={status} invalidFields={fields} />
              </CardContent>
            </Card>

            <Alert tone="information" title="Direct email & server-validated inquiries">
              <p>
                Submissions are validated server-side and logged for the executive committee. For
                urgent or time-sensitive inquiries, you can also email us directly at{" "}
                <a
                  href={`mailto:${SITE.contactEmail}`}
                  className="numeric text-accent-text underline underline-offset-4"
                >
                  {SITE.contactEmail}
                </a>
                .
              </p>
            </Alert>
          </div>
        </div>

        <Section contained={false} spacing="loose">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Email</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={`mailto:${SITE.contactEmail}`}
                  className="numeric text-accent-text focus-visible:outline-ring rounded text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {SITE.contactEmail}
                </a>
                <p className="text-foreground-secondary mt-3 text-sm leading-relaxed">
                  General enquiries. For anything account-specific, include your email address so we
                  can identify the account.
                </p>
              </CardContent>
            </Card>

            <Card padding="lg">
              <CardHeader>
                <CardTitle>Campus presence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-sm">{SITE.campus}</p>
                <p className="text-foreground-secondary mt-3 text-sm leading-relaxed">
                  We hold sessions and office hours on campus. Announcements go to members before
                  each academic year begins.
                </p>
              </CardContent>
            </Card>

            <Card padding="lg">
              <CardHeader>
                <CardTitle>Before you write</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-foreground-secondary space-y-2 text-sm">
                  {[
                    "Simulator rules and fee behaviour are covered in the education centre.",
                    "Competition scoring is documented on each competition page.",
                    "Account problems are best handled through the password-reset flow.",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden className="bg-accent mt-2 size-1.5 shrink-0 rounded-full" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="ghost" size="sm" className="mt-4 px-0">
                  <Link href="/education">Open the education centre</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section contained={false}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Topics we can help with</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground-secondary text-sm leading-relaxed">
                A request for a session is more useful when it names the topic, the level, and the
                time you have available. Useful starting points for the economics programme include:
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {ACADEMIC_TRACKS.map((track) => (
                  <li
                    key={track}
                    className="border-rule bg-surface-raised text-foreground-secondary rounded border px-2 py-1 text-xs"
                  >
                    {track}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Section>
      </Container>
    </main>
  );
}
