import { UserRole } from "./authenticatedUser";

export interface AccessTokenPayload {
  id: string;
  uid?: string;
  role: UserRole;
  username?: string;
  iat: number;
  exp: number;
}
 
export interface RefreshTokenPayload {
  id: string;
  uid?: string;
  tokenId: string;
  iat: number;
  exp: number;
}
 
