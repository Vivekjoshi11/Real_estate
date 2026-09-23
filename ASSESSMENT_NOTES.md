# Tech Assessment Notes

**Role:** Full-Stack Blockchain Engineer  
**Name:** Vivek Joshi  
**Repo:** https://github.com/Vivekjoshi11/Real_estate

---

## What I did

### Dark mode
Asked for night mode on the first page. Added a theme toggle in the navbar (sun/moon icon). Choice is saved in localStorage so it stays after refresh. Main page sections, cards, navbar, footer etc. all have dark styles. Used Tailwind's class-based dark mode.

### Wallet connect
The Connect buttons on the navbar and home page were dead — no click handler at all. Built a simple wallet context around MetaMask (`window.ethereum`). Clicking Connect opens the MetaMask popup, asks for account access, then shows the short address on the button. Click again to disconnect.

Also handles:
- account switch in MetaMask → UI updates
- chain change → tracked
- already connected from before → restores on page load without popup
- no MetaMask installed → shows an error message

### Contract API
Added a new API under `/api/contract` that talks to the smart contracts in `contracts/` via ethers.js. Follows the same route/controller structure as the rest of the backend.

**Endpoints:**

- `GET /api/contract/health` — RPC connection check
- `GET /api/contract/real-estate/total-supply`
- `GET /api/contract/real-estate/token/:tokenId`
- `GET /api/contract/real-estate/balance/:address`
- `POST /api/contract/real-estate/mint`
- `GET /api/contract/escrow/:tokenId`
- `GET /api/contract/escrow/balance`
- `POST /api/contract/escrow/approve-sale`
- `POST /api/contract/escrow/update-inspection`

Config lives in `server/config/.config.env`:
```
RPC_URL=https://arb1.arbitrum.io/rpc
REAL_ESTATE_ADDRESS=
ESCROW_ADDRESS=
CONTRACT_PRIVATE_KEY=
```

Input validation is in place (address format, tokenId must be numeric, required fields). Errors come back as JSON with a proper status code.

---

## What I tested

- `/api/contract/health` → works, returns Arbitrum mainnet (chainId 42161), current block number
- Contract read routes without addresses set → 503 with a clear "not configured" message (expected — no deployed contracts in the zip)
- Bad input (invalid address, non-numeric tokenId, empty POST body) → 400

---

## How to run

```
npm start
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

Or backend only: `node server/server.js`

No contract deployment was done — the task asked for an API that *can* integrate with smart contracts, not a live deployment.
