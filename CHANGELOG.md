# Changelog

## 0.2.4 (2026-09-15)

- Updates the README policy-engine example to the current WDK policy API (`1.0.0-beta.16` and later): the policy carries the required `name`, and the condition reads the transfer recipient from `args[0].recipient`. Documentation only; no code changes.

## 0.2.3 (2026-09-02)

- Enhances the README trust example to show the post-quantum companion (`pqSig`, `pqKid` under `insumer-trust-pq1`) that `trust()` already returns beside `sig` and `kid`.

## 0.2.2 (2026-09-02)

- Adds pass-through of the post-quantum companion fields on attest and trust.
