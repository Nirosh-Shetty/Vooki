import jwt from "jsonwebtoken";
import { UserRole } from "../types/authenticatedUser";

export const generateToken = (userId: string, role: UserRole) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET!, {
    expiresIn: "5d",
  });
};
