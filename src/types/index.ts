export * from './common';
export * from './catalog';
export * from './commerce';

export interface AuthService {
  login: (i: any) => Promise<any>;
  register: (i: any) => Promise<any>;
  logout: () => Promise<void>;
  me: () => Promise<any>;
  updateProfile: (i: any) => Promise<any>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (input: { email: string; token: string; newPassword: string }) => Promise<void>;
}
