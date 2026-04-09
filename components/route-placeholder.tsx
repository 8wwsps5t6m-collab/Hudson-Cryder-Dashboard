// Simple heading block for routes that are not built yet.

export function RoutePlaceholder({
  title,
  phaseLabel,
  children,
}: {
  title: string;
  phaseLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
        {title}
      </h1>
      <p className="mt-2 text-sm text-zinc-500">{phaseLabel}</p>
      {children ? (
        <p className="mt-6 text-sm leading-relaxed text-zinc-400">{children}</p>
      ) : null}
    </div>
  );
}
