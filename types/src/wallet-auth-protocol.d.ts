/**
 * Abstract base class defining a new WDK protocol category: Wallet Auth.
 *
 * OAuth proves who you are. Wallet auth proves what you hold.
 *
 * Alongside WDK's existing Swap, Bridge, Lending, and Fiat protocols, this
 * defines a pre-transaction verification protocol: given a wallet and a set
 * of on-chain conditions, return a cryptographically signed pass/fail
 * (attestation) or a multi-dimensional trust profile. The output is an
 * ECDSA-signed result the caller can verify offline; no secrets, no
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
 * @property {string} [tronAddress] - Tron address (T-prefix, base58, 34 chars). Required for any `chainId: "tron"` condition.
 * @property {string} [stellarAddress] - Stellar address (G-prefix StrKey, 56 chars). Required for any `chainId: "stellar"` condition.
 * @property {string} [suiAddress] - Sui address (0x + 64 hex chars). Required for any `chainId: "sui"` condition.
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
 * @property {string} [solanaAddress] - Optional Solana address (adds Solana dimension).
 * @property {string} [xrplAddress] - Optional XRPL r-address (adds XRPL stablecoin checks).
 * @property {string} [bitcoinAddress] - Optional Bitcoin address (adds Bitcoin Holdings dimension).
 * @property {string} [tronAddress] - Optional Tron address (adds Tron USDT-TRC20 dimension).
 * @property {string} [stellarAddress] - Optional Stellar address (adds USDC + BENJI on Stellar to institutional_stablecoins).
 * @property {string} [suiAddress] - Optional Sui address (adds USDC on Sui to institutional_stablecoins).
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
    attest(options: AttestOptions): Promise<AttestResult>;
    /**
     * Return a multi-dimensional trust profile for a wallet across stablecoins,
     * governance, NFTs, and staking activity (plus optional Solana, XRPL, and
     * Bitcoin dimensions). Each check is individually signed.
     *
     * @param {TrustOptions} [options]
     * @returns {Promise<TrustResult>}
     */
    trust(options?: TrustOptions): Promise<TrustResult>;
}
/**
 * @abstract
 * @implements {IWalletAuthProtocol}
 */
export default class WalletAuthProtocol implements IWalletAuthProtocol {
    /**
     * @param {IWalletAccountReadOnly | IWalletAccount} [account] - Optional wallet
     *   account to bind. When present, its address is used as the default subject
     *   for attest() and trust() calls.
     */
    constructor(account?: IWalletAccountReadOnly | IWalletAccount);
    /**
     * @protected
     * @type {IWalletAccountReadOnly | IWalletAccount | undefined}
     */
    protected _account: IWalletAccountReadOnly | IWalletAccount | undefined;
    /**
     * @abstract
     * @param {AttestOptions} options
     * @returns {Promise<AttestResult>}
     */
    attest(options: AttestOptions): Promise<AttestResult>;
    /**
     * @abstract
     * @param {TrustOptions} [options]
     * @returns {Promise<TrustResult>}
     */
    trust(options?: TrustOptions): Promise<TrustResult>;
}
export type IWalletAccountReadOnly = any;
export type IWalletAccount = any;
export type Condition = {
    type: "token_balance" | "nft_ownership" | "eas_attestation" | "farcaster_id";
    contractAddress?: string | undefined;
    chainId?: string | number | undefined;
    threshold?: string | number | bigint | undefined;
    decimals?: number | undefined;
    tokenId?: string | undefined;
    schemaId?: string | undefined;
    attester?: string | undefined;
    indexer?: string | undefined;
    template?: string | undefined;
    currency?: string | undefined;
    label?: string | undefined;
};
export type AttestOptions = {
    /**
     * - One to ten on-chain conditions to evaluate.
     */
    conditions: Condition[];
    /**
     * - Address to evaluate. Defaults to the attached account.
     */
    address?: string | undefined;
    /**
     * - Solana address, if different from the default EVM address.
     */
    solanaAddress?: string | undefined;
    /**
     * - XRPL r-address.
     */
    xrplAddress?: string | undefined;
    /**
     * - Bitcoin address.
     */
    bitcoinAddress?: string | undefined;
    /**
     * - Tron address (T-prefix, base58, 34 chars). Required for any `chainId: "tron"` condition.
     */
    tronAddress?: string | undefined;
    /**
     * - Stellar address (G-prefix StrKey, 56 chars). Required for any `chainId: "stellar"` condition.
     */
    stellarAddress?: string | undefined;
    /**
     * - Sui address (0x + 64 hex chars). Required for any `chainId: "sui"` condition.
     */
    suiAddress?: string | undefined;
    /**
     * - If true, request an ES256 JWT alongside the attestation.
     */
    jwt?: boolean | undefined;
    /**
     * - If true, request EIP-1186 Merkle storage proofs (costs 2 credits instead of 1).
     */
    merkleProof?: boolean | undefined;
};
export type AttestResult = {
    /**
     * - True if every condition is met.
     */
    passed: boolean;
    /**
     * - Raw attestation object (condition-by-condition results, block numbers, condition hash).
     */
    attestation: Object;
    /**
     * - ECDSA P-256 signature over the attestation (base64).
     */
    sig: string;
    /**
     * - Key ID identifying the signing key in the JWKS.
     */
    kid: string;
    /**
     * - ES256 JWT form of the attestation, when requested.
     */
    jwt?: string | undefined;
    /**
     * - Credits remaining on the API key after this call.
     */
    creditsRemaining: number;
    /**
     * - Credits consumed by this call.
     */
    creditsCharged: number;
};
export type TrustOptions = {
    /**
     * - EVM address to profile. Defaults to the attached account.
     */
    address?: string | undefined;
    /**
     * - Optional Solana address (adds Solana dimension).
     */
    solanaAddress?: string | undefined;
    /**
     * - Optional XRPL r-address (adds XRPL stablecoin checks).
     */
    xrplAddress?: string | undefined;
    /**
     * - Optional Bitcoin address (adds Bitcoin Holdings dimension).
     */
    bitcoinAddress?: string | undefined;
    /**
     * - Optional Tron address (adds Tron USDT-TRC20 dimension).
     */
    tronAddress?: string | undefined;
    /**
     * - Optional Stellar address (adds USDC + BENJI on Stellar to institutional_stablecoins).
     */
    stellarAddress?: string | undefined;
    /**
     * - Optional Sui address (adds USDC on Sui to institutional_stablecoins).
     */
    suiAddress?: string | undefined;
    /**
     * - If true, request Merkle proofs (costs 6 credits instead of 3).
     */
    merkleProof?: boolean | undefined;
};
export type TrustResult = {
    /**
     * - Full trust profile (dimensions, checks, summary, profile id).
     */
    trust: Object;
    /**
     * - ECDSA P-256 signature over the trust object.
     */
    sig: string;
    /**
     * - Key ID identifying the signing key in the JWKS.
     */
    kid: string;
    creditsRemaining: number;
    creditsCharged: number;
};
