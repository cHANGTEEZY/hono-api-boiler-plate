import type { auth } from "./auth";

export type SessionUser = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;

export type AppVariables = {
  requestId: string;
  user: SessionUser | null;
  session: Session | null;
};
