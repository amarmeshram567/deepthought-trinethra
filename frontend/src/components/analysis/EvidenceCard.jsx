import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

const sentimentStyles = {
  positive: "bg-positive/15 text-positive-foreground border-positive/30",
  negative: "bg-negative/15 text-negative-foreground border-negative/30",
  neutral: "bg-neutral/20 text-neutral-foreground border-neutral/40",
};

const dotStyles = {
  positive: "bg-positive",
  negative: "bg-negative",
  neutral: "bg-neutral",
};

function EvidenceCard({ item, index = 0, onAccept, onReject, onEdit }) {
  const [status, setStatus] = useState("pending");
  const [isEditing, setIsEditing] = useState(false);
  const [draftQuote, setDraftQuote] = useState(item.quote || "");
  const [draftNote, setDraftNote] = useState(
    item.interpretation || item.note || item.rubric_dimension || "Draft evidence extracted from the transcript."
  );

  const sentiment = item.signal || item.sentiment || item.type || "neutral";
  const note =
    item.interpretation || item.note || item.rubric_dimension || "Draft evidence extracted from the transcript.";

  const handleStartEdit = () => {
    setIsEditing(true);
    if (onEdit) onEdit(item);
  };

  const handleCancelEdit = () => {
    setDraftQuote(item.quote || "");
    setDraftNote(item.interpretation || item.note || item.rubric_dimension || "Draft evidence extracted from the transcript.");
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    if (onEdit) onEdit({ ...item, quote: draftQuote, note: draftNote });
  };

  return (
    <div
      className={`group rounded-lg border bg-card p-4 transition-all ${
        status === "accepted" ? "border-positive/50 bg-positive/5" : ""
      } ${status === "rejected" ? "border-dashed opacity-50" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-1 text-xs font-mono text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                sentimentStyles[sentiment] || sentimentStyles.neutral
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${dotStyles[sentiment] || dotStyles.neutral}`} />
              {sentiment}
            </span>
          </div>

          <blockquote className="border-l-2 border-foreground/20 pl-3 text-[15px] italic leading-relaxed text-foreground">
            "{item.quote}"
          </blockquote>

          <p className="mt-2 text-sm text-muted-foreground">{note}</p>

          {isEditing ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Edit quote
              </label>
              <textarea
                value={draftQuote}
                onChange={(event) => setDraftQuote(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#2452B8]/40"
              />
              <label className="mb-2 mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Edit note
              </label>
              <textarea
                value={draftNote}
                onChange={(event) => setDraftNote(event.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#2452B8]/40"
              />

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-full bg-[#2452B8] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1F469B]"
                >
                  Save
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => {
              setStatus("accepted");
              if (onAccept) onAccept(item);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-positive/20 hover:text-positive-foreground"
            title="Accept"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus("rejected");
              if (onReject) onReject(item);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-negative/20 hover:text-negative-foreground"
            title="Reject"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleStartEdit}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default EvidenceCard;
