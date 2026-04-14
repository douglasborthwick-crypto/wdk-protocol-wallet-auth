// Copyright 2026 Douglas Borthwick / InsumerAPI
//
// Licensed under the Apache License, Version 2.0.

'use strict'

/**
 * Abstract base class defining a new WDK protocol category: Wallet Auth.
 *
 * OAuth proves who you are. Wallet auth proves what you hold.
 *
 * Alongside WDK's existing Swap, Bridge, Lending, and Fiat protocols, this
 * defines a pre-transaction verification protocol: given a wallet and a set
 * of on-chain conditions, return a cryptographically signed pass/fail
 * (attestation) or a multi-dimensional trust profile. The output is an
 * ECDSA-signed credential the caller can verify offline; no secrets, no
 * identity-first, no static credentials.
 *
 * Implementations (e.g. InsumerWalletAuthProtocol) call an external
 * verification service and return signed results. The protocol itself never
 * touches private keys or broadcasts transactions — it runs before, not
 * during, the signing flow.
 *
 * Shape-compatible with upstream WDK protocol base classes and intended to
 * be proposed for inclusion in @tetherto/wdk-wallet/protocols.
 */

/** @typedef {import('@tetherto/wdk-wallet').IWalletAccountReadOnly} IWalletAccountReadOnly */
/** @typedef {import('@tetherto/wdk-wallet').IWalletAccount} IWalletAccount */

/**
 * @typedef {Object} Condition
 * @property {"token_balance"|"nft_ownership"|"eas_attestation"|"farcaster_id"} type
 * @property {string} [contractAddress]
 * @property {(number|string)} [chainId]
 * @property {(number|string|bigint)} [threshold]
 * @property {number} [decimals]
 * @property {string} [tokenId]
 * @property {string} [schemaId]
 * @property {string} [attester]
 * @property {string} [indexer]
 * @property {string} [template]
 * @property {string} [currency]
 * @property {string} [label]
 */

/**
 * @typedef {Object} AttestOptions
 * @property {Condition[]} conditions - One to ten on-chain conditions to evaluate.
 * @property {string} [address] - Address to evaluate. Defaults to the attached account.
 * @property {string} [solanaAddress] - Solana address, if different from the default EVM address.
 * @property {string} [xrplAddress] - XRPL r-address.
 * @property {string} [bitcoinAddress] - Bitcoin address.
 * @property {boolean} [jwt] - If true, request an ES256 JWT alongside the attestation.
 * @property {boolean} [merkleProof] - If true, request EIP-1186 Merkle storage proofs (costs 2 credits instead of 1).
 */

/**
 * @typedef {Object} AttestResult
 * @property {boolean} passed - True if every condition is met.
 * @property {Object} attestation - Raw attestation object (condition-by-condition results, block numbers, condition hash).
 * @property {string} sig - ECDSA P-256 signature over the attestation (base64).
 * @property {string} kid - Key ID identifying the signing key in the JWKS.
 * @property {string} [jwt] - ES256 JWT form of the attestation, when requested.
 * @property {number} creditsRemaining - Credits remaining on the API key after this call.
 * @property {number} creditsCharged - Credits consumed by this call.
 */

/**
 * @typedef {Object} TrustOptions
 * @property {string} [address] - EVM address to profile. Defaults to the attached account.
 * @property {string} [solanaAddress] - Optional Solana address.
 * @property {string} [xrplAddress] - Optional XRPL r-address.
 * @property {string} [bitcoinAddress] - Optional Bitcoin address.
 * @property {boolean} [merkleProof] - If true, request Merkle proofs (costs 6 credits instead of 3).
 */

/**
 * @typedef {Object} TrustResult
 * @property {Object} trust - Full trust profile (dimensions, checks, summary, profile id).
 * @property {string} sig - ECDSA P-256 signature over the trust object.
 * @property {string} kid - Key ID identifying the signing key in the JWKS.
 * @property {number} creditsRemaining
 * @property {number} creditsCharged
 */

/** @interface */
export class IWalletAuthProtocol {
  /**
   * Evaluate one or more on-chain conditions against a wallet and return a
   * cryptographically signed pass/fail attestation. Runs server-side against
   * live chain state and never exposes raw balances unless merkleProof is
   * requested.
   *
   * @param {AttestOptions} options
   * @returns {Promise<AttestResult>}
   */
  async attest (options) {
    throw new Error('attest(options) not implemented')
  }

  /**
   * Return a multi-dimensional trust profile for a wallet across stablecoins,
   * governance, NFTs, and staking activity (plus optional Solana, XRPL, and
   * Bitcoin dimensions). Each check is individually signed.
   *
   * @param {TrustOptions} [options]
   * @returns {Promise<TrustResult>}
   */
  async trust (options) {
    throw new Error('trust(options) not implemented')
  }
}

/**
 * @abstract
 * @implements {IWalletAuthProtocol}
 */
export default class WalletAuthProtocol {
  /**
   * @param {IWalletAccountReadOnly | IWalletAccount} [account] - Optional wallet
   *   account to bind. When present, its address is used as the default subject
   *   for attest() and trust() calls.
   */
  constructor (account) {
    /**
     * @protected
     * @type {IWalletAccountReadOnly | IWalletAccount | undefined}
     */
    this._account = account
  }

  /**
   * @abstract
   * @param {AttestOptions} options
   * @returns {Promise<AttestResult>}
   */
  async attest (options) {
    throw new Error('attest(options) not implemented')
  }

  /**
   * @abstract
   * @param {TrustOptions} [options]
   * @returns {Promise<TrustResult>}
   */
  async trust (options) {
    throw new Error('trust(options) not implemented')
  }
}
