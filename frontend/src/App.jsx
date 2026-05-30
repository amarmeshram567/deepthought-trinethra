import { useMemo, useState } from "react";
import {
  FileText,
  Loader2,
  MessageCircleQuestion,
  ShieldAlert,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";
import EvidenceCard from "./components/analysis/EvidenceCard";
import ScoreCard from "./components/analysis/ScoreCard";
import rubricData from "./data/rubric.json";
import sampleData from "./data/sample-transcripts.json";

const SAMPLE_LIST = Array.isArray(sampleData?.transcripts) ? sampleData.transcripts : [];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function App() {
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("score");
  const [draftState, setDraftState] = useState("draft");
  const [selectedSampleId, setSelectedSampleId] = useState(SAMPLE_LIST[0]?.id || "");
  const [selectedSample, setSelectedSample] = useState(SAMPLE_LIST[0] || null);
  const [toasts, setToasts] = useState([]);

  const wordCount = useMemo(() => {
    const trimmed = transcript.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [transcript]);

  const currentAnalysis = useMemo(() => normalizeAnalysis(analysis), [analysis]);

  const pushToast = (message, tone = "default") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((currentToasts) => [...currentToasts, { id, message, tone }]);

    window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const loadSample = () => {
    const sample = SAMPLE_LIST.find((item) => item.id === selectedSampleId) || SAMPLE_LIST[0];
    if (!sample) {
      pushToast("No sample transcripts were found.", "error");
      return;
    }

    setTranscript(sample.transcript || "");
    setSelectedSample(sample);
    setAnalysis(null);
    setStatus("idle");
    setError("");
    setDraftState("draft");
    setActiveTab("score");
    pushToast(`Loaded ${sampleLabel(sample)}.`, "success");
  };

  const runAnalysis = async () => {
    const trimmed = transcript.trim();
    if (!trimmed) {
      setError("Paste a transcript before running analysis.");
      pushToast("Paste a transcript first.", "warning");
      return;
    }

    setStatus("running");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: trimmed }),
      });

      const payload = await response.json();
      const data = payload?.data ?? payload;

      if (!response.ok || !data) {
        throw new Error(payload?.error || "Analysis failed.");
      }

      const normalized = normalizeAnalysis(data);
      setAnalysis(normalized);
      setStatus("done");
      setDraftState("draft");
      setActiveTab("score");
      pushToast("Analysis completed from the backend.", "success");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while contacting the backend."
      );
      setAnalysis(null);
      setStatus("idle");
      pushToast("Analysis failed. Check the backend and try again.", "error");
    }
  };

  const discardDraft = () => {
    setAnalysis(null);
    setStatus("idle");
    setError("");
    setDraftState("draft");
    setActiveTab("score");
    setTranscript("");
    setSelectedSample(null);
    pushToast("Draft discarded.", "warning");
  };

  const finalizeAnalysis = () => {
    if (!currentAnalysis) {
      setError("Run an analysis before finalizing it.");
      pushToast("Run an analysis first.", "warning");
      return;
    }

    setDraftState("finalized");
    setError("");
    pushToast("Analysis finalized.", "success");
  };

  const rubricSnapshot = Array.isArray(rubricData?.rubric?.kpis) ? rubricData.rubric.kpis : [];
  const rubricDimensions = Array.isArray(rubricData?.rubric?.assessmentDimensions)
    ? rubricData.rubric.assessmentDimensions
    : [];

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-slate-900">
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(36,82,184,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(98,136,255,0.08),_transparent_26%),linear-gradient(180deg,rgba(247,244,238,0.98),rgba(247,244,238,1))]" />

        <div className="relative mx-auto flex min-h-screen max-w-[1800px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <header className="rounded-[24px] border border-slate-200 bg-[rgba(255,255,255,0.72)] px-5 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Psychology Supervisor Analysis Platform
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-[30px]">
                    Trinethra draft review for supervisor transcripts
                  </h1>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    Local Ollama - llama3.2
                  </span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Human review first
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                  {status === "running"
                    ? "Analyzing..."
                    : draftState === "finalized"
                      ? "Draft finalized"
                      : currentAnalysis
                        ? "Draft ready"
                        : "Waiting for transcript"}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2452B8] text-sm font-semibold text-white">
                  AI
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[minmax(460px,1.05fr)_minmax(0,0.95fr)]">
            <section className="min-w-0 rounded-[24px] border border-slate-200 bg-[rgba(255,255,255,0.74)] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    New Analysis
                  </div>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Transcript input</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Pick a sample or paste your own supervisor transcript, then run the local Ollama analysis.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <select
                    value={selectedSampleId}
                    onChange={(event) => setSelectedSampleId(event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 outline-none transition hover:bg-slate-50"
                  >
                    {SAMPLE_LIST.map((sample) => (
                      <option key={sample.id} value={sample.id}>
                        {sampleLabel(sample)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={loadSample}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] cursor-pointer text-slate-700 transition hover:bg-slate-50"
                  >
                    Load sample
                  </button>
                </div>
              </div>

              {selectedSample ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <Target className="h-4 w-4 text-[#2452B8]" />
                    Sample context
                  </div>
                  <div className="mt-3 grid gap-3 text-sm text-slate-600">
                    <MetaRow label="Fellow" value={selectedSample.fellow?.name || "Unknown"} />
                    <MetaRow label="Company" value={selectedSample.company?.name || "Unknown"} />
                    <MetaRow label="Placement" value={selectedSample.fellow?.placement || "Not provided"} />
                    <MetaRow
                      label="Target KPIs"
                      value={(selectedSample.fellow?.targetKpis || []).join(", ") || "Not provided"}
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">Paste transcript</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{wordCount} words</span>
                </div>

                <textarea
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  rows={16}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-[#FCFBF7] px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#2452B8]/40"
                  placeholder="Paste the supervisor transcript here..."
                />

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Analysis source:{" "}
                    <span className="text-slate-700">
                      {currentAnalysis ? "backend /api/analyze" : "sample preview or new transcript"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={runAnalysis}
                    disabled={!transcript.trim() || status === "running"}
                    className="rounded-full bg-[#2452B8] px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(36,82,184,0.20)] transition hover:bg-[#1F469B] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "running" ? "Running AI Analysis..." : "Run Analysis"}
                  </button>
                </div>

                {status === "running" ? (
                  <div className="mt-4 space-y-3">
                    <LoadingLine />
                    <LoadingLine width="w-11/12" />
                    <LoadingLine width="w-10/12" />
                  </div>
                ) : null}

                {error ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <Sparkles className="h-4 w-4 text-[#2452B8]" />
                  Draft review mode
                </div>
                <p className="mt-2">
                  The AI output is a draft. The psychology intern should review the evidence, score, KPI mapping, gaps,
                  and follow-up questions before finalizing anything.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <Target className="h-4 w-4 text-[#2452B8]" />
                    Rubric snapshot
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {rubricSnapshot.length} KPIs
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rubricSnapshot.slice(0, 4).map((kpi) => (
                    <span
                      key={kpi.id}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                    >
                      {kpi.label}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-500">
                  Rubric dimensions: {rubricDimensions.map((dimension) => dimension.label).join(" | ") || "Not available"}
                </p>
              </div>

              {draftState === "finalized" ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Analysis finalized. The draft is locked for review submission.
                </div>
              ) : null}
            </section>

            <section className="min-w-0 space-y-6">
              {status === "running" ? (
                <RunningState />
              ) : currentAnalysis ? (
                <>
                  <div className="rounded-[24px] border border-slate-200 bg-[rgba(255,255,255,0.74)] p-2 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                    <div className="flex flex-wrap gap-2">
                      <TabButton active={activeTab === "score"} onClick={() => setActiveTab("score")} label="Score" />
                      <TabButton
                        active={activeTab === "evidence"}
                        onClick={() => setActiveTab("evidence")}
                        label="Evidence"
                        count={currentAnalysis.evidence.length}
                      />
                      <TabButton
                        active={activeTab === "kpi"}
                        onClick={() => setActiveTab("kpi")}
                        label="KPI mapping"
                        count={currentAnalysis.kpiMapping.length}
                      />
                      <TabButton
                        active={activeTab === "gaps"}
                        onClick={() => setActiveTab("gaps")}
                        label="Gap analysis"
                        count={currentAnalysis.gaps.length}
                      />
                      <TabButton
                        active={activeTab === "questions"}
                        onClick={() => setActiveTab("questions")}
                        label="Follow-ups"
                        count={currentAnalysis.followUpQuestions.length}
                      />
                    </div>
                  </div>

                  {activeTab === "score" ? (
                    <SectionCard icon={<ShieldAlert className="h-4 w-4" />} title="Rubric score" count={1}>
                      <ScoreCard
                        key={currentAnalysis.score.value}
                        score={currentAnalysis.score.value}
                        label={currentAnalysis.score.label}
                        justification={currentAnalysis.score.justification}
                        confidence={currentAnalysis.score.confidence}
                        band={currentAnalysis.score.band}
                      />
                    </SectionCard>
                  ) : null}

                  {activeTab === "evidence" ? (
                    <SectionCard
                      icon={<FileText className="h-4 w-4" />}
                      title="Extracted evidence"
                      count={currentAnalysis.evidence.length}
                    >
                      <div className="space-y-3">
                        {currentAnalysis.evidence.map((item, index) => (
                          <EvidenceCard
                            key={`${currentAnalysis.score.value}-${item.quote}-${index}`}
                            item={item}
                            index={index}
                            onAccept={() => pushToast("Evidence accepted.", "success")}
                            onReject={() => pushToast("Evidence rejected.", "warning")}
                            onEdit={() => pushToast("Evidence edit opened.", "default")}
                          />
                        ))}
                      </div>
                    </SectionCard>
                  ) : null}

                  {activeTab === "kpi" ? (
                    <SectionCard
                      icon={<Target className="h-4 w-4" />}
                      title="KPI mapping"
                      count={currentAnalysis.kpiMapping.length}
                    >
                      <div className="space-y-3">
                        {currentAnalysis.kpiMapping.map((item) => (
                          <KpiCard key={`${item.kpi}-${item.evidence}`} item={item} />
                        ))}
                      </div>
                    </SectionCard>
                  ) : null}

                  {activeTab === "gaps" ? (
                    <SectionCard
                      icon={<TriangleAlert className="h-4 w-4" />}
                      title="Gap analysis"
                      count={currentAnalysis.gaps.length}
                    >
                      <div className="space-y-3">
                        {currentAnalysis.gaps.map((gap, index) => (
                          <GapCard key={`${gap.dimension}-${index}`} gap={gap} />
                        ))}
                      </div>
                    </SectionCard>
                  ) : null}

                  {activeTab === "questions" ? (
                    <SectionCard
                      icon={<MessageCircleQuestion className="h-4 w-4" />}
                      title="Suggested follow-up questions"
                      count={currentAnalysis.followUpQuestions.length}
                    >
                      <ol className="space-y-3">
                        {currentAnalysis.followUpQuestions.map((question, index) => (
                          <li key={`${question.question}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                                Q{String(index + 1).padStart(2, "0")}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm leading-6 text-slate-900">{question.question}</p>
                                <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                    Gap: {question.targetGap}
                                  </span>
                                  {question.lookingFor ? (
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                                      Looking for: {question.lookingFor}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </SectionCard>
                  ) : null}

                  <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-2">
                    <button
                      type="button"
                      onClick={discardDraft}
                      className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Discard draft
                    </button>
                    <button
                      type="button"
                      onClick={finalizeAnalysis}
                      disabled={!currentAnalysis}
                      className="rounded-full bg-[#2452B8] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(36,82,184,0.20)] transition hover:bg-[#1F469B] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Finalize analysis
                    </button>
                  </div>
                </>
              ) : (
                <EmptyState />
              )}
            </section>
          </div>
        </div>
      </main>
      <ToastStack toasts={toasts} />
    </div>
  );
}

function normalizeAnalysis(analysis) {
  const scoreSource = analysis?.score || analysis?.rubric_score || {};
  const evidenceSource = Array.isArray(analysis?.evidence) ? analysis.evidence : [];
  const kpiSource = Array.isArray(analysis?.kpiMapping)
    ? analysis.kpiMapping
    : Array.isArray(analysis?.kpi_mapping)
      ? analysis.kpi_mapping
      : [];
  const gapsSource = Array.isArray(analysis?.gaps) ? analysis.gaps : Array.isArray(analysis?.gap_analysis) ? analysis.gap_analysis : [];
  const questionSource = Array.isArray(analysis?.followUpQuestions)
    ? analysis.followUpQuestions
    : Array.isArray(analysis?.followup_questions)
      ? analysis.followup_questions
      : [];

  return {
    score: {
      value: Number.isFinite(Number(scoreSource.value ?? scoreSource.score)) ? Math.round(Number(scoreSource.value ?? scoreSource.score)) : 6,
      label: scoreSource.label || "Draft score",
      band: scoreSource.band || "Productivity",
      justification: scoreSource.justification || scoreSource.summary || "Draft analysis generated from the transcript.",
      confidence: normalizeConfidence(scoreSource.confidence),
    },
    evidence: evidenceSource.map((item) => ({
      quote: item.quote || item.text || "",
      signal: normalizeSignal(item.signal || item.type),
      dimension: item.dimension || item.rubric_dimension || "execution",
      interpretation: item.interpretation || item.note || item.reason || "",
    })),
    kpiMapping: kpiSource.map((item) => ({
      kpi: item.kpi || item.name || "Unknown KPI",
      evidence: item.evidence || item.reason || "",
      systemOrPersonal: item.systemOrPersonal || item.system_or_personal || "personal",
    })),
    gaps: gapsSource.map((item) => {
      if (typeof item === "string") {
        return {
          dimension: inferGapDimension(item),
          detail: item,
        };
      }

      return {
        dimension: item.dimension || item.id || inferGapDimension(item.detail || item.description || ""),
        detail: item.detail || item.description || item.text || "",
      };
    }),
    followUpQuestions: questionSource.map((item) => ({
      question: item.question || item.text || "",
      targetGap: item.targetGap || item.target_gap || inferGapDimension(item.question || ""),
      lookingFor: item.lookingFor || item.looking_for || "",
    })),
  };
}

function sampleLabel(sample) {
  if (!sample) {
    return "Sample transcript";
  }

  const fellow = sample.fellow?.name || "Unknown Fellow";
  const company = sample.company?.name || "Unknown Company";
  return `${fellow} - ${company}`;
}

function normalizeConfidence(confidence) {
  if (typeof confidence === "string") {
    const normalized = confidence.toLowerCase();
    if (["low", "medium", "high"].includes(normalized)) {
      return normalized;
    }
  }

  if (typeof confidence === "number") {
    if (confidence >= 0.75) return "high";
    if (confidence >= 0.45) return "medium";
    return "low";
  }

  return "medium";
}

function normalizeSignal(signal) {
  const normalized = String(signal || "neutral").toLowerCase();
  if (["positive", "negative", "neutral"].includes(normalized)) {
    return normalized;
  }

  return "neutral";
}

function inferGapDimension(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("system")) return "systems_building";
  if (lower.includes("kpi") || lower.includes("impact") || lower.includes("quality") || lower.includes("tat")) {
    return "kpi_impact";
  }
  if (lower.includes("change") || lower.includes("resistance") || lower.includes("team")) {
    return "change_management";
  }

  return "execution";
}

function SectionCard({ icon, title, count, children }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-[rgba(255,255,255,0.74)] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-slate-500">{icon}</span>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <span className="ml-auto rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function TabButton({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${active
        ? "bg-[#2452B8] text-white shadow-[0_12px_25px_rgba(36,82,184,0.24)]"
        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
    >
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

function LoadingLine({ width = "w-full" }) {
  return <div className={`h-3 ${width} animate-pulse rounded-full bg-slate-200`} />;
}

function RunningState() {
  const steps = ["Extracting evidence...", "Mapping to rubric...", "Scoring & gap detection...", "Drafting follow-ups..."];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-[rgba(255,255,255,0.74)] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-slate-500">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Analysis in progress</h2>
      </div>

      <div className="space-y-4 rounded-[20px] border border-slate-200 bg-white p-5">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-4 text-sm">
            <Loader2 className={`h-5 w-5 animate-spin ${index < 2 ? "text-[#2452B8]" : "text-slate-300"}`} />
            <span className={index < 2 ? "text-slate-900" : "text-slate-500"}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-[rgba(255,255,255,0.6)] p-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">No analysis yet</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
        Load a sample or paste a supervisor transcript on the left, then run analysis. You&apos;ll see evidence, a draft
        score, KPI mapping, gaps, and follow-up questions here.
      </p>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <span className="text-sm leading-6 text-slate-700 sm:text-right">{value}</span>
    </div>
  );
}

function KpiCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{item.kpi}</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${item.systemOrPersonal === "system"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
            }`}
        >
          {item.systemOrPersonal}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.evidence}</p>
    </div>
  );
}

function GapCard({ gap }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">{gap.dimension}</span>
      </div>
      <p className="mt-2">{gap.detail}</p>
    </div>
  );
}

function ToastStack({ toasts }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_45px_rgba(15,23,42,0.16)] backdrop-blur-xl ${toast.tone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : toast.tone === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : toast.tone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-slate-200 bg-white text-slate-700"
            }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default App;
