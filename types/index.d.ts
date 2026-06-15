export type AttestOptions = import("./src/wallet-auth-protocol.js").AttestOptions;
export type AttestResult = import("./src/wallet-auth-protocol.js").AttestResult;
export type TrustOptions = import("./src/wallet-auth-protocol.js").TrustOptions;
export type TrustResult = import("./src/wallet-auth-protocol.js").TrustResult;
export type Condition = import("./src/wallet-auth-protocol.js").Condition;
export { default as WalletAuthProtocol, IWalletAuthProtocol } from "./src/wallet-auth-protocol.js";
export { default as InsumerWalletAuthProtocol, default } from "./src/insumer-wallet-auth-protocol.js";
