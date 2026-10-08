import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isEnabled } from "@/config/feature-flags";

/**
 * Account affordances in the header.
 *
 * Phase 2 (pre-authentication): signed-out visitors see sign-in and registration.
 * Phase 4 replaces the body with a session-aware menu; the surrounding contract —
 * a small fragment placed by the layout — stays identical, so the header does not
 * change when sessions land.
 *
 * This is a Server Component. It reads no request data, so it stays inside the
 * prerendered shell under Cache Components (D1). The authenticated variant will
 * live behind `<Suspense>` once it reads cookies.
 */
export function AccountSlot() {
  if (!isEnabled("REGISTRATION")) {
    return (
      <Button asChild size="sm" variant="secondary">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="ghost">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/create-account">Create account</Link>
      </Button>
    </div>
  );
}
