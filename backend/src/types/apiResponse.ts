export interface apiResponse {
  message: string;
  user?: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
  token?: string;
  error?: string;
}
