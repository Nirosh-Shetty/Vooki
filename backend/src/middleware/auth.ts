import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AccessTokenPayload } from "../types/jwt";
import { AuthenticatedRequestUser } from "../types/authenticatedUser";
 
// export const auth =  (required: boolean = true) =>
//   (req: Request, res: Response, next: NextFunction) => {
//     const header = req.headers.authorization;
 
//     if (!header) {
//       if (!required) return next();
//       return res.status(401).json({ error: "No token provided" });
//     }
 
//     const token = header.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ error: "Invalid auth header" });
//     }
 
//     try {
//       const decoded = jwt.verify(
//         token,
//         process.env.JWT_ACCESS_SECRET!
//       ) as AccessTokenPayload;
 
//       req.user = {
//         uid: decoded.uid,
//         role: decoded.role,
//         username: decoded.username,
//       };
 
//       next();
//     } catch (err) {
//       return res.status(401).json({ error: "Token expired or invalid" });
//     }
//   };

// Auth middleware for REST API - reads from cookie or Authorization header
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Try to get token from cookies first (for auth_token set by OAuth/login)
    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    } else {
      // Fall back to Authorization header
      const header = req.headers.authorization;
      if (header) {
        token = header.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as AccessTokenPayload;
    const userId = decoded.id ?? decoded.uid;

    if (!userId) {
      return res.status(401).json({ message: "Token missing user id" });
    }

    const authUser: AuthenticatedRequestUser = {
      id: userId,
      // Keep exposing uid during the migration so older code paths do not break.
      uid: decoded.uid ?? userId,
      role: decoded.role,
      username: decoded.username || "",
    };

    req.user = authUser;

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Token expired or invalid" });
  }
};
