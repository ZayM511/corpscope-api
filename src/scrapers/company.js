const axios = require('axios');
const cheerio = require('cheerio');
const dns = require('dns').promises;

/**
 * Company Enrichment Engine
 * Attempts real data extraction before falling back to structured placeholders.
 */

// ── Website Scraper ─────────────────────────────────
const scrapeWebsite = async (domain) => {
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  try {
    const { data, request } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CompanyEnrichBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 10000,
      maxRedirects: 5
    });

    const $ = cheerio.load(data);
    const finalUrl = request?.res?.responseUrl || url;

    // Extract metadata
    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content')?.trim()
      || $('meta[property="og:description"]').attr('content')?.trim();
    const ogImage = $('meta[property="og:image"]').attr('content')?.trim();
    const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();

    // Try to find social links
    const socials = {};
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('linkedin.com/company')) socials.linkedin = href;
      if (href.includes('twitter.com/') || href.includes('x.com/')) socials.twitter = href;
      if (href.includes('facebook.com/')) socials.facebook = href;
      if (href.includes('github.com/')) socials.github = href;
    });

    // Try to find address/location
    const bodyText = $('body').text();
    const addressMatch = bodyText.match(/\d{1,5}\s[\w\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct),?\s*[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/i);

    // Try to find email
    const emailMatch = bodyText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    const contactEmail = emailMatch ? emailMatch[0] : null;

    // Try to find phone
    const phoneMatch = bodyText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

    return {
      name: ogTitle || title.split(/[|\-–—]/)[0].trim() || domain,
      domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      url: finalUrl,
      description: metaDesc || null,
      logo: ogImage || null,
      socials,
      contact: {
        email: contactEmail,
        phone: phoneMatch ? phoneMatch[0] : null,
        address: addressMatch ? addressMatch[0] : null
      },
      scraped: true
    };
  } catch (error) {
    return { domain, error: error.message, scraped: false };
  }
};

// ── DNS Enrichment ──────────────────────────────────
const enrichWithDns = async (domain) => {
  const clean = domain.replace(/^https?:\/\//, '').split('/')[0];
  try {
    const [mx, txt] = await Promise.allSettled([
      dns.resolveMx(clean),
      dns.resolveTxt(clean)
    ]);

    const mxRecords = mx.status === 'fulfilled' ? mx.value : [];
    const txtRecords = txt.status === 'fulfilled' ? txt.value.flat() : [];

    // Detect email provider from MX
    let emailProvider = 'unknown';
    const mxHost = mxRecords[0]?.exchange?.toLowerCase() || '';
    if (mxHost.includes('google') || mxHost.includes('gmail')) emailProvider = 'Google Workspace';
    else if (mxHost.includes('outlook') || mxHost.includes('microsoft')) emailProvider = 'Microsoft 365';
    else if (mxHost.includes('zoho')) emailProvider = 'Zoho Mail';
    else if (mxHost.includes('proton')) emailProvider = 'ProtonMail';
    else if (mxHost.includes('mimecast')) emailProvider = 'Mimecast';
    else if (mxRecords.length > 0) emailProvider = mxHost;

    // Detect SPF, DMARC from TXT
    const hasSPF = txtRecords.some(r => r.includes('v=spf1'));
    const hasDMARC = txtRecords.some(r => r.includes('v=DMARC1'));

    // Detect tech stack from TXT records
    const techSignals = [];
    for (const record of txtRecords) {
      if (record.includes('google-site-verification')) techSignals.push('Google Search Console');
      if (record.includes('facebook-domain-verification')) techSignals.push('Facebook Business');
      if (record.includes('hubspot')) techSignals.push('HubSpot');
      if (record.includes('salesforce')) techSignals.push('Salesforce');
      if (record.includes('atlassian')) techSignals.push('Atlassian');
      if (record.includes('docusign')) techSignals.push('DocuSign');
      if (record.includes('stripe')) techSignals.push('Stripe');
    }

    return {
      emailProvider,
      emailSecurity: { spf: hasSPF, dmarc: hasDMARC },
      techSignals: [...new Set(techSignals)],
      mxRecordCount: mxRecords.length
    };
  } catch (error) {
    return { emailProvider: 'unknown', emailSecurity: {}, techSignals: [], error: error.message };
  }
};

// ── Main Enrichment Function ────────────────────────
const enrichCompany = async (input) => {
  const startTime = Date.now();
  const domain = input.domain || null;
  const name = input.name || null;
  const linkedin = input.linkedin || null;

  let result = {
    input: { domain, name, linkedin },
    company: {},
    dns: {},
    enrichedAt: new Date().toISOString()
  };

  // Scrape website if domain provided
  if (domain) {
    const [siteData, dnsData] = await Promise.all([
      scrapeWebsite(domain),
      enrichWithDns(domain)
    ]);
    result.company = siteData;
    result.dns = dnsData;
  } else if (name) {
    // Try to guess domain from company name
    const guessedDomain = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    try {
      await dns.resolve(guessedDomain);
      const [siteData, dnsData] = await Promise.all([
        scrapeWebsite(guessedDomain),
        enrichWithDns(guessedDomain)
      ]);
      result.company = siteData;
      result.dns = dnsData;
    } catch {
      result.company = { name, scraped: false, note: 'Could not resolve domain. Provide domain directly for better results.' };
    }
  }

  result.processingMs = Date.now() - startTime;
  return result;
};

module.exports = { enrichCompany, scrapeWebsite, enrichWithDns };
