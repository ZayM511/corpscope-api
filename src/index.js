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

// Company: Groundwork Labs LLC (California)
const COMPANY = {
  name: 'Groundwork Labs LLC',
  type: 'Limited Liability Company',
  jurisdiction: 'California, USA',
  website: 'https://groundworklabs.com'
};

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(requestLogger);

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Groundwork Labs LLC headers
app.use((req, res, next) => {
  res.setHeader('X-Company', COMPANY.name);
  res.setHeader('X-Jurisdiction', COMPANY.jurisdiction);
  res.setHeader('X-Terms-Version', '2026.04.07');
  next();
});

app.use('/api', apiKeyAuth);
app.use('/api/company', termsAcceptance, validate(schemas.companyLookup, 'body'), companyRoutes);

app.get('/health', (req, res) => res.json({ 
  status: 'ok', 
  company: COMPANY.name,
  jurisdiction: COMPANY.jurisdiction,
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
  type: COMPANY.type,
  version: '1.0.0'
}));

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   Company Enrichment API                          ║
║   © 2026 ${COMPANY.name}                    ║
║   ${COMPANY.jurisdiction}                                 ║
║   Running on port ${PORT}                              ║
╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
