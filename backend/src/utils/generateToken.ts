import jwt from "jsonwebtoken";

export const generateToken = (
  userId: string,
  role: string,
  username: string = ""
) => {
  return jwt.sign({ uid: userId, role, username }, process.env.JWT_SECRET!, {
    expiresIn: "5d",
  });
};