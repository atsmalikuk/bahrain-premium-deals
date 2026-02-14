module.exports = {
  port: process.env.PORT || 3000,
  scrapeInterval: '*/30 * * * *', // Every 30 minutes
  stores: {
    lulu: {
      name: 'Lulu Hypermarket',
      baseUrl: 'https://gcc.luluhypermarket.com/en-bh',
      dealsUrl: 'https://gcc.luluhypermarket.com/en-bh/deals/',
      method: 'puppeteer',
    },
    alJazira: {
      name: 'Al Jazira',
      baseUrl: 'https://www.aljazirasupermarkets.com',
      catalogUrl: 'https://bh.ilofo.com/en/al-jazira/catalogs',
      method: 'cheerio',
    },
    alosra: {
      name: 'Alosra',
      baseUrl: 'https://www.alosraonline.com',
      dealsUrl: 'https://www.alosraonline.com/offers',
      method: 'puppeteer',
    },
    hypermax: {
      name: 'HyperMax',
      baseUrl: 'https://www.hypermaxbh.com',
      dealsUrl: 'https://www.hypermaxbh.com/offers',
      method: 'puppeteer',
    },
  },
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};
