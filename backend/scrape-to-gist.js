/**
 * Standalone scraper script for GitHub Actions.
 * Runs all store scrapers and uploads results to a GitHub Gist.
 *
 * Required environment variables:
 *   GH_TOKEN  - GitHub Personal Access Token with "gist" scope
 *   GIST_ID   - ID of the Gist to update
 */

const axios = require('axios');
const scrapeLulu = require('./scrapers/lulu');
const scrapeAlJazira = require('./scrapers/alJazira');
const scrapeAlosra = require('./scrapers/alosra');
const scrapeHyperMax = require('./scrapers/hypermax');

const GH_TOKEN = process.env.GH_TOKEN;
const GIST_ID = process.env.GIST_ID;

if (!GH_TOKEN || !GIST_ID) {
  console.error('Missing required environment variables: GH_TOKEN and GIST_ID');
  process.exit(1);
}

const scrapers = [
  { name: 'lulu', fn: scrapeLulu },
  { name: 'aljazira', fn: scrapeAlJazira },
  { name: 'alosra', fn: scrapeAlosra },
  { name: 'hypermax', fn: scrapeHyperMax },
];

async function runScrapers() {
  const allDeals = [];

  for (const scraper of scrapers) {
    try {
      console.log(`Scraping ${scraper.name}...`);
      const deals = await scraper.fn();
      allDeals.push(...deals);
      console.log(`  -> ${deals.length} deals found`);
    } catch (error) {
      console.error(`  -> ${scraper.name} failed: ${error.message}`);
    }
  }

  return allDeals;
}

async function updateGist(deals) {
  const payload = {
    success: true,
    lastUpdated: new Date().toISOString(),
    count: deals.length,
    deals,
  };

  console.log(`\nUploading ${deals.length} deals to Gist ${GIST_ID}...`);

  await axios.patch(
    `https://api.github.com/gists/${GIST_ID}`,
    {
      files: {
        'deals.json': {
          content: JSON.stringify(payload, null, 2),
        },
      },
    },
    {
      headers: {
        Authorization: `token ${GH_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  console.log('Gist updated successfully!');
}

async function main() {
  console.log('=== Bahrain Deals Scraper ===');
  console.log(`Time: ${new Date().toISOString()}\n`);

  const deals = await runScrapers();
  console.log(`\nTotal deals scraped: ${deals.length}`);

  if (deals.length === 0) {
    console.log('No deals scraped. Gist will not be updated.');
    return;
  }

  await updateGist(deals);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
