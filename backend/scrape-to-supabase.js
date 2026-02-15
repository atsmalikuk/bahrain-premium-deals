/**
 * Standalone scraper script for GitHub Actions.
 * Runs all store scrapers and upserts results into Supabase.
 *
 * Required environment variables:
 *   SUPABASE_URL         - Supabase project URL
 *   SUPABASE_SERVICE_KEY  - Supabase service_role key (NOT the anon key)
 */

const { createClient } = require('@supabase/supabase-js');
const scrapeD4D = require('./scrapers/d4d');
const scrapeAlosraApi = require('./scrapers/alosraApi');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const scrapers = [
  { name: 'd4d', fn: scrapeD4D },
  { name: 'alosra-api', fn: scrapeAlosraApi },
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

function toDbRow(deal) {
  return {
    id: deal.id || `${deal.store}-${deal.title}`.replace(/\s+/g, '-').toLowerCase(),
    title: deal.title,
    original_price: deal.originalPrice ?? null,
    discounted_price: deal.discountedPrice ?? null,
    discount: deal.discount ?? null,
    store: deal.store,
    category: deal.category || 'Groceries',
    location: deal.location || 'Bahrain',
    image: deal.image || null,
    expiry_date: deal.expiryDate || null,
    stock: deal.stock || 'Available',
    is_yellow_sticker: deal.isYellowSticker || false,
    source: deal.source || null,
    updated_at: new Date().toISOString(),
  };
}

function isExpired(deal) {
  const expiry = deal.expiryDate || deal.expiry_date;
  if (!expiry) return false;
  const expiryDate = new Date(expiry);
  return !isNaN(expiryDate.getTime()) && expiryDate < new Date();
}

async function upsertDeals(deals) {
  const rows = deals.map(toDbRow);

  console.log(`\nUpserting ${rows.length} deals into Supabase...`);

  const { data, error } = await supabase
    .from('deals')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  console.log('Upsert successful!');
}

async function deleteStaleDeals(freshIds) {
  console.log('Removing stale deals...');

  const { data, error } = await supabase
    .from('deals')
    .delete()
    .not('id', 'in', `(${freshIds.join(',')})`);

  if (error) {
    console.error(`Failed to delete stale deals: ${error.message}`);
  } else {
    console.log('Stale deals removed.');
  }
}

async function deleteExpiredDeals() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`Removing expired deals (before ${today})...`);

  const { data, error } = await supabase
    .from('deals')
    .delete()
    .lt('expiry_date', today)
    .not('expiry_date', 'is', null);

  if (error) {
    console.error(`Failed to delete expired deals: ${error.message}`);
  } else {
    console.log('Expired deals removed.');
  }
}

async function main() {
  console.log('=== Bahrain Deals Scraper (Supabase) ===');
  console.log(`Time: ${new Date().toISOString()}\n`);

  const allDeals = await runScrapers();
  console.log(`\nTotal deals scraped: ${allDeals.length}`);

  // Filter out expired deals
  const deals = allDeals.filter(d => !isExpired(d));
  const expiredCount = allDeals.length - deals.length;
  if (expiredCount > 0) {
    console.log(`Excluded ${expiredCount} expired deals.`);
  }
  console.log(`Active deals to save: ${deals.length}`);

  if (deals.length === 0) {
    console.log('No active deals. Database will not be updated.');
    return;
  }

  await upsertDeals(deals);

  const freshIds = deals.map(d =>
    d.id || `${d.store}-${d.title}`.replace(/\s+/g, '-').toLowerCase()
  );
  await deleteStaleDeals(freshIds);

  // Also delete any expired deals already in the DB
  await deleteExpiredDeals();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
