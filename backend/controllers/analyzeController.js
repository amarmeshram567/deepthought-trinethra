const ollamaService = require('../services/ollamaService');

async function buildAnalysisResponse(transcript) {
    if (!transcript || !transcript.trim()) {
        const error = new Error('Transcript is required');
        error.status = 400;
        throw error;
    }

    const result = await ollamaService.generateAnalysis(transcript);

    if (!result) {
        const error = new Error('Invalid response from AI service');
        error.status = 502;
        throw error;
    }

    return result;
}

async function analyze(req, res, next) {
    try {
        const result = await buildAnalysisResponse(req.body?.transcript);
        res.json({ ok: true, data: result });
    } catch (err) {
        next(err);
    }
}

module.exports = { analyze, buildAnalysisResponse };
