require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('express').json;
const routes = require('./routes/analyze');
const { errorHandler } = require('./middleware/errorHandler');


const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

function corsOrigin(origin, callback) {
    if (!origin) {
        return callback(null, true);
    }

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin ${origin}`));
}

app.use(
    cors({
        origin: corsOrigin,
    })
);
app.use(bodyParser({ limit: '5mb' }));

app.use('/api/analyze', routes);

app.get('/', (_req, res) => {
    res.status(200).json({
        ok: true,
        service: 'trinethra-backend',
        message: 'Backend is running. Use POST /api/analyze for transcript analysis.',
    });
});

app.use(errorHandler);

if (require.main === module && !process.env.VERCEL) {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`Trinethra backend listening on port ${PORT}`);
    });
}

module.exports = app;
