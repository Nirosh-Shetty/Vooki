import { AuthenticatedRequestUser } from "./authenticatedUser";

export interface PassportUser extends AuthenticatedRequestUser {
  name: string;
  email: string;
  username: string;
}
