# @insumermodel/wdk-protocol-wallet-auth

> **Wallet auth for WDK wallets.** OAuth proves who you are. Wallet auth proves what you hold.

A [Wallet Development Kit](https://docs.wdk.tether.io/) protocol module that adds a new protocol category alongside Swap, Bridge, Lending, and Fiat: **pre-transaction, condition-based access.** Given a wallet and a set of on-chain conditions, it returns a cryptographically signed pass/fail (`attest`) or a multi-dimensional trust profile (`trust`). Results are ECDSA P-256 signed and verifiable offline against a public JWKS — no secrets, no identity-first, no static credentials.

Powered by [InsumerAPI](https://insumermodel.com). Covers **33 chains**: 30 EVM networks (Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BNB, and the rest of the major EVM set), plus Solana, XRPL, and Bitcoin. Works today on every WDK surface that overlaps: `wdk-wallet-evm`, `wdk-wallet-solana`, and `wdk-wallet-btc`. TRON, TON, and Lightning/Spark are on the roadmap — WDK apps on those runtimes can still call `attest()` / `trust()` against any EVM, Solana, Bitcoin, or XRPL address the user holds.

## Why this exists

WDK ships wallet modules and protocol modules (Swap, Bridge, Lending, Fiat) but has **no pre-transaction policy layer** — nothing to answer questions like "is this wallet allowed to receive this payment?" or "does this counterparty pass a sanctions and trust screen?" before signing.

This package fills that gap as a first-class WDK protocol:

```js
import InsumerWalletAuthProtocol from '@insumermodel/wdk-protocol-wallet-auth'

const walletAuth = new InsumerWalletAuthProtocol({ apiKey: process.env.INSUMER_API_KEY })

// Before broadcasting a transaction, verify the counterparty:
const { passed, sig, kid } = await walletAuth.attest({
  address: '0xCounterparty...',
  conditions: [
    { type: 'token_balance', contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: 1, threshold: 1000, decimals: 6, label: 'USDC >= 1000' }
  ]
})

if (!passed) throw new Error('counterparty failed wallet auth check')
// `sig` and `kid` are the audit trail: anyone can verify this later against the JWKS.
```

Use cases:

- **Agent-wallet guardrails.** WDK explicitly targets "humans, machines and AI agents." When an autonomous agent holds keys, the operator wants programmable constraints the agent can't argue its way around — and a cryptographic audit trail the operator can verify after the fact.
- **Receive-side trust display.** Before a creator accepts a payment, show a trust profile on the sending wallet. Native fit for products like Rumble Wallet.
- **Compliance cover for consumer apps built on WDK.** Drop-in Travel Rule / sanctions / counterparty-risk screen.

## Install

```bash
npm install @insumermodel/wdk-protocol-wallet-auth
```

Get an API key at [insumermodel.com](https://insumermodel.com) (free tier available).

### Buying credits

The free tier ships **10 attestation credits** on every new key — enough to exercise the module end-to-end before you spend anything. When you need more, credits can be purchased on-chain with **USDC, USDT, or BTC** via `POST /v1/credits/buy` — no Stripe, no signup, no fiat. Supported payment rails:

- **USDC or USDT** on any major EVM chain (Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BNB, and more) — the endpoint auto-detects which stablecoin you sent.
- **USDC** on Solana.
- **BTC** on Bitcoin mainnet.

Send the transfer to the platform wallet for your chosen chain, then `POST /v1/credits/buy` with `{ txHash, chainId, amount }`. Credits post as soon as the transaction is verified on-chain. See the [OpenAPI spec](https://insumermodel.com/openapi.yaml) for the full request shape.

## API

The package exports:

- `InsumerWalletAuthProtocol` (default export) — the InsumerAPI implementation
- `WalletAuthProtocol` — the abstract base class (implement your own backend)
- `IWalletAuthProtocol` — the interface

### `new InsumerWalletAuthProtocol(options)`

| Option    | Type      | Description |
|-----------|-----------|-------------|
| `apiKey`  | `string`  | **Required.** InsumerAPI key. |
| `account` | `object`  | Optional WDK wallet account. When bound, its `getAddress()` is used as the default subject. |
| `baseUrl` | `string`  | Override the API base URL. Defaults to `https://api.insumermodel.com`. |
| `fetch`   | `fetch`   | Override the `fetch` implementation (useful in Bare / React Native runtimes). |

### `attest(options)` → `Promise<AttestResult>`

Evaluates one to ten on-chain conditions against a wallet and returns a cryptographically signed pass/fail. Maps to [`POST /v1/attest`](https://insumermodel.com/openapi.yaml).

```js
const result = await walletAuth.attest({
  address: '0x1234...',                // defaults to bound account
  conditions: [
    { type: 'token_balance', contractAddress: '0xA0b8...', chainId: 1, threshold: 1000, decimals: 6 },
    { type: 'nft_ownership', contractAddress: '0xBC4C...', chainId: 1 }
  ],
  jwt: true,          // optional: also return an ES256 JWT
  merkleProof: true   // optional: include EIP-1186 Merkle storage proofs (2 credits instead of 1)
})

// result.passed           — true only if every condition is met
// result.attestation      — full attestation object (per-condition results, block info, condition hash)
// result.sig / result.kid — ECDSA P-256 signature + key id (verify against JWKS)
// result.jwt              — ES256 JWT form, when requested
// result.creditsRemaining — credits remaining on the API key
```

Supported condition types: `token_balance`, `nft_ownership`, `eas_attestation`, `farcaster_id`. Supported chains: 30 EVM chains plus Solana, XRPL, and Bitcoin. See the [InsumerAPI OpenAPI spec](https://insumermodel.com/openapi.yaml) for the full schema.

### `trust(options)` → `Promise<TrustResult>`

Returns a multi-dimensional trust profile: 36+ signed checks across stablecoins, governance, NFTs, staking, and (optionally) Solana, XRPL, and Bitcoin dimensions. Maps to [`POST /v1/trust`](https://insumermodel.com/openapi.yaml).

```js
const { trust, sig, kid } = await walletAuth.trust({
  address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  solanaAddress: '...',  // optional, adds Solana dimension
  xrplAddress: '...',    // optional, adds XRPL dimension
  bitcoinAddress: '...'  // optional, adds Bitcoin dimension
})

// trust.id         — TRST-XXXXX profile id
// trust.dimensions — per-dimension checks (each individually signed)
// trust.summary    — totalChecks, totalPassed, dimensionsWithActivity
```

## Verification

Every attestation and trust result is ECDSA P-256 signed. The signature (`sig`) and key id (`kid`) let any party verify the result offline, without calling the API, using the public JWKS:

```
https://insumermodel.com/.well-known/jwks.json
```

Use any standard JOSE/JWT library, or `npm install insumer-verify` for a convenience wrapper.

## Supported environments

- Node.js ≥ 18 (uses the built-in `fetch`)
- Bare / React Native runtimes (pass a `fetch` implementation in the constructor)
- Browsers (CORS is enabled on `api.insumermodel.com`)

## License

Apache-2.0. See [LICENSE](./LICENSE).

## Maintainer

Built by [Douglas Borthwick](https://insumermodel.com). Issues and contributions welcome at the [GitHub repo](https://github.com/douglasborthwick-crypto/wdk-protocol-wallet-auth).
