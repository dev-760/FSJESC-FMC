import { isEnabled } from "./feature-flags";
import { simulatorUrl } from "./app-urls";

/**
 * Primary navigation.
 *
 * Feature flags are consulted here so a disabled surface has no navigation entry
 * at all, rather than a link that leads to a 404. This is presentation
 * convenience only — the flag is re-checked server-side on the route itself (N3).
 */
export interface NavItem {
  href: string;
  labelKey: string;
  label: string;
  description: string;
}

export interface NavSection {
  id: string;
  title: string;
  items: readonly NavItem[];
}

export const PRIMARY_NAV: readonly NavItem[] = [
  {
    href: "/about",
    labelKey: "nav.about",
    label: "About",
    description: "Who we are and how the club operates",
  },
  {
    href: "/education",
    labelKey: "nav.education",
    label: "Education",
    description: "Written material on markets, instruments and risk",
  },
  {
    href: simulatorUrl(),
    labelKey: "nav.simulator",
    label: "Simulator",
    description: "Paper-trading a fictional Moroccan market in MAD",
  },
  {
    href: "/competitions",
    labelKey: "nav.competitions",
    label: "Competitions",
    description: "Scenario challenges judged on return and risk",
  },
  {
    href: "/events",
    labelKey: "nav.events",
    label: "Events",
    description: "Workshops, lectures and discussion sessions",
  },
  {
    href: "/team",
    labelKey: "nav.team",
    label: "Team",
    description: "The students running the club",
  },
  {
    href: "/contact",
    labelKey: "nav.contact",
    label: "Contact",
    description: "How to reach us",
  },
];

export const FOOTER_NAV: readonly NavSection[] = [
  {
    id: "learn",
    title: "Learn",
    items: [
      {
        href: "/education",
        labelKey: "nav.education",
        label: "Education centre",
        description: "Topic library",
      },
      {
        href: "/education/topics",
        labelKey: "education.topics",
        label: "All topics",
        description: "Browse every published topic",
      },
    ],
  },
  {
    id: "practice",
    title: "Practise",
    items: [
      {
        href: simulatorUrl(),
        labelKey: "nav.simulator",
        label: "Paper-trading simulator",
        description: "Simulated orders and portfolios",
      },
      {
        href: "/competitions",
        labelKey: "nav.competitions",
        label: "Competitions",
        description: "Scenario challenges",
      },
    ],
  },
  {
    id: "club",
    title: "The club",
    items: [
      {
        href: "/about",
        labelKey: "nav.about",
        label: "About us",
        description: "Mission and method",
      },
      {
        href: "/team",
        labelKey: "nav.team",
        label: "Team",
        description: "Who runs the club",
      },
      {
        href: "/events",
        labelKey: "nav.events",
        label: "Events",
        description: "Sessions and registration",
      },
      {
        href: "/contact",
        labelKey: "nav.contact",
        label: "Contact",
        description: "Reach the club",
      },
    ],
  },
];

/** Navigation entries, filtered by feature flag. */
export function visiblePrimaryNav(): readonly NavItem[] {
  return PRIMARY_NAV.filter((item) => {
    if (item.href === simulatorUrl()) return isEnabled("SIMULATOR");
    if (item.href === "/competitions") return isEnabled("COMPETITIONS");
    return true;
  });
}
