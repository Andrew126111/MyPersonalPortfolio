import { ChevronDown } from "lucide-react";

/*
 * Shared by Experience and Projects so they read the same: a couple of headline points,
 * the rest tucked behind "More details", and the tools as one quiet line.
 */

function Point({ text }: { text: string }) {
  return (
    <li className="flex gap-3 text-[15px] leading-relaxed text-soft">
      <span className="mt-2.5 size-1 shrink-0 rounded-full bg-glow" aria-hidden="true" />
      {text}
    </li>
  );
}

export function PointList({ points, visible = 2 }: { points: string[]; visible?: number }) {
  return (
    <>
      <ul className="mt-7 space-y-3">
        {points.slice(0, visible).map((p) => (
          <Point key={p} text={p} />
        ))}
      </ul>
      {points.length > visible && (
        <details className="group mt-3">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-mono text-xs text-glow/90 transition-colors hover:text-glow [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">More details</span>
            <span className="hidden group-open:inline">Less</span>
            <ChevronDown className="size-3.5 transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ul className="mt-3 space-y-3">
            {points.slice(visible).map((p) => (
              <Point key={p} text={p} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

export function ToolsLine({ tools, label = "Tools used" }: { tools: string[]; label?: string }) {
  return (
    <p className="mt-6 font-mono text-xs leading-relaxed text-soft/80">
      <span className="sr-only">{label}: </span>
      {tools.join("  ·  ")}
    </p>
  );
}
