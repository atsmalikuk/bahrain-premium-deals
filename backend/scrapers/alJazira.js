const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');

async function scrapeAlJazira() {
  const storeConfig = config.stores.alJazira;

  try {
    console.log(`[Al Jazira] Fetching ${storeConfig.baseUrl}`);

    // Try the main site first (Magento 2 SSR)
    const response = await axios.get(storeConfig.baseUrl + '/offers', {
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const deals = [];

    // Try common Magento 2 product selectors
    const selectors = [
      '.product-item',
      '.product-items .product-item',
      '.products-grid .item',
      '.category-products .item',
    ];

    let productElements;
    for (const sel of selectors) {
      productElements = $(sel);
      if (productElements.length > 0) break;
    }

    if (productElements && productElements.length > 0) {
      productElements.each((i, el) => {
        const $el = $(el);
        const title = $el.find('.product-item-name, .product-name, h3 a, h4 a').text().trim();
        const specialPrice = parseFloat(
          ($el.find('.special-price .price, .sale-price').text() || '').replace(/[^0-9.]/g, '')
        ) || 0;
        const originalPrice = parseFloat(
          ($el.find('.old-price .price, .regular-price .price').text() || '').replace(/[^0-9.]/g, '')
        ) || specialPrice;
        const image = $el.find('img').attr('src') || '';

        if (!title || specialPrice <= 0) return;

        const discount =
          originalPrice > specialPrice
            ? Math.round(((originalPrice - specialPrice) / originalPrice) * 100)
            : 0;

        deals.push({
          id: `aljazira-${i + 1}`,
          title,
          originalPrice,
          discountedPrice: specialPrice,
          discount,
          store: storeConfig.name,
          category: categorize(title),
          location: 'Bahrain',
          image,
          expiryDate: '',
          stock: 'Available',
          isYellowSticker: false,
          source: 'aljazira',
        });
      });
    }

    // Also try the catalog aggregator site
    if (deals.length === 0) {
      try {
        const catalogResponse = await axios.get(storeConfig.catalogUrl, {
          headers: {
            'User-Agent': config.userAgent,
            Accept: 'text/html,application/xhtml+xml',
          },
          timeout: 15000,
        });

        const $cat = cheerio.load(catalogResponse.data);
        $cat('.catalog-item, .offer-item, .product-card').each((i, el) => {
          const $el = $cat(el);
          const title = $el.find('h3, h4, .title, .product-name').text().trim();
          const priceText = $el.find('.price, .offer-price').text().replace(/[^0-9.]/g, '');
          const price = parseFloat(priceText) || 0;

          if (title && price > 0) {
            deals.push({
              id: `aljazira-cat-${i + 1}`,
              title,
              originalPrice: price,
              discountedPrice: price,
              discount: 0,
              store: storeConfig.name,
              category: categorize(title),
              location: 'Bahrain',
              image: $el.find('img').attr('src') || '',
              expiryDate: '',
              stock: 'Available',
              isYellowSticker: false,
              source: 'aljazira',
            });
          }
        });
      } catch (catErr) {
        console.log('[Al Jazira] Catalog fetch failed:', catErr.message);
      }
    }

    console.log(`[Al Jazira] Scraped ${deals.length} deals`);
    return deals;
  } catch (error) {
    console.error('[Al Jazira] Scraping failed:', error.message);
    return [];
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

module.exports = scrapeAlJazira;
