export function createDraftState(analysis) {
  return {
    evidence: analysis.evidence.map((item) => ({
      status: "pending",
      editedQuote: item.quote,
    })),
    kpiMapping: analysis.kpiMapping.map((item) => ({
      status: "pending",
      editedEvidence: item.evidence,
    })),
    gaps: analysis.gaps.map((item) => ({
      status: "pending",
      editedDetail: item.detail,
    })),
    followUpQuestions: analysis.followUpQuestions.map((item) => ({
      status: "pending",
      editedQuestion: item.question,
    })),
    score: {
      status: "pending",
      draftScore: analysis.score.value,
      draftJustification: analysis.score.justification,
    },
  };
}

export function getReviewedCounts(review) {
  return {
    evidence: review.evidence.filter((item) => item.status !== "pending").length,
    kpiMapping: review.kpiMapping.filter((item) => item.status !== "pending").length,
    gaps: review.gaps.filter((item) => item.status !== "pending").length,
    followUpQuestions: review.followUpQuestions.filter((item) => item.status !== "pending").length,
  };
}
