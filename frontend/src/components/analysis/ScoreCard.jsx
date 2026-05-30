import { useState } from "react";
import { AlertTriangle } from "lucide-react";

const confidenceCopy = {
  low: {
    label: "Low confidence",
    className: "text-negative-foreground bg-negative/15 border-negative/30",
  },
  medium: {
    label: "Medium confidence",
    className: "text-accent-foreground bg-accent/40 border-accent/60",
  },
  high: {
    label: "High confidence",
    className: "text-positive-foreground bg-positive/15 border-positive/30",
  },
};

function ScoreCard({ score, label, justification, confidence, band }) {
  const [value, setValue] = useState(score);
  const conf = confidenceCopy[confidence] || confidenceCopy.low;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Suggested Rubric Score
            </h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${conf.className}`}
            >
              <AlertTriangle className="h-3 w-3" />
              {conf.label}
            </span>
          </div>
          <p className="font-display text-2xl leading-tight text-foreground">{label}</p>
          {band ? <p className="mt-1 text-sm text-muted-foreground">{band} band</p> : null}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="font-display text-7xl leading-none text-primary">{value}</span>
          <span className="text-xl text-muted-foreground">/10</span>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-border/60 bg-muted/60 p-4">
        <p className="text-[15px] leading-relaxed text-foreground">{justification}</p>
      </div>

      <div className="mt-5">
        <label className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Adjust score (intern override)</span>
          <span className="font-mono">{value}/10</span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          className="w-full accent-primary"
        />
        <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScoreCard;
