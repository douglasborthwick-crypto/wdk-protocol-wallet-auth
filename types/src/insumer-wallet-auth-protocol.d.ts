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
    constructor(options?: {
        apiKey: string;
        baseUrl?: string | undefined;
        account?: any;
        fetch?: typeof fetch | undefined;
    });
    /** @private */
    private _apiKey;
    /** @private */
    private _baseUrl;
    /** @private */
    private _fetch;
    /**
     * Resolve the default subject address from the bound account, if any.
     * @private
     * @returns {Promise<string | undefined>}
     */
    private _defaultAddress;
    /**
     * POST to an InsumerAPI endpoint and unwrap the standard response envelope.
     * @private
     */
    private _post;
}
export type AttestOptions = import("./wallet-auth-protocol.js").AttestOptions;
export type AttestResult = import("./wallet-auth-protocol.js").AttestResult;
export type TrustOptions = import("./wallet-auth-protocol.js").TrustOptions;
export type TrustResult = import("./wallet-auth-protocol.js").TrustResult;
import WalletAuthProtocol from './wallet-auth-protocol.js';
