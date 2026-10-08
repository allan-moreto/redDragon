export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-10 w-56 animate-pulse rounded-xl bg-border" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-card" />
    </div>
  );
}
