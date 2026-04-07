const termsAcceptance = (req, res, next) => {
  if (req.apiKey.plan === 'free') return next();
  const accepted = req.headers['x-terms-accepted'];
  if (!accepted) return res.status(403).json({ error: 'Terms must be accepted', message: 'Include header: x-terms-accepted: true' });
  next();
};
module.exports = termsAcceptance;
