import { eq } from "drizzle-orm";
import { db } from "../../db";
import { user } from "../../db/schema/auth";

export const usersRepository = {
  async findById(id: string) {
    const [record] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    return record ?? null;
  },
};
