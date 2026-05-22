import { Request, Response, NextFunction } from "express";
 
export const requireRole = (...roles: Array<"influencer" | "brand" | "manager">) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
 
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
 
    next();
  };
};
 
