import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { SetUserTypeBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/user/type", async (req, res): Promise<void> => {
  const parsed = SetUserTypeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, userType, studentProfile } = parsed.data;

  const [updated] = await db
    .update(usersTable)
    .set({
      userType,
      studentProfile: studentProfile ?? null,
    })
    .where(eq(usersTable.id, parseInt(userId, 10)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  req.log.info({ userId: updated.id, userType }, "User type set");

  res.json({
    id: String(updated.id),
    name: updated.name,
    email: updated.email,
    initials: updated.initials,
    userType: updated.userType ?? null,
    studentProfile: updated.studentProfile ?? null,
  });
});

export default router;
