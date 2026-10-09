import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Container, SectionHeading } from "@/components/layout/container";
import { TEAM_GROUPS, sortedTeamMembers, type TeamMember } from "@/data/team";

export const metadata: Metadata = {
  title: "Team",
  description:
    "The students who run the FSJESC Financial Markets Club: executives, research leads, and the technical and events teams.",
  alternates: { canonical: "/team" },
};

/**
 * Team page (Part 7.9).
 *
 * The page states plainly that the listed entries are structural placeholders
 * rather than real individuals. Inventing names, credentials, affiliations or
 * professional histories for people who do not exist would be exactly the kind of
 * fabrication the specification forbids (Part 0.4, N8). Phase 10 replaces these
 * with executive-managed records.
 */
export default function TeamPage() {
  const members = sortedTeamMembers();

  return (
    <main id="main-content" className="flex-1">
      <Container className="py-16">
        <SectionHeading
          as="h1"
          title="Who runs the club"
          lead="The club is run entirely by students. Positions are elected or appointed for the academic year and carry responsibility for a specific part of the programme."
        />

        <Alert tone="warning" title="Placeholder content" className="mt-10">
          <p>
            The entries below demonstrate the structure the team page renders. They are not
            individuals and they are not club biographies. Executive-managed profiles replace them
            before this page is used publicly.
          </p>
        </Alert>

        <div className="mt-12 space-y-14">
          {TEAM_GROUPS.map((group, index) => {
            const slice = members.slice(index * 2, index * 2 + 2);
            if (slice.length === 0) return null;
            return (
              <section key={group.id} aria-labelledby={`group-${group.id}`}>
                <h2 id={`group-${group.id}`} className="text-lg font-semibold tracking-tight">
                  {group.title}
                </h2>
                <p className="text-foreground-secondary mt-1 text-sm">{group.description}</p>
                <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                  {slice.map((member) => (
                    <li key={member.id}>
                      <TeamCard member={member} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <Card padding="lg" className="mt-16">
          <CardHeader>
            <CardTitle>Joining the team</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground-secondary text-sm leading-relaxed">
              Team positions open at the start of each academic year and are announced to members.
              Responsibility for a part of the programme (a topic series, a scenario, a session, or
              a part of the platform) is the way members take part. Contact the club if you would
              like to be told when positions open.
            </p>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <Card className="h-full" padding="lg">
      <div className="flex items-start gap-4">
        <Avatar name={member.name} avatarUrl={member.avatarUrl} />
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">{member.name}</CardTitle>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge tone="accent">{member.role}</Badge>
          </div>
          <p className="text-foreground-secondary mt-2.5 text-xs">{member.academicTrack}</p>
        </div>
      </div>
      <p className="text-foreground-secondary mt-4 text-sm leading-relaxed">{member.bio}</p>
      {member.linkedinUrl ? (
        <Link
          href={member.linkedinUrl}
          rel="noopener noreferrer nofollow"
          target="_blank"
          className="text-accent-text mt-4 inline-block text-sm underline underline-offset-4"
        >
          LinkedIn profile
          <span className="sr-only"> for {member.name} (opens in a new tab)</span>
        </Link>
      ) : null}
    </Card>
  );
}

/**
 * Avatar.
 *
 * When no image is available, initials are rendered as text. That is legible,
 * needs no asset, and never implies a photograph of a person who does not exist.
 */
function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    /*
     * A member avatar is a runtime, user-supplied URL from an executive-managed
     * profile, not a build-time asset. `next/image` would require an allowlist of
     * hosts for images this platform does not control, so these are plain `img`
     * elements with explicit dimensions to reserve layout space.
     */
    /* eslint-disable @next/next/no-img-element -- runtime user-supplied URL, see above */
    return (
      <img
        src={avatarUrl}
        alt=""
        width={56}
        height={56}
        loading="lazy"
        decoding="async"
        className="border-rule size-14 shrink-0 rounded-full border object-cover"
      />
    );
    /* eslint-enable @next/next/no-img-element */
  }

  return (
    <div
      aria-hidden="true"
      className="numeric border-rule-strong bg-surface-raised text-foreground-secondary flex size-14 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"
    >
      {initialsOf(name)}
    </div>
  );
}

function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const first = words[0]?.charAt(0) ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase();
}
