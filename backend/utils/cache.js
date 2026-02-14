class DealsCache {
  constructor() {
    this.deals = new Map();
    this.lastUpdated = null;
  }

  set(store, deals) {
    this.deals.set(store, deals);
    this.lastUpdated = new Date().toISOString();
  }

  get(store) {
    return this.deals.get(store) || [];
  }

  getAllDeals() {
    const all = [];
    for (const deals of this.deals.values()) {
      all.push(...deals);
    }
    return all;
  }

  getLastUpdated() {
    return this.lastUpdated;
  }

  clear() {
    this.deals.clear();
    this.lastUpdated = null;
  }
}

module.exports = new DealsCache();
