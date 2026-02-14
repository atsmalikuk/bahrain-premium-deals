const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const config = require('./config');
const dealsRouter = require('./routes/deals');
const { scrapeAll } = require('./scrapers');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/deals', dealsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(config.port, () => {
  console.log(`Bahrain Deals API running on http://localhost:${config.port}`);
  console.log(`Deals endpoint: http://localhost:${config.port}/api/deals`);

  // Run initial scrape
  console.log('\nRunning initial scrape...');
  scrapeAll().catch((err) => console.error('Initial scrape error:', err.message));

  // Schedule recurring scrapes
  cron.schedule(config.scrapeInterval, () => {
    console.log('\n[Cron] Scheduled scrape triggered');
    scrapeAll().catch((err) => console.error('Scheduled scrape error:', err.message));
  });
});
