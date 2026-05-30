const { buildAnalysisResponse } = require('../controllers/analyzeController');

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
    setCorsHeaders(res);

    const body = typeof req.body === 'string'
        ? (() => {
            try {
                return JSON.parse(req.body);
            } catch {
                return {};
            }
        })()
        : req.body || {};

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const result = await buildAnalysisResponse(body.transcript);
        return res.status(200).json({ ok: true, data: result });
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ error: error.message || 'Internal server error' });
    }
};
