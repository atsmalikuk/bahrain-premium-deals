const cache = require('../utils/cache');
const scrapeLulu = require('./lulu');
const scrapeAlJazira = require('./alJazira');
const scrapeAlosra = require('./alosra');
const scrapeHyperMax = require('./hypermax');

const scrapers = [
  { name: 'lulu', fn: scrapeLulu },
  { name: 'aljazira', fn: scrapeAlJazira },
  { name: 'alosra', fn: scrapeAlosra },
  { name: 'hypermax', fn: scrapeHyperMax },
];

async function scrapeAll() {
  console.log('\n=== Starting scrape of all stores ===');
  console.log(`Time: ${new Date().toISOString()}\n`);

  for (const scraper of scrapers) {
    try {
      console.log(`Scraping ${scraper.name}...`);
      const deals = await scraper.fn();
      cache.set(scraper.name, deals);
      console.log(`${scraper.name}: ${deals.length} deals cached\n`);
    } catch (error) {
      console.error(`${scraper.name} failed:`, error.message);
      // Keep existing cached data on failure
    }
  }

  const total = cache.getAllDeals().length;
  console.log(`=== Scrape complete. Total deals cached: ${total} ===\n`);
}

module.exports = { scrapeAll };
