'use strict';

require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { router: authRouter } = require('./src/routes/auth');
const productRouter = require('./src/routes/product');

const app = express();
const PORT = process.env.PORT || 3000;

// Apply a global rate limiter to protect all routes (including static file serving).
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // max requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve static frontend files.
app.use(limiter);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Mount routers.
app.use('/auth', authRouter);
app.use('/api/product', productRouter);

// Fallback – serve index.html for any unmatched route so the SPA works.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Only start listening when this file is run directly (not when required in tests).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Produtos Mercado Livre server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
