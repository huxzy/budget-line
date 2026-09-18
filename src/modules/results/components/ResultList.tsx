import type { Project } from "@/modules/budget";
import { ResultCard } from "./ResultCard";
import { ResultSkeleton } from "./ResultSkeleton";

type Props = {
  projects: Project[];
  /** Total matches, when more exist than are shown. */
  total?: number;
  /** Show this many skeletons after the real cards (results still arriving). */
  pending?: number;
  countUp?: boolean;
};

/** The first result as the hero card, the rest in a two-up grid, staggered 90ms. */
export function ResultList({ projects, total, pending = 0, countUp = true }: Props) {
  const [first, ...rest] = projects;
  if (!first) return null;
  return (
    <div className="flex flex-col gap-5">
      <ResultCard project={first} variant="hero" cited index={0} countUp={countUp} />
      {(rest.length > 0 || pending > 0) && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {rest.map((p, i) => (
            <ResultCard key={p.id} project={p} index={i + 1} countUp={countUp} />
          ))}
          {Array.from({ length: pending }).map((_, i) => (
            <ResultSkeleton key={`s${i}`} label={total ? `Result ${projects.length + i + 1} of ${total} arriving` : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
