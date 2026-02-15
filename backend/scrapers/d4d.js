const puppeteer = require('puppeteer');
const config = require('../config');

/**
 * Scrapes deals from D4D Online — a Bahrain deal aggregator that covers
 * Lulu, HyperMax, Nesto, eXtra, Sharaf DG, Ansar Gallery, and more.
 *
 * URL: https://d4donline.com/en/bahrain/bahrain/products
 */
async function scrapeD4D() {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(config.userAgent);
    await page.setViewport({ width: 1280, height: 800 });

    console.log('[D4D] Navigating to products page...');
    await page.goto('https://d4donline.com/en/bahrain/bahrain/products', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Wait for product content to render
    await page.waitForSelector('img[src*="cdn.d4donline.com"]', {
      timeout: 20000,
    }).catch(() => console.log('[D4D] Waiting for images timed out, trying anyway'));

    // Scroll to load more products
    await autoScroll(page);

    const deals = await page.evaluate(() => {
      const items = [];

      // D4D renders products in divs containing: image, discount span, price spans, store span
      // We find all product images from CDN, then walk up to the parent card
      const images = document.querySelectorAll('img[src*="cdn.d4donline.com/u/"]');

      images.forEach((img, index) => {
        try {
          // Walk up to the product card container (usually 2-3 levels up)
          let card = img.closest('div');
          // Go up until we find a container with price info
          for (let i = 0; i < 5 && card; i++) {
            const text = card.textContent || '';
            if (text.includes('BHD') && text.includes('Off')) break;
            card = card.parentElement;
          }

          if (!card) return;

          const cardText = card.textContent || '';

          // Extract discount percentage: "XX % Off" or "XX% Off"
          const discountMatch = cardText.match(/(\d+(?:\.\d+)?)\s*%\s*Off/i);
          const discount = discountMatch ? parseFloat(discountMatch[1]) : 0;

          // Extract prices: "BHD X.XXX" patterns
          const priceMatches = cardText.match(/BHD\s*([\d.]+)/g) || [];
          const prices = priceMatches
            .map(p => parseFloat(p.replace('BHD', '').trim()))
            .filter(p => p > 0);

          // Higher price is original, lower is discounted
          let originalPrice = 0;
          let discountedPrice = 0;
          if (prices.length >= 2) {
            originalPrice = Math.max(...prices);
            discountedPrice = Math.min(...prices);
          } else if (prices.length === 1) {
            discountedPrice = prices[0];
            originalPrice = prices[0];
          }

          if (discountedPrice <= 0) return;

          // Extract store name — look for known store names in the card
          const storeNames = [
            'LuLu Hypermarket', 'Lulu Hypermarket',
            'HyperMax', 'Hyper Max',
            'Sharaf DG',
            'eXtra', 'Extra',
            'NESTO', 'Nesto',
            'Ansar Gallery',
            'Taj Mobiles',
            'Arafa Phones',
            'Carrefour',
            'Ramez',
          ];
          let store = 'Unknown Store';
          const spans = card.querySelectorAll('span, a, p, div');
          for (const el of spans) {
            const t = (el.textContent || '').trim();
            for (const s of storeNames) {
              if (t.toLowerCase().includes(s.toLowerCase())) {
                store = s;
                break;
              }
            }
            if (store !== 'Unknown Store') break;
          }

          // Try to extract product name from links or heading-like elements
          let title = '';
          const links = card.querySelectorAll('a');
          for (const link of links) {
            const linkText = (link.textContent || '').trim();
            if (linkText.length > 5 && !linkText.includes('BHD') && !linkText.includes('Off') && !storeNames.some(s => linkText.toLowerCase().includes(s.toLowerCase()))) {
              title = linkText;
              break;
            }
          }

          // Fallback: use store + product index as title
          if (!title) {
            title = `${store} Deal #${index + 1}`;
          }

          items.push({
            title: title.substring(0, 200),
            originalPrice,
            discountedPrice,
            discount: discount || (originalPrice > discountedPrice
              ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
              : 0),
            store,
            image: img.src || '',
          });
        } catch (e) {
          // Skip malformed cards
        }
      });

      return items;
    });

    console.log(`[D4D] Scraped ${deals.length} deals`);

    return deals.map((deal, i) => ({
      id: `d4d-${deal.store.replace(/\s+/g, '-').toLowerCase()}-${i + 1}`,
      title: deal.title,
      originalPrice: deal.originalPrice,
      discountedPrice: deal.discountedPrice,
      discount: deal.discount,
      store: normalizeStoreName(deal.store),
      category: categorize(deal.title),
      location: 'Bahrain',
      image: deal.image,
      expiryDate: '',
      stock: 'Available',
      isYellowSticker: false,
      source: 'd4d',
    }));
  } catch (error) {
    console.error('[D4D] Scraping failed:', error.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

function normalizeStoreName(name) {
  const map = {
    'lulu hypermarket': 'Lulu Hypermarket',
    'hypermax': 'HyperMax',
    'hyper max': 'HyperMax',
    'sharaf dg': 'Sharaf DG',
    'extra': 'eXtra',
    'nesto': 'Nesto',
    'ansar gallery': 'Ansar Gallery',
    'taj mobiles': 'Taj Mobiles',
    'arafa phones': 'Arafa Phones',
    'carrefour': 'Carrefour',
    'ramez': 'Ramez',
  };
  return map[name.toLowerCase()] || name;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight || totalHeight > 8000) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
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
  if (/phone|laptop|tv|television|electronic|samsung|iphone|airpod|galaxy|ipad|macbook/.test(lower)) return 'Electronics';
  if (/washer|fridge|refrigerator|microwave|oven|blender|appliance/.test(lower)) return 'Appliances';
  if (/rice|oil|sugar|flour|spice|coffee|tea/.test(lower)) return 'Groceries';
  return 'Groceries';
}

module.exports = scrapeD4D;
