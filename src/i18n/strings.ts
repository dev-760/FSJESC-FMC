/**
 * Keyed string catalogue (Part 9.5).
 *
 * Initial locale is English. French and Arabic can be added as sibling records
 * without touching a single component: components read `t("nav.home")`, never a
 * literal. The shape is a flat key→string map so it can be machine-translated and
 * so a missing key in a future locale is a type error rather than a blank UI.
 *
 * Direction readiness: `LocaleConfig.direction` already exists and the root layout
 * reads `dir` from it, so adding Arabic requires only a new locale record, not a
 * layout rewrite (Part 9.5).
 */

export const LOCALES = ["en"] as const;
export type Locale = (typeof LOCALES)[number];

export interface LocaleConfig {
  code: Locale;
  htmlLang: string;
  dir: "ltr" | "rtl";
  label: string;
  intlLocale: string;
  timeZone: string;
}

export const LOCALE_CONFIG: Record<Locale, LocaleConfig> = {
  en: {
    code: "en",
    htmlLang: "en",
    dir: "ltr",
    label: "English",
    intlLocale: "fr-MA",
    timeZone: "Africa/Casablanca",
  },
};

/**
 * String keys. Grouped by surface. Values are English source strings.
 */
export const STRINGS = {
  /* ── Navigation ─────────────────────────────────────────────────────── */
  "nav.home": "Home",
  "nav.about": "About",
  "nav.team": "Team",
  "nav.events": "Events",
  "nav.education": "Education",
  "nav.simulator": "Simulator",
  "nav.competitions": "Competitions",
  "nav.contact": "Contact",
  "nav.dashboard": "Dashboard",
  "nav.admin": "Administration",
  "nav.executive": "Executive",
  "nav.profile": "Profile",
  "nav.signIn": "Sign in",
  "nav.signOut": "Sign out",
  "nav.signUp": "Create account",
  "nav.openMenu": "Open navigation menu",
  "nav.closeMenu": "Close navigation menu",
  "nav.primary": "Primary",
  "nav.account": "Account",
  "nav.skipToContent": "Skip to main content",

  /* ── Common actions ─────────────────────────────────────────────────── */
  "action.cancel": "Cancel",
  "action.confirm": "Confirm",
  "action.review": "Review",
  "action.back": "Back",
  "action.continue": "Continue",
  "action.retry": "Try again",
  "action.close": "Close",
  "action.save": "Save",
  "action.delete": "Delete",
  "action.edit": "Edit",
  "action.create": "Create",
  "action.submit": "Submit",
  "action.loading": "Loading…",
  "action.viewAll": "View all",
  "action.viewDetails": "View details",
  "action.refresh": "Refresh",
  "action.copy": "Copy",
  "action.copied": "Copied",

  /* ── Generic UI ─────────────────────────────────────────────────────── */
  "ui.loading": "Loading",
  "ui.error": "Something went wrong",
  "ui.notFound": "Page not found",
  "ui.notFoundDescription": "The page you are looking for does not exist, or it has moved.",
  "ui.empty": "Nothing here yet",
  "ui.required": "Required",
  "ui.optional": "Optional",
  "ui.yes": "Yes",
  "ui.no": "No",
  "ui.all": "All",
  "ui.none": "None",
  "ui.previous": "Previous",
  "ui.next": "Next",
  "ui.page": "Page",
  "ui.theme": "Theme",
  "ui.themeLight": "Light",
  "ui.themeDark": "Dark",
  "ui.themeSystem": "System",
  "ui.sortBy": "Sort by",

  /* ── Authentication ─────────────────────────────────────────────────── */
  "auth.signInTitle": "Sign in",
  "auth.signInSubtitle": "Access your simulated portfolio, competitions and education history.",
  "auth.signUpTitle": "Create your account",
  "auth.signUpSubtitle":
    "Join the club's education and paper-trading environment. No real money is involved at any point.",
  "auth.email": "Email address",
  "auth.password": "Password",
  "auth.confirmPassword": "Confirm password",
  "auth.fullName": "Full name",
  "auth.studentId": "Student ID (optional)",
  "auth.academicTrack": "Academic track (optional)",
  "auth.rememberMe": "Keep me signed in",
  "auth.forgotPassword": "Forgot your password?",
  "auth.noAccount": "Don't have an account?",
  "auth.hasAccount": "Already have an account?",
  "auth.passwordHint": "At least 12 characters.",
  "auth.passwordMismatch": "The two passwords do not match.",
  "auth.signingIn": "Signing in…",
  "auth.creatingAccount": "Creating account…",
  "auth.sessionExpired": "Your session has expired. Please sign in again.",
  "auth.signOutConfirm": "Sign out of your account?",
  "auth.resetTitle": "Reset your password",
  "auth.resetSubtitle": "Enter your email address and we will send a reset link.",
  "auth.resetSent": "If that address has an account, a reset link is on its way.",
  "auth.resetNewPassword": "Choose a new password",
  "auth.verifyTitle": "Verify your email address",
  "auth.verifyPending": "We sent a verification link to your email address.",
  "auth.verifyResend": "Send the link again",

  /* ── Simulator ──────────────────────────────────────────────────────── */
  "simulator.title": "Paper-trading simulator",
  "simulator.portfolioValue": "Portfolio value",
  "simulator.cash": "Available cash",
  "simulator.invested": "Invested",
  "simulator.todayPnl": "Today's change",
  "simulator.totalReturn": "Total return",
  "simulator.realizedPnl": "Realized profit and loss",
  "simulator.unrealizedPnl": "Unrealized profit and loss",
  "simulator.openPositions": "Open positions",
  "simulator.pendingOrders": "Pending orders",
  "simulator.recentExecutions": "Recent executions",
  "simulator.market": "Market",
  "simulator.asset": "Asset",
  "simulator.price": "Price",
  "simulator.change": "Change",
  "simulator.volume": "Volume",
  "simulator.quantity": "Quantity",
  "simulator.side": "Side",
  "simulator.orderType": "Order type",
  "simulator.limitPrice": "Limit price",
  "simulator.estimatedValue": "Estimated value",
  "simulator.estimatedFees": "Estimated fees",
  "simulator.estimatedTotal": "Estimated total",
  "simulator.buy": "Buy",
  "simulator.sell": "Sell",
  "simulator.marketOrder": "Market order",
  "simulator.limitOrder": "Limit order",
  "simulator.reviewOrder": "Review order",
  "simulator.confirmOrder": "Confirm and place order",
  "simulator.orderPlaced": "Order placed",
  "simulator.orderCancelled": "Order cancelled",
  "simulator.cancelOrder": "Cancel order",
  "simulator.avgPrice": "Average price",
  "simulator.marketValue": "Market value",
  "simulator.weight": "Weight",
  "simulator.noPositions": "You hold no positions yet",
  "simulator.noPositionsHint":
    "Open the market view and place a market order to acquire a position.",
  "simulator.noOrders": "You have not placed any orders yet",
  "simulator.noOrdersHint": "Orders you place will appear here with their current status.",
  "simulator.noTransactions": "No ledger entries yet",
  "simulator.noTransactionsHint": "Deposits, trades and fees are recorded here permanently.",
  "simulator.slideToConfirm": "Review before submitting — nothing executes until you confirm.",

  /* ── Competitions ───────────────────────────────────────────────────── */
  "competitions.title": "Competitions",
  "competitions.join": "Join competition",
  "competitions.joined": "Joined",
  "competitions.leaderboard": "Leaderboard",
  "competitions.rank": "Rank",
  "competitions.participant": "Participant",
  "competitions.returnPercent": "Return",
  "competitions.maxDrawdown": "Max drawdown",
  "competitions.startingCash": "Starting capital",
  "competitions.rules": "Rules",
  "competitions.scoring": "Scoring methodology",
  "competitions.registerOpen": "Registration open",
  "competitions.registerClosed": "Registration closed",
  "competitions.status": "Status",

  /* ── Education ──────────────────────────────────────────────────────── */
  "education.title": "Financial education",
  "education.topics": "Topics",
  "education.categories": "Categories",
  "education.readingTime": "Reading time",
  "education.relatedTopics": "Related topics",
  "education.onThisPage": "On this page",
  "education.publishedOn": "Published",
  "education.noTopics": "No topics published yet",

  /* ── Events ─────────────────────────────────────────────────────────── */
  "events.title": "Events",
  "events.upcoming": "Upcoming events",
  "events.pastEvents": "Past events",
  "events.register": "Register",
  "events.unregister": "Cancel registration",
  "events.registered": "You are registered",
  "events.capacity": "Capacity",
  "events.spotsLeft": "spots left",
  "events.full": "Full",
  "events.location": "Location",
  "events.format": "Format",
  "events.noEvents": "No events scheduled",
  "events.noEventsHint": "Check back soon for the next workshop or discussion session.",

  /* ── Administration ─────────────────────────────────────────────────── */
  "admin.title": "Administration",
  "admin.overview": "Overview",
  "admin.users": "Users",
  "admin.events": "Events",
  "admin.articles": "Articles",
  "admin.assets": "Assets",
  "admin.competitions": "Competitions",
  "admin.orders": "Orders",
  "admin.system": "System",
  "admin.role": "Role",
  "admin.grantMember": "Grant member role",
  "admin.revokeMember": "Revoke member role",
  "admin.confirmDestructive": "This action cannot be undone. Confirm to continue.",
  "admin.readOnly": "Read-only",

  /* ── Errors ─────────────────────────────────────────────────────────── */
  "error.title": "Something went wrong",
  "error.description": "An unexpected error occurred. Our team has been notified.",
  "error.notFoundTitle": "Page not found",
  "error.notFoundDescription": "The page you requested does not exist.",
  "error.backHome": "Back to home",
} as const;

export type StringKey = keyof typeof STRINGS;

export type StringCatalogue = Record<StringKey, string>;

/**
 * Resolve a key. Typed against `StringKey` so a typo is a compile error rather
 * than a blank label at runtime.
 */
export function t(key: StringKey, catalogue: StringCatalogue = STRINGS): string {
  return catalogue[key];
}

/**
 * Placeholder interpolation. `{name}` style, resolved from a values record.
 * Values are inserted verbatim into already-trusted, developer-authored strings.
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}
