# @insumermodel/wdk-protocol-wallet-auth

> **Wallet auth for WDK wallets.** OAuth proves who you are. Wallet auth proves what you hold.

The wallet auth primitive (read → evaluate → sign) packaged for [Wallet Development Kit](https://docs.wdk.tether.io/) apps. **Pre-transaction, condition-based access.** Given a wallet and a set of on-chain conditions, it returns a cryptographically signed pass/fail (`attest`) or a multi-dimensional trust profile (`trust`). Results are ECDSA P-256 signed and verifiable offline against a public JWKS — no secrets, no identity-first, no static credentials. It composes with WDK's transaction policy engine as a signed condition, and works standalone anywhere else.

Powered by [InsumerAPI](https://insumermodel.com). `attest()` covers **37 chains**: 31 EVM networks (Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BNB, and the rest of the major EVM set) plus Solana, XRPL, Bitcoin, Tron, Stellar, and Sui. (Bitcoin is `token_balance` on native BTC only; Tron, Stellar, and Sui are `token_balance` only.) `trust()` is a curated profile spanning the 25–27 chains where its dimensions live (see below). Works today on every WDK surface that overlaps: `wdk-wallet-evm`, `wdk-wallet-solana`, and `wdk-wallet-btc`. TON and Lightning/Spark are on the roadmap — WDK apps on those runtimes can still call `attest()` / `trust()` against any supported address the user holds.

## Why this exists

WDK shipped a local transaction **policy engine** in beta.11 (`wdk.registerPolicy(...)`) — the enforcement layer that gates write-facing operations *before* a wallet signs. A policy rule's `ALLOW`/`DENY` decision runs a **condition**: a function that answers "should this operation proceed?" The engine deliberately leaves that function to you.

This package *is* that condition. `attest()` is an async, on-chain, cryptographically signed check you drop straight into a policy rule — so apps don't hand-roll balance / NFT / staking reads per policy. The engine is **default-deny on governed accounts**, so the idiomatic shape is an `ALLOW` gated on the check passing (which is also fail-closed for free: if the call throws, the `ALLOW` simply doesn't match and the op is denied):

```js
import WalletAuth from '@insumermodel/wdk-protocol-wallet-auth'

const walletAuth = new WalletAuth({ apiKey: process.env.INSUMER_API_KEY })

wdk.registerPolicy({
  id: 'counterparty-trust',
  scope: 'project',
  rules: [{
    name: 'allow-transfer-if-counterparty-passes',
    operation: 'transfer',
    action: 'ALLOW',
    conditions: [async ({ params }) =>
      (await walletAuth.attest({
        address: params.to,
        conditions: [{ type: 'token_balance', contractAddress: '0xA0b8...', chainId: 1, threshold: 1000, decimals: 6 }]
      })).passed
    ]
  }]
})
```

It also works **standalone**, with or without WDK — call `attest()` / `trust()` directly before broadcasting:

```js
import InsumerWalletAuthProtocol from '@insumermodel/wdk-protocol-wallet-auth'

const walletAuth = new InsumerWalletAuthProtocol({ apiKey: process.env.INSUMER_API_KEY })

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

### Provisioning a key

Two ways to provision an API key. Either flow ships **10 free attestation credits**, enough to exercise the module end-to-end before paying anything.

- **Email signup** (human-managed wallet apps): `POST /v1/keys/create` with `{ email, appName, tier: "free" }`, or use the form at [insumermodel.com](https://insumermodel.com). No credit card.
- **On-chain** (autonomous agent operating its own WDK wallet): send USDC, USDT, or BTC to the platform wallet, then `POST /v1/keys/buy` with the transaction hash. The transaction sender wallet is the identity, the payment is the auth. No email, no human in the loop.

Set the resulting key as `INSUMER_API_KEY` in your runtime.

### Topping up credits

Top up an existing key on-chain via `POST /v1/credits/buy` — no Stripe, no fiat. Supported payment rails:

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
  // Non-EVM conditions need their matching address field:
  // solanaAddress, xrplAddress, bitcoinAddress, tronAddress, stellarAddress, suiAddress
  jwt: true,          // optional: also return an ES256 JWT
  merkleProof: true   // optional: include EIP-1186 Merkle storage proofs (2 credits instead of 1)
})

// result.passed           — true only if every condition is met
// result.attestation      — full attestation object (per-condition results, block info, condition hash)
// result.sig / result.kid — ECDSA P-256 signature + key id (verify against JWKS)
// result.jwt              — ES256 JWT form, when requested
// result.creditsRemaining — credits remaining on the API key
```

Supported condition types: `token_balance`, `nft_ownership`, `eas_attestation`, `farcaster_id`. Supported chains: 37 — 31 EVM networks plus Solana, XRPL, Bitcoin, Tron, Stellar, and Sui. Each non-EVM chain needs its address passed in the matching option (`solanaAddress`, `xrplAddress`, `bitcoinAddress`, `tronAddress`, `stellarAddress`, `suiAddress`). See the [InsumerAPI OpenAPI spec](https://insumermodel.com/openapi.yaml) for the full schema.

### `trust(options)` → `Promise<TrustResult>`

Returns a multi-dimensional trust profile: 44 base checks across 25 chains in 5 dimensions (stablecoins, governance, NFTs, staking, institutional_stablecoins), rising to up to 49 checks across 27 chains in 9 dimensions when the optional `solanaAddress`, `xrplAddress`, `bitcoinAddress`, `tronAddress`, `stellarAddress`, or `suiAddress` are supplied. Each check is individually signed. Maps to [`POST /v1/trust`](https://insumermodel.com/openapi.yaml).

```js
const { trust, sig, kid } = await walletAuth.trust({
  address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  solanaAddress: '...',   // optional, adds Solana dimension
  xrplAddress: '...',     // optional, adds XRPL stablecoin checks
  bitcoinAddress: '...',  // optional, adds Bitcoin Holdings dimension
  tronAddress: '...',     // optional, adds Tron USDT-TRC20 dimension
  stellarAddress: '...',  // optional, adds USDC + BENJI on Stellar
  suiAddress: '...'       // optional, adds USDC on Sui
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
