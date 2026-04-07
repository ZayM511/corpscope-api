require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiKeyAuth = require('./middleware/apiKeyAuth');
const termsAcceptance = require('./middleware/termsAcceptance');
const requestLogger = require('./middleware/requestLogger');
const { validate, schemas } = require('./middleware/validation');
const companyRoutes = require('./routes/company');

const app = express();
const PORT = process.env.PORT || 3000;
const COMPANY = {
  name: 'Groundwork Labs LLC',
  type: 'Limited Liability Company',
  jurisdiction: 'California, USA',
  website: 'https://groundworklabs.com'
};

// ── Security ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'x-terms-accepted']
}));
app.use(express.json({ limit: '1mb' }));

// ── Logging & Rate Limiting ─────────────────────────
app.use(requestLogger);
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', retryAfter: '15 minutes' }
}));

// ── Company Headers ─────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Company', COMPANY.name);
  res.setHeader('X-Jurisdiction', COMPANY.jurisdiction);
  res.setHeader('X-Terms-Version', '2026.04.07');
  next();
});

// ── Public Routes ───────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'Company Enrichment API',
  version: '1.0.0',
  uptime: Math.floor(process.uptime()),
  timestamp: new Date().toISOString()
}));

app.get('/legal', (req, res) => res.json({
  company: COMPANY.name,
  type: COMPANY.type,
  jurisdiction: COMPANY.jurisdiction,
  termsOfService: 'https://github.com/ZayM511/company-enrichment-api/blob/main/legal/TermsOfService.md',
  privacyPolicy: 'https://github.com/ZayM511/company-enrichment-api/blob/main/legal/PrivacyPolicy.md'
}));

app.get('/', (req, res) => res.json({
  service: 'Company Enrichment API',
  company: COMPANY.name,
  version: '1.0.0',
  endpoints: {
    health: 'GET /health',
    legal: 'GET /legal',
    verify: 'GET /api/verify',
    enrich: 'POST /api/company/enrich',
    bulk: 'POST /api/company/bulk'
  }
}));

// ── Authenticated Routes ────────────────────────────
app.use('/api', apiKeyAuth);

app.get('/api/verify', (req, res) => {
  res.json({ valid: true, plan: req.apiKey.plan, remaining: req.apiKey.remaining });
});

app.use('/api/company', termsAcceptance, validate(schemas.companyLookup, 'body'), companyRoutes);

// ── 404 ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path, hint: 'GET / for available endpoints' });
});

// ── Error Handler ───────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${err.stack || err.message}`);
  res.status(err.status || 500).json({
    error: (err.status || 500) >= 500 ? 'Internal server error' : err.message,
    requestId: req.requestId
  });
});

// ── Start ───────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   Company Enrichment API  v1.0.0                  ║
║   © 2026 ${COMPANY.name}                    ║
║   ${COMPANY.jurisdiction}                                 ║
║   Port ${PORT} │ ${process.env.NODE_ENV || 'development'}                          ║
╚═══════════════════════════════════════════════════╝
  `);
});

const shutdown = (signal) => {
  console.log(`\n[${signal}] Shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
