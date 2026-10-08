export * from './common';
export * from './catalog';
export * from './commerce';

export interface AuthService { login: (i: any) => Promise<any>; register: (i: any) => Promise<any>; logout: () => Promise<void>; me: () => Promise<any>; }
