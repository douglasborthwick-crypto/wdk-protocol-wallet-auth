// Copyright 2026 Douglas Borthwick / InsumerAPI
//
// Licensed under the Apache License, Version 2.0.

'use strict'

import WalletAuthProtocol from './wallet-auth-protocol.js'

/** @typedef {import('./wallet-auth-protocol.js').AttestOptions} AttestOptions */
/** @typedef {import('./wallet-auth-protocol.js').AttestResult} AttestResult */
/** @typedef {import('./wallet-auth-protocol.js').TrustOptions} TrustOptions */
/** @typedef {import('./wallet-auth-protocol.js').TrustResult} TrustResult */

const DEFAULT_BASE_URL = 'https://api.insumermodel.com'

/**
 * InsumerAPI implementation of the WDK Wallet Auth protocol.
 *
 * Wraps POST /v1/attest and POST /v1/trust. Results are ECDSA P-256 signed
 * and verifiable offline against the JWKS at
 * https://insumermodel.com/.well-known/jwks.json using any standard JWT or
 * JOSE library (or the `insumer-verify` npm package).
 */
export default class InsumerWalletAuthProtocol extends WalletAuthProtocol {
  /**
   * @param {Object} options
   * @param {string} options.apiKey - InsumerAPI key. Get one at https://insumermodel.com/.
   * @param {string} [options.baseUrl] - Override the API base URL. Defaults to https://api.insumermodel.com.
   * @param {any} [options.account] - Optional wallet account to bind. When present, its getAddress() is used as the default subject.
   * @param {typeof fetch} [options.fetch] - Override the fetch implementation (useful in Bare/React Native runtimes).
   */
  constructor (options = {}) {
    super(options.account)
    if (!options.apiKey || typeof options.apiKey !== 'string') {
      throw new Error('InsumerWalletAuthProtocol: apiKey is required')
    }
    /** @private */
    this._apiKey = options.apiKey
    /** @private */
    this._baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '')
    /** @private */
    this._fetch = options.fetch || globalThis.fetch
    if (typeof this._fetch !== 'function') {
      throw new Error('InsumerWalletAuthProtocol: no fetch implementation available. Pass { fetch } in the runtime environment.')
    }
  }

  /**
   * Resolve the default subject address from the bound account, if any.
   * @private
   * @returns {Promise<string | undefined>}
   */
  async _defaultAddress () {
    if (!this._account) return undefined
    if (typeof this._account.getAddress === 'function') {
      return await this._account.getAddress()
    }
    if (typeof this._account.address === 'string') {
      return this._account.address
    }
    return undefined
  }

  /**
   * POST to an InsumerAPI endpoint and unwrap the standard response envelope.
   * @private
   */
  async _post (path, body) {
    const res = await this._fetch(`${this._baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this._apiKey
      },
      body: JSON.stringify(body)
    })

    let payload
    try {
      payload = await res.json()
    } catch (_e) {
      throw new Error(`InsumerAPI ${path} returned non-JSON response (HTTP ${res.status})`)
    }

    if (!res.ok || payload?.ok !== true) {
      const code = payload?.error?.code || `http_${res.status}`
      const msg = payload?.error?.message || res.statusText || 'unknown error'
      const err = new Error(`InsumerAPI ${path} failed: ${code} — ${msg}`)
      err.status = res.status
      err.code = code
      err.response = payload
      throw err
    }

    return payload
  }

  /**
   * Evaluate one or more on-chain conditions against a wallet. Returns a
   * signed pass/fail attestation.
   *
   * @param {AttestOptions} options
   * @returns {Promise<AttestResult>}
   */
  async attest (options) {
    if (!options || !Array.isArray(options.conditions) || options.conditions.length === 0) {
      throw new Error('attest(options): conditions array is required (1-10 items)')
    }
    if (options.conditions.length > 10) {
      throw new Error('attest(options): at most 10 conditions per call')
    }

    const address = options.address || await this._defaultAddress()

    /** @type {Record<string, any>} */
    const body = { conditions: options.conditions }
    if (address) body.wallet = address
    if (options.solanaAddress) body.solanaWallet = options.solanaAddress
    if (options.xrplAddress) body.xrplWallet = options.xrplAddress
    if (options.bitcoinAddress) body.bitcoinWallet = options.bitcoinAddress
    if (options.jwt) body.format = 'jwt'
    if (options.merkleProof) body.proof = 'merkle'

    const payload = await this._post('/v1/attest', body)
    const data = payload.data || {}
    const meta = payload.meta || {}

    return {
      passed: data.attestation?.pass === true,
      attestation: data.attestation,
      sig: data.sig,
      kid: data.kid,
      jwt: data.jwt,
      creditsRemaining: meta.creditsRemaining,
      creditsCharged: meta.creditsCharged
    }
  }

  /**
   * Return a multi-dimensional trust profile for a wallet.
   *
   * @param {TrustOptions} [options]
   * @returns {Promise<TrustResult>}
   */
  async trust (options = {}) {
    const address = options.address || await this._defaultAddress()
    if (!address) {
      throw new Error('trust(options): address is required (pass options.address or bind a wallet account)')
    }

    /** @type {Record<string, any>} */
    const body = { wallet: address }
    if (options.solanaAddress) body.solanaWallet = options.solanaAddress
    if (options.xrplAddress) body.xrplWallet = options.xrplAddress
    if (options.bitcoinAddress) body.bitcoinWallet = options.bitcoinAddress
    if (options.merkleProof) body.proof = 'merkle'

    const payload = await this._post('/v1/trust', body)
    const data = payload.data || {}
    const meta = payload.meta || {}

    return {
      trust: data.trust,
      sig: data.sig,
      kid: data.kid,
      creditsRemaining: meta.creditsRemaining,
      creditsCharged: meta.creditsCharged
    }
  }
}
