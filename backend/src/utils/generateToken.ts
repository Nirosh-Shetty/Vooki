import jwt from "jsonwebtoken";

export const generateToken = (userId: string, role: String, username: string = "") => {
  return jwt.sign({ uid: userId, role, username }, process.env.JWT_SECRET!, {
    expiresIn: "5d",
  });
};