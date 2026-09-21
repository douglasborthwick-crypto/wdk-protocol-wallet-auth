# Changelog

## 0.2.7 (2026-09-21)

- The published type declarations are regenerated from the source JSDoc. They had fallen behind: `Condition.type` now includes `evm_view_call`, `ratio_to_amount`, `ratio_to_supply`, `erc8004_agent` and `erc7710_delegation` with their fields, and the attest and trust results carry the post-quantum companion fields (`pqSig`, `pqKid`, `pqJwt`).
- README: only the Solana, XRPL, Bitcoin and Tron addresses add trust checks; the Stellar and Sui checks are already among the 45 base checks.

## 0.2.6 (2026-09-21)

- README: aligns the trust profile counts with the engine as of 2026-09-21, when USDC on Arc became a trust check: 45 base checks across 26 chains in 5 dimensions (was 44 across 25), up to 50 across 28 chains in 9 dimensions with the optional wallets (was 49 across 27).

## 0.2.5 (2026-09-20)

- Aligns chain counts with the engine: 37 chains, 31 EVM networks; NFT ownership on 33 (31 EVM + Solana + XRPL).
- Clarifies that `decimals` is an optional cross-check: leave it out and the token's own decimals are read from the chain. A value that differs from the token's own is rejected with a 400.
- Updates the README examples to leave `decimals` out, the recommended request shape.
- Sends a numeric `threshold` as a plain decimal string in every case (very small and very large numbers no longer take exponent form).
- Updates the trust profile wording: the profile is signed as a whole, and the optional dimensions include Tron, Stellar and Sui.

## 0.2.4 (2026-09-15)

- Updates the README policy-engine example to the current WDK policy API (`1.0.0-beta.16` and later): the policy carries the required `name`, and the condition reads the transfer recipient from `args[0].recipient`. Documentation only; no code changes.

## 0.2.3 (2026-09-02)

- Enhances the README trust example to show the post-quantum companion (`pqSig`, `pqKid` under `insumer-trust-pq1`) that `trust()` already returns beside `sig` and `kid`.

## 0.2.2 (2026-09-02)

- Adds pass-through of the post-quantum companion fields on attest and trust.
