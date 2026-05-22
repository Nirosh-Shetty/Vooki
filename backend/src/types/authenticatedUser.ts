export type UserRole = "influencer" | "brand" | "manager";

export interface AuthenticatedRequestUser {
  id: string;
  // Legacy compatibility only. New code should read req.user.id.
  uid?: string;
  username?: string;
  email?: string;
  name?: string;
  role: UserRole;
}
