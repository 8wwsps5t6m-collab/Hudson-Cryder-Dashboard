// Shown immediately during client navigations while the route segment resolves.

export default function AppSegmentLoading() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <div className="animate-pulse space-y-4">
        <div className="h-9 max-w-xs rounded-lg bg-zinc-800/70" />
        <div className="h-4 max-w-lg rounded bg-zinc-800/45" />
        <div className="h-4 max-w-md rounded bg-zinc-800/35" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((key) => (
            <div
              key={key}
              className="h-28 rounded-xl border border-zinc-800/80 bg-zinc-950/40"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
