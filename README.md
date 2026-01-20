# BaseRPS - Battle for ETH

PvP Rock Paper Scissors dApp on Base Network with commit-reveal mechanics, overtime system, and multi-wallet commission distribution.

## Project Structure

```
BaseRPS/
├── contracts/                    # Smart contracts (Hardhat)
│   ├── src/
│   │   ├── BaseRPS.sol          # Main game contract
│   │   ├── interfaces/
│   │   │   └── IBaseRPS.sol     # Interface with events & types
│   │   └── libraries/
│   │       └── RPSLib.sol       # RPS comparison logic
│   ├── test/
│   │   ├── BaseRPS.test.ts      # Unit tests
│   │   └── Overtime.test.ts     # Overtime-specific tests
│   └── scripts/
│       └── deploy.ts            # Deployment script
│
└── frontend/                     # React + Vite frontend
    └── src/
        ├── components/          # UI components
        ├── hooks/               # Custom hooks
        ├── pages/               # Page components
        ├── store/               # State management
        └── contracts/           # ABI and contract hooks
```

## Quick Start

### Prerequisites

- Node.js >= 18
- npm or yarn

### Contracts

```bash
cd contracts
npm install
npm run compile
npm test
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Features

- **Commit-Reveal Mechanism**: Secure, front-running resistant gameplay
- **Game Modes**: Best of 1, 3, or 5
- **Overtime System**: Up to 10 ties per round before forced draw
- **Private Matches**: Create matches with private codes
- **Multi-wallet Commission**: Distribute fees to multiple wallets
- **Real-time Updates**: Event-driven UI updates
- **Progressive Tension**: Visual effects based on overtime count

## Smart Contract

### Key Functions

| Function | Description |
|----------|-------------|
| `createMatch(gameMode, isPrivate, codeHash)` | Create match with bet |
| `joinMatch(matchId)` | Join public match |
| `joinPrivateMatch(matchId, code)` | Join private match |
| `commitChoice(matchId, hash)` | Submit keccak256(choice, salt) |
| `revealChoice(matchId, choice, salt)` | Reveal and verify |
| `claimTimeout(matchId)` | Claim win on opponent timeout |

### Overtime Logic

When both players reveal equal choices:
1. Increment `tieCount` on current round
2. If `tieCount >= 10`: Force draw, full refund (no commission)
3. Otherwise: Reset commits, emit `RoundTied` event, continue

## Environment Variables

### Contracts (.env)

```
PRIVATE_KEY=your_private_key
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_api_key
COMMISSION_WALLETS=0xAddr1,0xAddr2
COMMISSION_RATE=250
```

### Frontend (.env)

```
VITE_CONTRACT_ADDRESS=0x...
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_CHAIN_ID=8453
```

## Deployment

### Contracts

```bash
cd contracts
npm run deploy:base-sepolia  # Testnet
npm run deploy:base          # Mainnet
```

### Frontend

```bash
cd frontend
npm run build
# Deploy dist/ to Vercel/Netlify
```

## Security

- ReentrancyGuard on all payment functions
- Pausable for emergency stop
- Ownable2Step for ownership
- Commit-reveal prevents front-running
- Session-based salt storage

## License

MIT
