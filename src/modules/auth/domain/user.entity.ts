export type UserRole = "admin" | "driver" | "cs" | "inventory";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date | null;
  updatedAt: Date | null;
  lastLoginAt: Date | null;
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
