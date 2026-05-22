// types/express/index.d.ts or types/express.d.ts (whichever convention you follow)

import { JwtPayload } from "jsonwebtoken";
import { AuthenticatedRequestUser } from "../authenticatedUser";

declare global {
  namespace Express {
    interface User extends JwtPayload, AuthenticatedRequestUser {}

    interface Request {
      user?: User;
    }
  }
}

export {};
