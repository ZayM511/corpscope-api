// Groundwork Labs LLC - API Key Authentication with Per-Key Rate Limiting
const API_KEYS = {
  'sk_test_free_001': { plan: 'free', monthlyRequests: 100 },
  'sk_test_basic_002': { plan: 'basic', monthlyRequests: 1000 },
  'sk_test_pro_003': { plan: 'pro', monthlyRequests: 10000 }
};

// In-memory rate tracking
const keyUsage = {};

const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required. Include x-api-key header.',
      company: 'Groundwork Labs LLC'
    });
  }
  
  const keyData = API_KEYS[apiKey];
  if (!keyData) {
    return res.status(403).json({ 
      error: 'Invalid API key',
      company: 'Groundwork Labs LLC'
    });
  }
  
  // Initialize usage tracking
  if (!keyUsage[apiKey]) {
    keyUsage[apiKey] = { used: 0, resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
  }
  
  // Reset if after reset date
  if (new Date() > keyUsage[apiKey].resetAt) {
    keyUsage[apiKey] = { used: 0, resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
  }
  
  // Check limit
  if (keyUsage[apiKey].used >= keyData.monthlyRequests) {
    return res.status(429).json({ 
      error: 'Monthly limit reached. Upgrade to continue.',
      company: 'Groundwork Labs LLC',
      plan: keyData.plan
    });
  }
  
  // Increment usage
  keyUsage[apiKey].used++;
  
  req.apiKey = { ...keyData, used: keyUsage[apiKey].used };
  next();
};

module.exports = apiKeyAuth;
