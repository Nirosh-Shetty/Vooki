import { Request } from "express";
import { AuthenticatedRequestUser } from "../types/authenticatedUser";

export const getRequestUser = (req: Request) =>
  req.user as AuthenticatedRequestUser | undefined;

export const getRequestUserId = (req: Request) => getRequestUser(req)?.id;
