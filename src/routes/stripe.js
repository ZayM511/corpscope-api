const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// CorpScope Plans
const PLANS = {
  growth: {
    priceId: 'price_1TJWj4K6Cynlh5jwSL5xAgFN',
    name: 'CorpScope Growth',
    monthlyRequests: 1000,
    price: 2900
  },
  scale: {
    priceId: 'price_1TJWkDK6Cynlh5jwBnQs8JdS',
    name: 'CorpScope Scale',
    monthlyRequests: 10000,
    price: 7900
  },
  enterprise: {
    priceId: 'price_1TJWlaK6Cynlh5jwNXEFRqEe',
    name: 'CorpScope Enterprise',
    monthlyRequests: 100000,
    price: 19900
  }
};

// List available plans
router.get('/plans', (req, res) => {
  const plans = Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    price: `$${(plan.price / 100).toFixed(0)}/mo`,
    monthlyRequests: plan.monthlyRequests
  }));
  res.json({
    free: { name: 'CorpScope Starter', price: 'Free', monthlyRequests: 50 },
    paid: plans
  });
});

// Create checkout session
router.post('/checkout', async (req, res) => {
  try {
    const { plan } = req.body;

    const selectedPlan = PLANS[plan];
    if (!selectedPlan) {
      return res.status(400).json({
        error: 'Invalid plan',
        validPlans: Object.keys(PLANS),
        hint: 'GET /api/stripe/plans to see all options'
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: selectedPlan.priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/cancel`,
      metadata: {
        product: 'corpscope',
        plan: plan,
        monthlyRequests: selectedPlan.monthlyRequests.toString()
      }
    });

    res.json({
      sessionId: session.id,
      url: session.url,
      plan: {
        name: selectedPlan.name,
        price: `$${(selectedPlan.price / 100).toFixed(0)}/mo`,
        monthlyRequests: selectedPlan.monthlyRequests
      }
    });
  } catch (error) {
    console.error('[STRIPE] Checkout error:', error.message);
    res.status(500).json({ error: 'Checkout failed', message: error.message });
  }
});

// Manage subscription
router.post('/manage', async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId is required' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.BASE_URL || 'http://localhost:3000'}/`
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    let event;
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        console.log(`[STRIPE] ✅ New subscription: ${event.data.object.metadata?.plan}`);
        break;
      case 'customer.subscription.deleted':
        console.log(`[STRIPE] ❌ Subscription cancelled: ${event.data.object.id}`);
        break;
      case 'invoice.payment_failed':
        console.log(`[STRIPE] ⚠️ Payment failed: ${event.data.object.customer}`);
        break;
    }
    res.json({ received: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
