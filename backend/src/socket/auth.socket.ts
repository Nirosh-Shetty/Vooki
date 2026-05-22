import jwt from "jsonwebtoken";
import { AccessTokenPayload } from "../types/jwt";

export interface AuthenticatedSocket {
  userId?: string;
  userRole?: string;
  username?: string;
  handshake?: any;
}

export const socketAuthMiddleware = (socket: any, next: any) => {
  try {
    // Get token from handshake auth or from cookie
    let token = socket.handshake.auth.token;

    if (!token) {
      // Try to get from cookies if token not in auth
      const cookies = socket.handshake.headers.cookie;
      if (cookies) {
        const match = cookies.match(/auth_token=([^;]*)/);
        token = match ? match[1] : null;
      }
    }

    if (!token) {
      console.error("❌ Socket auth: No token provided");
      return next(new Error("No token provided"));
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET!
    ) as AccessTokenPayload;

    // Canonical token field is `id`; `uid` remains as a legacy fallback.
    socket.userId = decoded.id ?? decoded.uid;
    socket.userRole = decoded.role;
    socket.username = decoded.username || "";

    console.log("✅ Socket auth successful:", { userId: socket.userId, role: socket.userRole });
    next();
  } catch (err) {
    console.error("❌ Socket auth error:", err);
    next(new Error("Authentication failed"));
  }
};

export const socketAuthRequired = (
  socket: AuthenticatedSocket,
  next: any
) => {
  if (!socket.userId) {
    return next(new Error("Unauthorized"));
  }
  next();
};
