const { enrichCompany, scrapeWebsite, enrichWithDns } = require('./src/scrapers/company');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const assert = (condition, msg) => { if (!condition) throw new Error(msg); };

test('enrichCompany with domain returns structured data', async () => {
  const result = await enrichCompany({ domain: 'google.com' });
  assert(result.company, 'should have company data');
  assert(result.dns, 'should have DNS data');
  assert(result.enrichedAt, 'should have enrichedAt timestamp');
  assert(typeof result.processingMs === 'number', 'should have processingMs');
});

test('enrichWithDns detects Google MX', async () => {
  const result = await enrichWithDns('google.com');
  assert(result.emailProvider, 'should detect email provider');
  assert(typeof result.emailSecurity === 'object', 'should have email security info');
});

test('scrapeWebsite returns structured response', async () => {
  const result = await scrapeWebsite('example.com');
  assert(result.domain, 'should have domain');
  assert(typeof result.scraped === 'boolean', 'should indicate if scraped');
  // May not extract name if SSL/network issues in test env
  if (result.scraped) {
    assert(result.name, 'should extract a name when scraped');
  }
});

test('enrichCompany with name tries domain guess', async () => {
  const result = await enrichCompany({ name: 'Google' });
  assert(result.input.name === 'Google', 'should preserve input');
  assert(result.company, 'should have company data');
});

test('enrichCompany handles invalid domain gracefully', async () => {
  const result = await enrichCompany({ domain: 'this-domain-does-not-exist-xyz-123.com' });
  assert(result.company, 'should still return structured response');
  assert(result.processingMs >= 0, 'should have timing');
});

(async () => {
  console.log('\n🧪 Company Enrichment Tests\n');
  let passed = 0, failed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ❌ ${name}: ${err.message}`);
      failed++;
    }
  }
  console.log(`\n📊 ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
