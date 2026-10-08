/**
 * Club content (Part 3.4).
 *
 * Demo and editorial content lives in `src/data/`, never inline in a component.
 * Every record is clearly labelled as illustrative project content: no fabricated
 * credentials, affiliations, awards, or professional claims (Part 0.4, N8).
 *
 * Phase 5 replaces this file with database-backed content for events, while
 * team profiles and static editorial content remain file-backed.
 */

export interface TeamMember {
  id: string;
  name: string;
  /** Club position, e.g. "Treasurer". Not a professional title. */
  role: string;
  academicTrack: string;
  bio: string;
  /** Relative path to an avatar in `public/`, or null for the initials placeholder. */
  avatarUrl: string | null;
  linkedinUrl: string | null;
  /** Ordering weight for the grid. */
  order: number;
}

/**
 * Placeholder team entries.
 *
 * These are structural examples showing the shape the team page renders, not
 * claims about real individuals. They are replaced by executive-managed records
 * in Phase 10, and the page states as much where they appear.
 */
export const TEAM_MEMBERS: readonly TeamMember[] = [
  {
    id: "president",
    name: "Club President",
    role: "President",
    academicTrack: "Public Finance and Economics",
    bio: "Coordinates the club's academic programme and represents it within the faculty.",
    avatarUrl: null,
    linkedinUrl: null,
    order: 1,
  },
  {
    id: "vice-president",
    name: "Club Vice-President",
    role: "Vice-President",
    academicTrack: "Management and Finance",
    bio: "Supports programme delivery and liaises with student associations.",
    avatarUrl: null,
    linkedinUrl: null,
    order: 2,
  },
  {
    id: "treasurer",
    name: "Club Treasurer",
    role: "Treasurer",
    academicTrack: "Accounting and Finance",
    bio: "Maintains the club's records and oversees event budgets.",
    avatarUrl: null,
    linkedinUrl: null,
    order: 3,
  },
  {
    id: "research-lead",
    name: "Research Lead",
    role: "Head of Research",
    academicTrack: "Applied Economics",
    bio: "Leads the education programme and reviews published research notes.",
    avatarUrl: null,
    linkedinUrl: null,
    order: 4,
  },
  {
    id: "simulator-lead",
    name: "Simulator Lead",
    role: "Head of the Trading Simulator",
    academicTrack: "Financial Markets",
    bio: "Designs scenario challenges and maintains the simulated market model.",
    avatarUrl: null,
    linkedinUrl: null,
    order: 5,
  },
  {
    id: "events-lead",
    name: "Events Lead",
    role: "Head of Events",
    academicTrack: "Economics",
    bio: "Organises workshops, lectures and discussion sessions.",
    avatarUrl: null,
    linkedinUrl: null,
    order: 6,
  },
  {
    id: "outreach-lead",
    name: "Outreach Lead",
    role: "Head of Outreach",
    academicTrack: "Economics and Management",
    bio: "Runs introductory sessions for new members each academic year.",
    avatarUrl: null,
    linkedinUrl: null,
    order: 7,
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    role: "Data and Analytics",
    academicTrack: "Statistics and Data Science",
    bio: "Builds the analytics that accompany competitions and review metrics.",
    avatarUrl: null,
    linkedinUrl: null,
    order: 8,
  },
];

/** Academic tracks a member can select. Kept as data so both site and admin use one list. */
export const ACADEMIC_TRACKS = [
  "Public Finance and Economics",
  "Management and Finance",
  "Applied Economics",
  "Accounting and Finance",
  "Financial Markets",
  "Economics and Management",
  "Statistics and Data Science",
  "Law and Economics",
  "Other",
] as const;

export type AcademicTrack = (typeof ACADEMIC_TRACKS)[number];

/** Team sections the about page and team page share. */
export const TEAM_GROUPS = [
  {
    id: "leadership",
    title: "Leadership",
    description: "Executive roles held for the academic year.",
  },
  {
    id: "research",
    title: "Research and education",
    description: "Curating the education programme.",
  },
  { id: "technical", title: "Technical", description: "Building and maintaining the platform." },
  {
    id: "outreach",
    title: "Outreach and events",
    description: "Sessions, workshops and faculty liaison.",
  },
] as const;

export function sortedTeamMembers(): TeamMember[] {
  return [...TEAM_MEMBERS].sort((a, b) => a.order - b.order);
}
