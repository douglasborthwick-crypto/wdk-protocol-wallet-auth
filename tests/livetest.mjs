// Live integration test against https://api.insumermodel.com.
// NOT part of the unit test suite — run manually with INSUMER_API_KEY set.
//
// Usage:
//   INSUMER_API_KEY=insr_live_... node tests/livetest.mjs
//
// Not committed via .gitignore (path under tests/ is allowed, but this file
// intentionally uses the .mjs extension so `npm test` (*.test.js) ignores it).

import InsumerWalletAuthProtocol from '../index.js'

const apiKey = process.env.INSUMER_API_KEY
if (!apiKey) {
  console.error('Set INSUMER_API_KEY in the environment')
  process.exit(1)
}

const proto = new InsumerWalletAuthProtocol({ apiKey })

// Vitalik — a safe read-only subject for public tests.
const VITALIK = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

function pp (label, obj) {
  console.log(`\n— ${label} —`)
  console.log(JSON.stringify(obj, (_k, v) => typeof v === 'bigint' ? v.toString() : v, 2))
}

async function run () {
  console.log('1) attest() — USDC >= 1 on Ethereum against Vitalik')
  const attestResult = await proto.attest({
    address: VITALIK,
    conditions: [
      {
        type: 'token_balance',
        contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainId: 1,
        threshold: 1,
        decimals: 6,
        label: 'USDC >= 1'
      }
    ],
    jwt: true
  })

  pp('attest raw', attestResult)
  console.log('\nShape checks:')
  console.log('  passed is boolean:           ', typeof attestResult.passed === 'boolean')
  console.log('  attestation.id present:      ', !!attestResult.attestation?.id)
  console.log('  attestation.pass === passed: ', attestResult.attestation?.pass === attestResult.passed)
  console.log('  sig is non-empty string:     ', typeof attestResult.sig === 'string' && attestResult.sig.length > 0)
  console.log('  kid === insumer-attest-v1:   ', attestResult.kid === 'insumer-attest-v1')
  console.log('  jwt returned (format=jwt):   ', typeof attestResult.jwt === 'string' && attestResult.jwt.split('.').length === 3)
  console.log('  creditsCharged is number:    ', typeof attestResult.creditsCharged === 'number')
  console.log('  creditsRemaining is number:  ', typeof attestResult.creditsRemaining === 'number')

  console.log('\n2) trust() — Vitalik')
  const trustResult = await proto.trust({ address: VITALIK })

  pp('trust raw', {
    trustId: trustResult.trust?.id,
    wallet: trustResult.trust?.wallet,
    conditionSetVersion: trustResult.trust?.conditionSetVersion,
    dimensions: Object.keys(trustResult.trust?.dimensions || {}),
    summary: trustResult.trust?.summary,
    sig: trustResult.sig?.slice(0, 16) + '...',
    kid: trustResult.kid,
    creditsCharged: trustResult.creditsCharged,
    creditsRemaining: trustResult.creditsRemaining
  })

  console.log('\nShape checks:')
  console.log('  trust.id starts with TRST-:  ', /^TRST-/.test(trustResult.trust?.id || ''))
  console.log('  trust.wallet matches input:  ', (trustResult.trust?.wallet || '').toLowerCase() === VITALIK.toLowerCase())
  console.log('  trust.summary.totalChecks:   ', trustResult.trust?.summary?.totalChecks)
  console.log('  trust.summary.totalPassed:   ', trustResult.trust?.summary?.totalPassed)
  console.log('  sig is non-empty string:     ', typeof trustResult.sig === 'string' && trustResult.sig.length > 0)
  console.log('  kid === insumer-attest-v1:   ', trustResult.kid === 'insumer-attest-v1')
  console.log('  creditsCharged === 3:        ', trustResult.creditsCharged === 3)

  console.log('\nDone.')
}

run().catch((err) => {
  console.error('\nLIVE TEST FAILED:', err.message)
  if (err.response) console.error('Response:', JSON.stringify(err.response, null, 2))
  process.exit(1)
})
