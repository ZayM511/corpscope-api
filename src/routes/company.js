const express = require('express');
const router = express.Router();
const { enrichCompany } = require('../scrapers/company');

// Single company enrichment
router.post('/enrich', async (req, res) => {
  try {
    const data = req.validated || req.body;
    const result = await enrichCompany(data);
    res.json({
      success: true,
      data: result,
      meta: {
        requestId: req.requestId,
        plan: req.apiKey.plan,
        remaining: req.apiKey.remaining
      }
    });
  } catch (error) {
    console.error('[ENRICH] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Enrichment failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error',
      requestId: req.requestId
    });
  }
});

// Bulk enrichment (Basic/Pro only)
router.post('/bulk', async (req, res) => {
  try {
    const { companies } = req.body;

    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ error: 'companies must be a non-empty array' });
    }

    if (companies.length > 25) {
      return res.status(400).json({ error: 'Maximum 25 companies per bulk request' });
    }

    if (req.apiKey.plan === 'free') {
      return res.status(403).json({
        error: 'Bulk endpoint requires Basic or Pro plan',
        upgrade: 'POST /api/stripe/checkout'
      });
    }

    const results = await Promise.allSettled(
      companies.map(c => enrichCompany(c))
    );

    const response = companies.map((input, i) => ({
      input,
      ...(results[i].status === 'fulfilled'
        ? { success: true, data: results[i].value }
        : { success: false, error: results[i].reason?.message || 'Unknown error' })
    }));

    res.json({
      success: true,
      results: response,
      total: companies.length,
      meta: { requestId: req.requestId, plan: req.apiKey.plan, remaining: req.apiKey.remaining }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, requestId: req.requestId });
  }
});

module.exports = router;
