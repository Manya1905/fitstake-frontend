# FitStake Frontend

React PWA frontend for FitStake — a decentralized fitness accountability platform on Base.

## Tech Stack

- **React** (Create React App) with Progressive Web App support
- **Privy** for embedded wallet authentication (email login -> smart wallet)
- **viem** for contract interactions
- **Coinbase Smart Wallets** with paymaster for gasless transactions
- **Cloudinary** for proof media uploads (photos/videos)
- **react-hot-toast** for notifications

## Features

- Mobile-first PWA — installable on iOS/Android
- Gasless UX — users never need to hold ETH
- Email-based login via Privy (no browser extension required)
- Photo/video proof upload with Cloudinary
- Strava and Fitbit integration for automatic fitness data
- Real-time challenge status and countdown timers

## Setup

```bash
npm install --legacy-peer-deps
cp .env.example .env
# Fill in your Privy app ID and other config values
npm start
```

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `REACT_APP_PRIVY_APP_ID` — Required. Get from [Privy dashboard](https://dashboard.privy.io)
- `REACT_APP_CLOUDINARY_CLOUD_NAME` / `REACT_APP_CLOUDINARY_UPLOAD_PRESET` — For proof uploads
- `REACT_APP_BACKEND_URL` — Backend API URL (defaults to localhost:3001)

## Related Repos

- [fitstake](https://github.com/Manya1905/fitstake) — Smart contract
- [fitstake-backend](https://github.com/Manya1905/fitstake-backend) — Backend API
