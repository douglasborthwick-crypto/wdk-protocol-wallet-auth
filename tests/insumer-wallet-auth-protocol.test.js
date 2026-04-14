'use strict'

import { test } from 'node:test'
import assert from 'node:assert/strict'

import InsumerWalletAuthProtocol, { WalletAuthProtocol, IWalletAuthProtocol } from '../index.js'

function mockFetch (handler) {
  return async (url, init) => {
    const { status = 200, body } = handler(url, init) || {}
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: `HTTP ${status}`,
      async json () { return body }
    }
  }
}

test('constructor requires an apiKey', () => {
  assert.throws(() => new InsumerWalletAuthProtocol({}), /apiKey is required/)
})

test('base class is exported and abstract methods throw', async () => {
  const base = new WalletAuthProtocol()
  await assert.rejects(() => base.attest({ conditions: [{ type: 'token_balance' }] }), /not implemented/)
  await assert.rejects(() => base.trust(), /not implemented/)
  assert.ok(IWalletAuthProtocol)
})

test('attest() posts to /v1/attest and returns a passed boolean', async () => {
  let capturedUrl
  let capturedBody
  const fetch = mockFetch((url, init) => {
    capturedUrl = url
    capturedBody = JSON.parse(init.body)
    return {
      status: 200,
      body: {
        ok: true,
        data: {
          attestation: { pass: true, results: [{ met: true, label: 'USDC >= 1000' }], conditionHash: '0xabc' },
          sig: 'base64sigstring',
          kid: 'insumer-attest-v1'
        },
        meta: { creditsRemaining: 99, creditsCharged: 1 }
      }
    }
  })

  const proto = new InsumerWalletAuthProtocol({ apiKey: 'test-key', fetch })
  const result = await proto.attest({
    address: '0x1234567890abcdef1234567890abcdef12345678',
    conditions: [
      { type: 'token_balance', contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: 1, threshold: 1000, decimals: 6 }
    ]
  })

  assert.equal(capturedUrl, 'https://api.insumermodel.com/v1/attest')
  assert.equal(capturedBody.wallet, '0x1234567890abcdef1234567890abcdef12345678')
  assert.equal(capturedBody.conditions.length, 1)
  assert.equal(result.passed, true)
  assert.equal(result.sig, 'base64sigstring')
  assert.equal(result.kid, 'insumer-attest-v1')
  assert.equal(result.creditsRemaining, 99)
  assert.equal(result.creditsCharged, 1)
})

test('attest() rejects empty or oversized conditions arrays', async () => {
  const proto = new InsumerWalletAuthProtocol({ apiKey: 'k', fetch: mockFetch(() => ({ status: 200, body: { ok: true, data: {}, meta: {} } })) })
  await assert.rejects(() => proto.attest({ conditions: [] }), /conditions array is required/)
  const eleven = Array.from({ length: 11 }, () => ({ type: 'token_balance' }))
  await assert.rejects(() => proto.attest({ conditions: eleven }), /at most 10 conditions/)
})

test('attest() surfaces API error envelopes', async () => {
  // Real InsumerAPI error envelope uses numeric code (HTTP status) not a string label.
  const fetch = mockFetch(() => ({ status: 402, body: { ok: false, error: { code: 402, message: 'Insufficient attestation credits (0 available, 1 required). Buy more via POST /v1/credits/buy.' }, meta: {} } }))
  const proto = new InsumerWalletAuthProtocol({ apiKey: 'k', fetch })
  await assert.rejects(
    () => proto.attest({ address: '0xabc', conditions: [{ type: 'token_balance' }] }),
    (err) => err.status === 402 && err.code === 402 && /Buy more/.test(err.message)
  )
})

test('attest() uses bound account address as default subject', async () => {
  let capturedBody
  const fetch = mockFetch((_url, init) => {
    capturedBody = JSON.parse(init.body)
    return { status: 200, body: { ok: true, data: { attestation: { pass: true } }, meta: {} } }
  })
  const account = { getAddress: async () => '0xBoundAccountAddress' }
  const proto = new InsumerWalletAuthProtocol({ apiKey: 'k', account, fetch })
  await proto.attest({ conditions: [{ type: 'token_balance' }] })
  assert.equal(capturedBody.wallet, '0xBoundAccountAddress')
})

test('attest() passes jwt and merkleProof flags as API params', async () => {
  let capturedBody
  const fetch = mockFetch((_url, init) => {
    capturedBody = JSON.parse(init.body)
    return { status: 200, body: { ok: true, data: { attestation: { pass: true }, jwt: 'eyJ...' }, meta: { creditsCharged: 2 } } }
  })
  const proto = new InsumerWalletAuthProtocol({ apiKey: 'k', fetch })
  const r = await proto.attest({
    address: '0xabc',
    conditions: [{ type: 'token_balance' }],
    jwt: true,
    merkleProof: true
  })
  assert.equal(capturedBody.format, 'jwt')
  assert.equal(capturedBody.proof, 'merkle')
  assert.equal(r.jwt, 'eyJ...')
  assert.equal(r.creditsCharged, 2)
})

test('trust() posts to /v1/trust and requires an address', async () => {
  const fetch = mockFetch(() => ({
    status: 200,
    body: {
      ok: true,
      data: {
        trust: { id: 'TRST-A1B2C', wallet: '0xabc', summary: { totalChecks: 36, totalPassed: 12 } },
        sig: 'sig',
        kid: 'insumer-attest-v1'
      },
      meta: { creditsRemaining: 500, creditsCharged: 3 }
    }
  }))
  const proto = new InsumerWalletAuthProtocol({ apiKey: 'k', fetch })
  await assert.rejects(() => proto.trust(), /address is required/)

  const r = await proto.trust({ address: '0xabc' })
  assert.equal(r.trust.id, 'TRST-A1B2C')
  assert.equal(r.creditsCharged, 3)
})

test('trust() forwards multi-chain addresses', async () => {
  let capturedBody
  const fetch = mockFetch((_url, init) => {
    capturedBody = JSON.parse(init.body)
    return { status: 200, body: { ok: true, data: { trust: {} }, meta: {} } }
  })
  const proto = new InsumerWalletAuthProtocol({ apiKey: 'k', fetch })
  await proto.trust({
    address: '0xabc',
    solanaAddress: 'Sol111',
    xrplAddress: 'rXRP',
    bitcoinAddress: 'bc1q'
  })
  assert.equal(capturedBody.wallet, '0xabc')
  assert.equal(capturedBody.solanaWallet, 'Sol111')
  assert.equal(capturedBody.xrplWallet, 'rXRP')
  assert.equal(capturedBody.bitcoinWallet, 'bc1q')
})
