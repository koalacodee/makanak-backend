export type { SDKConfig } from "./client";
export { MakanakSDK } from "./client";
export { MakanakAPI } from "./endpoints";
export * from "./types";

// Convenience function to create a configured SDK instance
import type { CookieStore, SDKConfig } from "./client";
import { MakanakSDK } from "./client";
import { MakanakAPI } from "./endpoints";

export function createSDK(cookieStore: CookieStore, config?: SDKConfig) {
	const sdk = new MakanakSDK(config, cookieStore);
	const api = new MakanakAPI(sdk.getClient());
	return { sdk, api };
}
