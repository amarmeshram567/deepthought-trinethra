export const SAMPLE_TRANSCRIPT = `Supervisor: You handled the client escalation calmly and followed up with a clear action plan. Your documentation was strong, but I want you to become more proactive in surfacing risks earlier. The team appreciates your collaboration, though your updates sometimes arrive late in the cycle.`;

export const MOCK_ANALYSIS = {
  score: {
    value: 6,
    label: "Reliable and Productive",
    band: "Productivity",
    justification:
      "The Fellow is dependable on assigned work, but the transcript does not show enough independent problem identification or durable systems building to justify a 7.",
    confidence: "medium",
  },
  evidence: [
    {
      quote: "You handled the client escalation calmly",
      signal: "positive",
      dimension: "execution",
      interpretation: "Shows steady execution under pressure and reliable follow-through.",
    },
    {
      quote: "Your documentation was strong",
      signal: "positive",
      dimension: "execution",
      interpretation: "The Fellow is producing useful work products, but the evidence still points to assigned-task delivery.",
    },
    {
      quote: "become more proactive in surfacing risks earlier",
      signal: "negative",
      dimension: "execution",
      interpretation: "The supervisor is asking for stronger initiative and earlier problem spotting.",
    },
  ],
  kpiMapping: [
    {
      kpi: "Stakeholder communication",
      evidence: "The supervisor mentions updates and collaboration with the team.",
      systemOrPersonal: "personal",
    },
    {
      kpi: "Execution reliability",
      evidence: "Documentation and action planning suggest dependable delivery.",
      systemOrPersonal: "personal",
    },
  ],
  gaps: [
    {
      dimension: "systems_building",
      detail: "No mention of trackers, SOPs, or any process that would continue after the Fellow leaves.",
    },
    {
      dimension: "kpi_impact",
      detail: "No quantified business outcome or measurable change is described.",
    },
  ],
  followUpQuestions: [
    {
      question: "What process or tracker have you built that your team now uses regularly?",
      targetGap: "systems_building",
      lookingFor: "Evidence of a durable workflow that does not depend on the Fellow's constant presence.",
    },
    {
      question: "Did you notice any recurring problem before the supervisor did, and what did you do about it?",
      targetGap: "execution",
      lookingFor: "Independent problem identification that would justify moving above a 6.",
    },
    {
      question: "What changed in the business because of your work?",
      targetGap: "kpi_impact",
      lookingFor: "A measurable impact such as speed, quality, cost, or customer satisfaction.",
    },
  ],
};
