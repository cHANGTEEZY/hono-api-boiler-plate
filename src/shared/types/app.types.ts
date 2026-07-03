import type { Session, SessionUser } from "../../modules/auth/auth.types";

export type AppVariables = {
  requestId: string;
  user: SessionUser | null;
  session: Session | null;
};
