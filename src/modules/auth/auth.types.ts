import type { auth } from "./auth.service";

export type SessionUser = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;

export type SignUpBody = {
  name: string;
  email: string;
  password: string;
};

export type SignInBody = {
  email: string;
  password: string;
};
