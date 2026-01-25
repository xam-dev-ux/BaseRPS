# Base Ecosystem Listing Submission Guide

This document contains all the information needed to submit BaseRPS to the Base Ecosystem page.

## Submission Checklist

- [x] Terms of Service page (`/terms`)
- [x] Privacy Policy page (`/privacy`)
- [x] Logo 192x192px (`frontend/public/icon-192.png`)
- [x] HTTPS support
- [x] Active on Base network
- [ ] Active for 30+ days (verify deployment date)

## Steps to Submit

### 1. Fork the Repository

```bash
git clone https://github.com/base/web.git
cd web
```

### 2. Create a New Branch

```bash
git checkout -b add-baserps
```

### 3. Add Logo

Copy your logo to the partners directory:

```bash
cp /path/to/icon-192.png apps/web/public/images/partners/baserps.png
```

**Logo location in this project:** `frontend/public/icon-192.png`

### 4. Update ecosystem.json

Add this entry to `apps/web/src/data/ecosystem.json`:

```json
{
  "name": "BaseRPS",
  "description": "PvP Rock Paper Scissors with ETH wagers. Commit-reveal gameplay, overtime system, and Farcaster integration.",
  "url": "https://baserps.xyz",
  "imageUrl": "/images/partners/baserps.png",
  "category": "consumer",
  "subcategory": "gaming"
}
```

> **Note:** Update the `url` field with your actual production URL.

### 5. Test Locally

```bash
yarn install
yarn workspace @app/web dev
```

### 6. Build

```bash
yarn workspace @app/web build
```

### 7. Create Pull Request

Create a PR with the following information:

**Title:** `Add BaseRPS to ecosystem`

**Description:**

```markdown
## Project Information

**Name:** BaseRPS
**Category:** Consumer > Gaming
**Website:** https://baserps.xyz

## Description

BaseRPS is a decentralized PvP Rock Paper Scissors game built on Base. Players can wager ETH in matches with the following features:

- **Commit-reveal mechanism** for fair, front-running-resistant gameplay
- **Multiple game modes:** Best of 1, 3, or 5 rounds
- **Overtime system:** Up to 10 ties per round with automatic draw resolution
- **Private matches:** Create invite-only games with access codes
- **Player statistics:** Track wins, losses, streaks, and leaderboard position
- **Farcaster integration:** Native Frame support for social gameplay

## Technical Stack

- **Smart Contracts:** Solidity with OpenZeppelin (ReentrancyGuard, Pausable)
- **Frontend:** React + Vite + TypeScript
- **Web3:** Wagmi + Viem + ConnectKit
- **Network:** Base Mainnet

## Links

- Website: https://baserps.xyz
- Contract: [Add Basescan link]
- GitHub: https://github.com/xabierbr/BaseRPS
- Terms of Service: https://baserps.xyz/terms
- Privacy Policy: https://baserps.xyz/privacy
```

## Alternative Description (Shorter)

If a shorter description is preferred:

```json
{
  "name": "BaseRPS",
  "description": "PvP Rock Paper Scissors on Base. Wager ETH with commit-reveal mechanics and instant payouts.",
  "url": "https://baserps.xyz",
  "imageUrl": "/images/partners/baserps.png",
  "category": "consumer",
  "subcategory": "gaming"
}
```

## Important Notes

1. **URL:** Make sure your production URL is live and accessible
2. **HTTPS:** Ensure your site uses HTTPS with proper redirects
3. **30-day requirement:** Submissions should be active on Base for at least 30 days
4. **Review process:** Submissions are reviewed and inclusion is not guaranteed
5. **Media rights:** By submitting, you authorize Coinbase to use your logo and assets for Base-related purposes
