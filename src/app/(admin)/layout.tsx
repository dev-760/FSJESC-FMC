import type { Metadata } from "next";
import { AdminNav } from "@/components/layout/admin-nav";

/**
 * Layout for the administration section.
 *
 * Administration is a client-rendered, authenticated surface: every page under
 * `/admin` fetches its own data and guards itself, so the layout contributes
 * chrome only and deliberately adds no server-side data work that an
 * unauthenticated visitor would pay for.
 */
export const metadata: Metadata = {
  title: {
    default: "Administration",
    template: "%s | Administration",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <AdminNav />
      {children}
    </div>
  );
}