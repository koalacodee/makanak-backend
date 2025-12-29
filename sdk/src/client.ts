// @ts-nocheck
import ky, { type KyInstance } from "ky";
// import Cookies from "js-cookie";

export interface SDKConfig {
	baseURL?: string;
	accessTokenCookieName?: string;
	refreshTokenCookieName?: string;
	cookieStore?: CookieStore;
}

export type CookieStore = {
	get(name: string): string | undefined;
	set(
		name: string,
		value: string,
		options?: { expires?: number; sameSite?: string; secure?: boolean },
	): void;
	remove(name: string): void;
};

export class MakanakSDK {
	private client: KyInstance;
	private accessTokenCookieName: string;
	private refreshTokenCookieName: string;
	private isRefreshing = false;
	private refreshPromise: Promise<string> | null = null;
	private baseURL: string;

	constructor(
		config: SDKConfig = {},
		private cookieStore: CookieStore,
	) {
		this.baseURL = config.baseURL || "http://localhost:3000";
		this.accessTokenCookieName = config.accessTokenCookieName || "accessToken";
		this.refreshTokenCookieName =
			config.refreshTokenCookieName || "refreshToken";

		this.client = ky.create({
			prefixUrl: this.baseURL,
			headers: {
				"Content-Type": "application/json",
			},
			retry: {
				limit: 1,
				methods: ["get", "put", "head", "delete", "options", "trace"],
				statusCodes: [408, 413, 429, 500, 502, 503, 504],
			},
			hooks: {
				beforeRequest: [
					async (request) => {
						const accessToken = this.cookieStore.get(
							this.accessTokenCookieName,
						);
						if (accessToken) {
							request.headers.set("Authorization", `Bearer ${accessToken}`);
						}
					},
				],
				beforeError: [
					async (error) => {
						const response = error.response;
						if (!response) {
							throw error;
						}

						// Handle 401 Unauthorized - mark for retry
						if (response.status === 401) {
							const request = error.request;
							const url = request.url;

							// Skip refresh for auth endpoints
							if (url.includes("/auth/login") || url.includes("/auth/logout")) {
								throw error;
							}

							// Mark that we need to retry
							(error as Error & { shouldRetry?: boolean }).shouldRetry = true;
						}

						throw error;
					},
				],
			},
		});
	}

	private async refreshAccessToken(): Promise<string> {
		// If already refreshing, wait for the existing promise
		if (this.isRefreshing && this.refreshPromise) {
			return this.refreshPromise;
		}

		// Start refresh process
		this.isRefreshing = true;
		this.refreshPromise = (async () => {
			try {
				// Call refresh endpoint - refresh token is sent via httpOnly cookie
				// We need to use a separate ky instance without hooks to avoid recursion
				const refreshClient = ky.create({
					prefixUrl: this.baseURL,
					credentials: "include",
				});

				const response = await refreshClient
					.post("v1/auth/refresh", {
						credentials: "include",
					})
					.json<{ accessToken: string }>();

				// Update access token cookie
				this.cookieStore.set(this.accessTokenCookieName, response.accessToken, {
					expires: 1, // 1 day
					sameSite: "strict",
					secure:
						typeof window !== "undefined" &&
						window.location.protocol === "https:",
				});

				return response.accessToken;
			} finally {
				this.isRefreshing = false;
				this.refreshPromise = null;
			}
		})();

		return this.refreshPromise;
	}

	getClient(): KyInstance {
		// Create a wrapper that handles 401 retries
		const originalClient = this.client;

		// Create a proxy that intercepts method calls
		return new Proxy(originalClient, {
			get: (target, prop) => {
				const originalMethod = (target as Record<string | symbol, unknown>)[
					prop
				];

				// Wrap HTTP methods to handle 401 retries
				if (
					typeof originalMethod === "function" &&
					["get", "post", "put", "patch", "delete", "head", "options"].includes(
						prop as string,
					)
				) {
					return async (
						input: string | URL | Request,
						options?: RequestInit,
					) => {
						try {
							return await (
								originalMethod as (
									input: string | URL | Request,
									options?: RequestInit,
								) => Promise<unknown>
							).call(target, input, options);
						} catch (error: unknown) {
							// Check if it's a 401 and we should retry
							const httpError = error as {
								response?: { status?: number };
								shouldRetry?: boolean;
							};
							if (httpError.response?.status === 401 && httpError.shouldRetry) {
								try {
									// Refresh token
									const newAccessToken = await this.refreshAccessToken();

									// Retry with new token
									const retryOptions = {
										...options,
										headers: {
											...options?.headers,
											Authorization: `Bearer ${newAccessToken}`,
										},
									};

									return await (
										originalMethod as (
											input: string | URL | Request,
											options?: RequestInit,
										) => Promise<unknown>
									).call(target, input, retryOptions);
								} catch (_refreshError) {
									// Refresh failed, clear tokens
									this.clearTokens();
									throw error;
								}
							}
							throw error;
						}
					};
				}

				return originalMethod;
			},
		}) as KyInstance;
	}

	setAccessToken(token: string): void {
		this.cookieStore.set(this.accessTokenCookieName, token, {
			expires: 1, // 1 day
			sameSite: "strict",
			secure:
				typeof window !== "undefined" && window.location.protocol === "https:",
		});
	}

	getAccessToken(): string | undefined {
		return this.cookieStore.get(this.accessTokenCookieName);
	}

	clearTokens(): void {
		this.cookieStore.remove(this.accessTokenCookieName);
		this.cookieStore.remove(this.refreshTokenCookieName);
	}
}
