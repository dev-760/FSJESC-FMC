/**
 * Where the other apps live.
 *
 * Each app is served from its own port in development and its own subdomain in
 * production, so any link that crosses an app boundary needs an absolute URL.
 * A relative `/market` on the landing app would 404.
 *
 * Both helpers fall back to the local development ports, so nothing here needs
 * configuring for `pnpm dev` to work. `NEXT_PUBLIC_*` overrides cover deployment.
 */

/** The public site. */
const DEFAULT_LANDING_ORIGIN = "http://localhost:3000";

/** The simulator, which never shares an origin with the landing app in dev. */
const DEFAULT_SIMULATOR_ORIGIN = "http://localhost:3002";

/** An explicit absolute origin (scheme + host) means the app is cross-origin. */
function isAbsolute(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function simulatorOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_SIMULATOR_URL ?? process.env.SIMULATOR_URL;
  if (!configured) return null;
  return isAbsolute(configured) ? configured.replace(/\/$/, "") : null;
}

/**
 * True when the simulator is served from the *same* origin as the current app.
 *
 * In a reverse-proxy deployment `NEXT_PUBLIC_SIMULATOR_URL` is simply unset:
 * `simulator.fsjes.ma` routes to the simulator, so relative links are correct
 * and preferred. Only an explicit `http(s)://` value means the apps are split
 * across origins, which is the development case.
 *
 * When unset, this falls back to false rather than guessing: the cost of
 * guessing wrong is a link that silently 404s in production.
 */
export function isSimulatorSameOrigin(): boolean {
  const configured = process.env.NEXT_PUBLIC_SIMULATOR_URL ?? process.env.SIMULATOR_URL;
  if (!configured) return false; // unset -> assume split origins; safe default
  return !isAbsolute(configured);
}

/** Absolute URL into the public site. */
export function landingUrl(path = ""): string {
  return join(process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_LANDING_ORIGIN, path);
}

/**
 * URL into the simulator app.
 *
 * Returns a relative path when the simulator shares this origin, which keeps
 * client-side navigation working and lets the app run behind any host.
 */
export function simulatorUrl(path = ""): string {
  const suffix = path && path !== "/" ? `/${path.replace(/^\//, "")}` : "";

  if (isSimulatorSameOrigin()) return suffix || "/";

  return join(simulatorOrigin() ?? DEFAULT_SIMULATOR_ORIGIN, suffix);
}

function join(origin: string, path: string): string {
  const base = origin.replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}/${path.replace(/^\//, "")}`;
}