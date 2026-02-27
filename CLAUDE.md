# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time Fund Valuation (基估宝) - A pure frontend fund valuation and top holdings tracking tool built with Next.js. Features glassmorphism design, mobile responsiveness, and real-time arbitrage opportunity detection.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production (outputs to 'out' directory)
npm run start    # Start production server
npm run lint     # Run ESLint
npm run lint:fix # Run ESLint with auto-fix
```

## Architecture

### Static Export Configuration

This project uses Next.js static export (`output: 'export'` in next.config.js) with React Compiler enabled. All pages must be pre-renderable at build time - no server-side rendering or API routes that require a server.

### Data Fetching Pattern

All external data is fetched client-side using JSONP/script tag injection to bypass CORS:

- **Fund data**: 天天基金 (fundgz.1234567.com.cn) via JSONP callback `jsonpgz`
- **Real-time quotes**: 腾讯财经 (qt.gtimg.cn) via global variables like `v_sh000001`
- **Holdings data**: 东方财富 (fundf10.eastmoney.com) via HTML parsing in `window.apidata`
- **Fund search**: 东方财富基金搜索 API via JSONP

Key API files:
- `app/api/fund.js` - Fund data, history, search, holdings
- `app/api/lofEtf.js` - LOF/ETF quotes, IOPV, premium/discount calculation
- `app/lib/cacheRequest.js` - Request caching utility

### State Management

Uses React hooks with localStorage persistence. Key localStorage keys (see `doc/localStorage 数据结构.md`):
- `funds` - User's fund list
- `holdings` - Position data (share, cost)
- `favorites` - Favorite fund codes
- `groups` - User-defined fund groups
- `pendingTrades` - Trades pending net value update

### Authentication

Two modes:
1. **Local auth** (`app/lib/localAuth.js`) - PBKDF2+SHA-256 hashed passwords in localStorage
2. **Supabase auth** (`app/lib/supabase.js`) - Optional cloud auth via OTP email

Supabase is optional - gracefully degrades to no-op when not configured.

### Arbitrage Feature

The `/arbitrage` page provides LOF/ETF arbitrage analysis:
- `app/lib/arbitrageCalculator.js` - Premium/discount calculation, fee computation, profit analysis
- `app/components/arbitrage/` - Arbitrage UI components
- Fee configuration for LOF (subscription, redemption, commission) and ETF (commission only)

### Key Components

- `app/page.jsx` - Main page (~180KB, contains all fund list logic)
- `app/components/TradeModal.jsx` - Buy/sell operations
- `app/components/SettingsModal.jsx` - Refresh interval, view mode settings
- `app/components/FundTrendChart.jsx` - Chart.js performance chart

### Environment Variables

Copy `env.example` to `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase (optional)
- `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` - Feedback form (optional)
- `NEXT_PUBLIC_GA_ID` - Google Analytics (optional)

## Development Notes

### JSONP Pattern

When adding new data sources, use the script tag injection pattern:
```javascript
const script = document.createElement('script');
script.src = `https://api.example.com/data?callback=myCallback&_=${Date.now()}`;
window.myCallback = (data) => { /* handle data */ };
document.body.appendChild(script);
```

Always clean up: remove script tag and callback after response.

### Chinese Language

This is a Chinese language application. UI text, comments, and documentation are in Chinese. Keep this consistent when adding new features.

### Mobile Responsiveness

Use CSS media queries and viewport units. The `globals.css` contains mobile-specific styles. Test changes on mobile viewport sizes.

### Adding New Fund Types

When adding support for new fund types (e.g., new ETFs):
1. Add to `LOF_ETF_LIST` in `app/api/lofEtf.js`
2. Update market prefix logic in `getMarketPrefix()` if needed
3. Ensure the fund code format is handled in quote fetching
