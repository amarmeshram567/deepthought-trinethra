const axios = require('axios');
const { rubric, systemPrompt } = require('../prompts/systemPrompt');

const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/chat';

function clampScore(value) {
  const numeric = Number.isFinite(value) ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(numeric)) {
    return 6;
  }

  return Math.min(10, Math.max(1, Math.round(numeric)));
}

function getBandForScore(scoreValue) {
  const bands = Array.isArray(rubric?.bands) ? rubric.bands : [];
  for (const band of bands) {
    const [min, max] = band.range || [];
    if (typeof min === 'number' && typeof max === 'number' && scoreValue >= min && scoreValue <= max) {
      return band.band;
    }
  }

  return scoreValue >= 7 ? 'Performance' : scoreValue >= 4 ? 'Productivity' : 'Need Attention';
}

function getLabelForScore(scoreValue) {
  const bands = Array.isArray(rubric?.bands) ? rubric.bands : [];
  for (const band of bands) {
    for (const level of band.levels || []) {
      if (level.score === scoreValue) {
        return level.label;
      }
    }
  }

  return 'Draft score';
}

function normalizeConfidence(confidence) {
  if (typeof confidence === 'string') {
    const value = confidence.toLowerCase();
    if (['low', 'medium', 'high'].includes(value)) {
      return value;
    }
  }

  if (typeof confidence === 'number') {
    if (confidence >= 0.75) return 'high';
    if (confidence >= 0.45) return 'medium';
    return 'low';
  }

  return 'medium';
}

function cleanText(value, fallback = '') {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value == null) {
    return fallback;
  }

  return String(value).trim();
}

function normalizeEvidence(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      quote: cleanText(item.quote || item.text || item.excerpt),
      signal: ['positive', 'negative', 'neutral'].includes(String(item.signal || item.type || '').toLowerCase())
        ? String(item.signal || item.type).toLowerCase()
        : 'neutral',
      dimension: cleanText(item.dimension || item.rubric_dimension || 'execution'),
      interpretation: cleanText(item.interpretation || item.note || item.reason),
    }))
    .filter((item) => item.quote);
}

function normalizeKpiMapping(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      kpi: cleanText(item.kpi || item.name || item.label),
      evidence: cleanText(item.evidence || item.reason || item.text),
      systemOrPersonal:
        String(item.systemOrPersonal || item.system_or_personal || item.scope || 'personal').toLowerCase() === 'system'
          ? 'system'
          : 'personal',
    }))
    .filter((item) => item.kpi);
}

function normalizeGaps(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (typeof item === 'string') {
        const lower = item.toLowerCase();
        let dimension = 'execution';
        if (lower.includes('system')) dimension = 'systems_building';
        if (lower.includes('kpi') || lower.includes('impact')) dimension = 'kpi_impact';
        if (lower.includes('change') || lower.includes('team') || lower.includes('resistance')) dimension = 'change_management';

        return { dimension, detail: item.trim() };
      }

      return {
        dimension: cleanText(item.dimension || item.id || 'execution'),
        detail: cleanText(item.detail || item.description || item.text),
      };
    })
    .filter((item) => item.detail);
}

function normalizeQuestions(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (typeof item === 'string') {
        return {
          question: item.trim(),
          targetGap: 'execution',
          lookingFor: '',
        };
      }

      return {
        question: cleanText(item.question || item.text),
        targetGap: cleanText(item.targetGap || item.target_gap || 'execution'),
        lookingFor: cleanText(item.lookingFor || item.looking_for || item.expectedAnswer || ''),
      };
    })
    .filter((item) => item.question);
}

function normalizeScore(rawScore, rawOutput) {
  const scoreSource = rawScore || rawOutput?.rubric_score || rawOutput?.score || {};
  const scoreValue = clampScore(scoreSource.value ?? scoreSource.score ?? scoreSource.rating);
  return {
    value: scoreValue,
    label: cleanText(scoreSource.label || getLabelForScore(scoreValue)),
    band: cleanText(scoreSource.band || getBandForScore(scoreValue)),
    justification: cleanText(
      scoreSource.justification || scoreSource.summary || scoreSource.reason || 'Draft analysis generated from the transcript.'
    ),
    confidence: normalizeConfidence(scoreSource.confidence),
  };
}

function normalizeAnalysis(rawOutput) {
  const output = rawOutput || {};
  const score = normalizeScore(output.score || output.rubric_score, output);
  const evidence = normalizeEvidence(output.evidence || output.extractedEvidence);
  const kpiMapping = normalizeKpiMapping(output.kpiMapping || output.kpi_mapping);
  const gaps = normalizeGaps(output.gaps || output.gap_analysis);
  const followUpQuestions = normalizeQuestions(output.followUpQuestions || output.followup_questions);

  return {
    score,
    evidence: evidence.length ? evidence.slice(0, 5) : [],
    kpiMapping: kpiMapping.slice(0, 4),
    gaps: gaps.slice(0, 4),
    followUpQuestions: followUpQuestions.slice(0, 5),
  };
}

async function callOllama(payload) {
  try {
    const resp = await axios.post(OLLAMA_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000,
    });

    return resp.data;
  } catch (error) {
    const isConnectionIssue =
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'EAI_AGAIN' ||
      error.code === 'ECONNRESET';

    if (isConnectionIssue) {
      throw new Error(
        `Cannot reach Ollama at ${OLLAMA_URL}. Make sure Ollama is running and ${MODEL} is pulled.`
      );
    }

    throw error;
  }
}

function extractContent(response) {
  if (!response) {
    return null;
  }

  if (typeof response === 'string') {
    return response;
  }

  return (
    response.message?.content ||
    response.response ||
    response.output?.[0]?.content ||
    response.output ||
    response.choices?.[0]?.message?.content ||
    response.choices?.[0]?.text ||
    null
  );
}

function stripCodeFence(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
}

function extractJsonCandidate(text) {
  const cleaned = stripCodeFence(text);

  try {
    return JSON.parse(cleaned);
  } catch {}

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const slice = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    const slice = cleaned.slice(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }

  return null;
}

async function repairWithSecondPass(transcript, previousOutput) {
  const repairPayload = {
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Rewrite the previous draft as valid JSON only. Keep the same meaning, but make the structure match the requested schema exactly.',
      },
      {
        role: 'user',
        content: `Transcript:\n${transcript}\n\nInvalid or messy draft to repair:\n${previousOutput}\n\nReturn JSON only.`,
      },
    ],
    stream: false,
    format: 'json',
  };

  const repaired = await callOllama(repairPayload);
  const repairedContent = extractContent(repaired);
  if (!repairedContent) {
    return null;
  }

  return extractJsonCandidate(repairedContent);
}

async function generateAnalysis(transcript) {
  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Transcript:\n\n${transcript}` },
    ],
    stream: false,
    format: 'json',
  };

  const data = await callOllama(payload);
  const content = extractContent(data);

  if (!content) {
    throw new Error('No content returned from model');
  }

  const parsed = extractJsonCandidate(content);
  if (!parsed) {
    const repaired = await repairWithSecondPass(transcript, content);
    if (!repaired) {
      throw new Error('Failed to parse JSON from model output');
    }

    return normalizeAnalysis(repaired);
  }

  return normalizeAnalysis(parsed);
}

module.exports = { generateAnalysis, normalizeAnalysis };
