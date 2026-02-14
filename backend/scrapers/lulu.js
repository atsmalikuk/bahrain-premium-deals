const puppeteer = require('puppeteer');
const config = require('../config');

async function scrapeLulu() {
  const storeConfig = config.stores.lulu;
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(config.userAgent);
    await page.setViewport({ width: 1280, height: 800 });

    console.log(`[Lulu] Navigating to ${storeConfig.dealsUrl}`);
    await page.goto(storeConfig.dealsUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for product cards to load
    await page.waitForSelector('.product-item, .product-card, [data-product]', {
      timeout: 15000,
    }).catch(() => console.log('[Lulu] No product selector found, trying fallback'));

    const deals = await page.evaluate(() => {
      const items = [];
      // Try multiple selectors that Lulu may use
      const selectors = [
        '.product-item',
        '.product-card',
        '[data-product]',
        '.plp-card',
      ];

      let productElements = [];
      for (const sel of selectors) {
        productElements = document.querySelectorAll(sel);
        if (productElements.length > 0) break;
      }

      productElements.forEach((el, index) => {
        const title =
          el.querySelector('.product-name, .product-title, h3, h4')?.textContent?.trim() || '';
        const priceEl = el.querySelector('.special-price, .sale-price, .price--sale');
        const originalPriceEl = el.querySelector('.old-price, .regular-price, .price--regular');
        const imageEl = el.querySelector('img');

        if (!title) return;

        const discountedPrice = parseFloat(
          (priceEl?.textContent || '').replace(/[^0-9.]/g, '')
        ) || 0;
        const originalPrice = parseFloat(
          (originalPriceEl?.textContent || '').replace(/[^0-9.]/g, '')
        ) || discountedPrice;

        if (discountedPrice <= 0) return;

        const discount =
          originalPrice > discountedPrice
            ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
            : 0;

        items.push({
          title,
          originalPrice,
          discountedPrice,
          discount,
          image: imageEl?.src || '',
        });
      });

      return items;
    });

    console.log(`[Lulu] Scraped ${deals.length} deals`);

    return deals.map((deal, i) => ({
      id: `lulu-${i + 1}`,
      title: deal.title,
      originalPrice: deal.originalPrice,
      discountedPrice: deal.discountedPrice,
      discount: deal.discount,
      store: storeConfig.name,
      category: categorize(deal.title),
      location: 'Bahrain',
      image: deal.image || '',
      expiryDate: '',
      stock: 'Available',
      isYellowSticker: false,
      source: 'lulu',
    }));
  } catch (error) {
    console.error('[Lulu] Scraping failed:', error.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

function categorize(title) {
  const lower = title.toLowerCase();
  if (/salmon|fish|shrimp|prawns|tuna|crab|lobster|seafood/.test(lower)) return 'Seafood';
  if (/chicken|beef|lamb|meat|steak/.test(lower)) return 'Meat';
  if (/milk|cheese|yogurt|dairy|butter/.test(lower)) return 'Dairy';
  if (/apple|banana|mango|fruit|berry|grape/.test(lower)) return 'Fruits';
  if (/vegetable|tomato|potato|onion|carrot/.test(lower)) return 'Vegetables';
  if (/perfume|fragrance|cologne|edt|edp/.test(lower)) return 'Fragrances';
  if (/nuts|pistachio|almond|cashew/.test(lower)) return 'Premium Nuts';
  if (/dates|dried|raisin/.test(lower)) return 'Premium Dry Fruits';
  if (/phone|laptop|tv|electronic|samsung|apple|iphone/.test(lower)) return 'Electronics';
  return 'Groceries';
}

module.exports = scrapeLulu;
