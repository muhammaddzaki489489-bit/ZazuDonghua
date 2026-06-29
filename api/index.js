const express = require('express');
const cors = require('cors');
const DonghubScraper = require('../scraper'); // Naik satu folder ke root

const app = express();
const scraper = new DonghubScraper();

app.use(cors());
app.use(express.json());

// Endpoint tetap sama seperti sebelumnya
app.get('/api/home', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await scraper.home(page);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    if (!query) return res.status(400).json({ error: 'Query required' });
    const data = await scraper.search(query, page);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/detail/:slug', async (req, res) => {
  try {
    const data = await scraper.detail(req.params.slug);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/episode/:slug', async (req, res) => {
  try {
    const data = await scraper.episode(req.params.slug);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WAJIB DIUBAH: Export app untuk arsitektur serverless Vercel
module.exports = app;
