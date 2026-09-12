"use client";

import dynamic from "next/dynamic";

const HomeRecentQRs = dynamic(
  () =>
    import("@/features/home/home-recent-qrs").then((mod) => mod.HomeRecentQRs),
  { ssr: false, loading: () => <SectionPlaceholder /> }
);

const PopularTemplates = dynamic(
  () =>
    import("@/features/templates/components/popular-templates").then(
      (mod) => mod.PopularTemplates
    ),
  { ssr: false, loading: () => <SectionPlaceholder /> }
);

function SectionPlaceholder() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse px-4 sm:px-6 max-w-6xl mx-auto">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-40 rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export function HomeDynamicSections() {
  return (
    <>
      <PopularTemplates />
      <HomeRecentQRs />
    </>
  );
}