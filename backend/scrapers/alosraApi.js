const axios = require('axios');
const config = require('../config');

/**
 * Scrapes deals from Alosra using their public GraphQL API.
 * Category "Alosra Savers" (ID: 161) contains 1000+ deal products.
 *
 * Note: Prices return as 0 from the anonymous API, so we include
 * product name, image, and SKU. The deals are still valuable as they
 * show what's on special offer at Alosra.
 */
const GRAPHQL_URL = 'https://www.alosraonline.com/graphql';

const QUERY = `
  query AlosraSavers($page: Int!, $pageSize: Int!) {
    products(
      filter: { category_id: { eq: "161" } }
      currentPage: $page
      pageSize: $pageSize
      sort: { name: ASC }
    ) {
      total_count
      items {
        name
        sku
        image { url }
        categories { name }
        price_range {
          minimum_price {
            regular_price { value currency }
            final_price { value currency }
            discount { amount_off percent_off }
          }
        }
      }
    }
  }
`;

async function scrapeAlosraApi() {
  try {
    console.log('[Alosra API] Fetching Alosra Savers via GraphQL...');

    // Fetch first 50 products from Alosra Savers category
    const response = await axios.post(
      GRAPHQL_URL,
      {
        query: QUERY,
        variables: { page: 1, pageSize: 50 },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': config.userAgent,
          Accept: 'application/json',
        },
        timeout: 15000,
      }
    );

    const data = response.data?.data?.products;
    if (!data || !data.items) {
      console.log('[Alosra API] No data returned');
      return [];
    }

    console.log(`[Alosra API] Total available: ${data.total_count}, fetched: ${data.items.length}`);

    const deals = data.items
      .filter(item => item.name) // Filter out items without names
      .map((item, i) => {
        const priceInfo = item.price_range?.minimum_price || {};
        const regularPrice = priceInfo.regular_price?.value || 0;
        const finalPrice = priceInfo.final_price?.value || 0;
        const discountPercent = priceInfo.discount?.percent_off || 0;

        // Use actual prices if available, otherwise mark as deal without price
        const originalPrice = regularPrice > 0 ? regularPrice : 0;
        const discountedPrice = finalPrice > 0 ? finalPrice : 0;

        return {
          id: `alosra-${item.sku || i + 1}`,
          title: item.name,
          originalPrice,
          discountedPrice,
          discount: discountPercent || (originalPrice > discountedPrice && discountedPrice > 0
            ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
            : 0),
          store: 'Alosra',
          category: categorizeFromAlosra(item.categories, item.name),
          location: 'Bahrain',
          image: item.image?.url || '',
          expiryDate: '',
          stock: 'Available',
          isYellowSticker: false,
          source: 'alosra-api',
        };
      });

    console.log(`[Alosra API] Scraped ${deals.length} deals`);
    return deals;
  } catch (error) {
    console.error('[Alosra API] Scraping failed:', error.message);
    return [];
  }
}

function categorizeFromAlosra(categories, title) {
  // Try to use the Alosra category data first
  if (categories && categories.length > 0) {
    const catNames = categories.map(c => c.name.toLowerCase());
    for (const cat of catNames) {
      if (cat.includes('meat') || cat.includes('poultry')) return 'Meat';
      if (cat.includes('fish') || cat.includes('seafood')) return 'Seafood';
      if (cat.includes('dairy') || cat.includes('milk') || cat.includes('cheese')) return 'Dairy';
      if (cat.includes('fruit')) return 'Fruits';
      if (cat.includes('vegetable')) return 'Vegetables';
      if (cat.includes('bread') || cat.includes('bakery')) return 'Bakery';
      if (cat.includes('beverage') || cat.includes('drink') || cat.includes('juice')) return 'Beverages';
      if (cat.includes('snack') || cat.includes('chocolate') || cat.includes('candy')) return 'Snacks';
      if (cat.includes('cleaning') || cat.includes('household')) return 'Household';
      if (cat.includes('baby')) return 'Baby';
      if (cat.includes('health') || cat.includes('beauty') || cat.includes('personal')) return 'Health & Beauty';
    }
  }

  // Fallback to title-based categorization
  const lower = (title || '').toLowerCase();
  if (/salmon|fish|shrimp|prawns|tuna|crab|lobster|seafood/.test(lower)) return 'Seafood';
  if (/chicken|beef|lamb|meat|steak/.test(lower)) return 'Meat';
  if (/milk|cheese|yogurt|dairy|butter/.test(lower)) return 'Dairy';
  if (/rice|oil|sugar|flour|spice/.test(lower)) return 'Groceries';
  return 'Groceries';
}

module.exports = scrapeAlosraApi;
