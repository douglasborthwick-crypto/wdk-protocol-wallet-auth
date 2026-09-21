# Changelog

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
