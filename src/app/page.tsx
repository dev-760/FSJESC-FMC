import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Foundation</h1>
      <p className="text-foreground-secondary mt-2">Public website content lands in Phase 2.</p>
    </main>
  );
}
