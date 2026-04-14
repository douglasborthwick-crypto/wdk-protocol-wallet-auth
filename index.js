// Copyright 2026 Douglas Borthwick / InsumerAPI
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

/** @typedef {import('./src/wallet-auth-protocol.js').AttestOptions} AttestOptions */
/** @typedef {import('./src/wallet-auth-protocol.js').AttestResult} AttestResult */
/** @typedef {import('./src/wallet-auth-protocol.js').TrustOptions} TrustOptions */
/** @typedef {import('./src/wallet-auth-protocol.js').TrustResult} TrustResult */
/** @typedef {import('./src/wallet-auth-protocol.js').Condition} Condition */

export { default as WalletAuthProtocol, IWalletAuthProtocol } from './src/wallet-auth-protocol.js'
export { default as InsumerWalletAuthProtocol } from './src/insumer-wallet-auth-protocol.js'
export { default } from './src/insumer-wallet-auth-protocol.js'
