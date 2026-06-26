/**
 * Local / VPS server — serves static site + contact API
 *
 * Usage:
 *   1. Copy .env.example to .env and fill in SMTP credentials
 *   2. npm run start
 *   3. Open http://localhost:3000
 */
require('dotenv').config();

const path = require('path');
const express = require('express');
const { handleContactRequest } = require('../lib/contact-handler');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');

app.use(express.json({ limit: '32kb' }));

app.post('/api/contact', async (req, res) => {
  const result = await handleContactRequest(req.body || {});
  res.status(result.status).json(result.body);
});

app.use(express.static(ROOT));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const file = path.join(ROOT, req.path === '/' ? 'index.html' : req.path);
  if (file.endsWith('.html') || !path.extname(req.path)) {
    const htmlPath = file.endsWith('.html') ? file : file + '.html';
    return res.sendFile(htmlPath, (err) => {
      if (err) res.sendFile(path.join(ROOT, 'index.html'));
    });
  }
  next();
});

app.listen(PORT, () => {
  console.log('HVTDEVIL server running at http://localhost:' + PORT);
  console.log('Contact API: POST http://localhost:' + PORT + '/api/contact');
  if (!process.env.SUPPORT_EMAIL) {
    console.warn('Warning: SUPPORT_EMAIL is not set — contact form will fail until configured.');
  }
});
