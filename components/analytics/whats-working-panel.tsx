// Bullet list driven by rule-based lib/whats-working (current calendar month).

export function WhatsWorkingPanel({ lines }: { lines: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}
