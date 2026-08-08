/**
 * Decode JWT token to extract user information
 * Note: This is client-side decoding only - for validation, rely on server
 */
export interface TokenPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid token format");
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if necessary
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));

    return {
      id: decoded.uid,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

export function getCurrentUserId(): string | null {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1];

  if (!token) {
    return null;
  }

  const payload = decodeToken(token);
  return payload?.id || null;
}
