# Produtos-Mercado-Livre

A Node.js/Express application that authenticates with Mercado Livre via OAuth 2.0 (Authorization Code flow) and lets you look up product information using the official Mercado Livre Items API.

---

## Features

- **Mercado Livre OAuth 2.0** – Authorization Code flow using the official developer API.
- **Product lookup** – Accepts a full Mercado Livre product URL *or* a raw item ID (e.g. `MLB12345678`) and returns product data.
- **Automatic token refresh** – The server refreshes expired access tokens transparently.
- **Simple web UI** – A minimal single-page frontend with a "Conectar com Mercado Livre" button and a product search field.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |

---

## Setup

### 1. Register a Mercado Livre application

1. Go to <https://developers.mercadolivre.com.br/> and log in.
2. Create a new application.
3. In the application settings, add the following **redirect URI**:
   ```
   http://localhost:3000/auth/callback
   ```
   (Adjust the host/port if you deploy elsewhere.)
4. Note your **App ID (Client ID)** and **Secret key (Client Secret)**.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `MELI_CLIENT_ID` | Your application's App ID (Client ID) |
| `MELI_CLIENT_SECRET` | Your application's Secret key |
| `MELI_REDIRECT_URI` | The redirect URI you registered (e.g. `http://localhost:3000/auth/callback`) |
| `PORT` | Port for the local server (default: `3000`) |

### 3. Install dependencies

```bash
npm install
```

### 4. Start the server

```bash
npm start
```

Open <http://localhost:3000> in your browser.

---

## Usage

1. Click **"Conectar com Mercado Livre"** and complete the OAuth login flow.
2. After being redirected back, the badge changes to **"Conectado"**.
3. Paste a product URL (e.g. `https://www.mercadolivre.com.br/produto/MLB49821529`) or a raw item ID (e.g. `MLB49821529`) in the search field and press **Buscar**.
4. The product title, price, thumbnail, and full JSON response are displayed.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/login` | Redirects to Mercado Livre authorization page |
| `GET` | `/auth/callback` | OAuth callback — exchanges code for tokens |
| `GET` | `/auth/status` | Returns `{ authenticated: true/false }` |
| `POST` | `/auth/logout` | Clears the stored tokens |
| `GET` | `/api/product?q=<URL or ID>` | Returns product data from the Mercado Livre Items API |

---

## Running Tests

```bash
npm test
```

Tests cover:

- **Unit tests** – `extractItemId` utility: raw IDs, various URL formats, edge cases.
- **Integration tests** – `/api/product` endpoint with mocked HTTP calls: missing query, invalid ID, no token, successful lookup, 404 and 403 handling.

---

## Project Structure

```
.
├── public/
│   └── index.html          # Single-page frontend
├── src/
│   ├── routes/
│   │   ├── auth.js         # OAuth routes + token refresh helper
│   │   └── product.js      # Product lookup endpoint
│   └── utils/
│       ├── extractItemId.js # Item ID extraction from URLs / raw IDs
│       └── tokenStore.js    # In-memory token store (TODO: persist in production)
├── tests/
│   ├── extractItemId.test.js
│   └── product.test.js
├── server.js               # Express app entry point
├── .env.example            # Environment variable template
└── package.json
```

---

## Security Notes

- **Secrets are never exposed to the frontend.** `MELI_CLIENT_SECRET` is used only server-side.
- The current token store is **in-memory** and is lost on server restart.
  - **TODO**: Replace `src/utils/tokenStore.js` with a persistent, encrypted store (e.g. a database) before deploying to production.
- Never commit your `.env` file (it is listed in `.gitignore`).
