const express = require('express');
const router = express.Router();
const cache = require('../utils/cache');

// GET /api/deals
router.get('/', (req, res) => {
  let deals = cache.getAllDeals();

  // Optional filters
  const { store, category } = req.query;

  if (store) {
    deals = deals.filter(
      (d) => d.source === store.toLowerCase() || d.store.toLowerCase().includes(store.toLowerCase())
    );
  }

  if (category) {
    deals = deals.filter(
      (d) => d.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  res.json({
    success: true,
    lastUpdated: cache.getLastUpdated(),
    count: deals.length,
    deals,
  });
});

// GET /api/deals/stores - list available stores
router.get('/stores', (req, res) => {
  const deals = cache.getAllDeals();
  const stores = [...new Set(deals.map((d) => d.store))];
  res.json({ success: true, stores });
});

module.exports = router;
