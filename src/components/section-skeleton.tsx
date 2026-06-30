"use client";

/**
 * Shared loading skeleton for lazy-loaded tab sections.
 * Uses the `.skeleton` shimmer animation from globals.css.
 */
export function SectionSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="space-y-3">
        <div className="skeleton h-10 w-72 rounded-lg" />
        <div className="skeleton h-5 w-96 rounded-lg" />
      </div>
      <div className="skeleton h-64 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
      <div className="skeleton h-48 rounded-2xl" />
    </section>
  );
}
