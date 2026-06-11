import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, mediaItemsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/media", async (req, res): Promise<void> => {
  const userId = String(req.query.userId ?? "").trim();
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const items = await db
    .select()
    .from(mediaItemsTable)
    .where(eq(mediaItemsTable.userId, userId))
    .orderBy(desc(mediaItemsTable.createdAt));

  res.json(
    items.map((item) => ({
      id: String(item.id),
      userId: item.userId,
      type: item.type,
      byName: item.byName,
      uri: item.uri,
      duration: item.duration ?? undefined,
      createdAt: item.createdAt.getTime(),
    }))
  );
});

router.post("/media", async (req, res): Promise<void> => {
  const { userId, type, byName, uri, duration } = req.body as {
    userId?: unknown;
    type?: unknown;
    byName?: unknown;
    uri?: unknown;
    duration?: unknown;
  };

  if (
    typeof userId !== "string" || !userId ||
    typeof type !== "string" || (type !== "photo" && type !== "video") ||
    typeof byName !== "string" || !byName ||
    typeof uri !== "string" || !uri
  ) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const dur =
    typeof duration === "number" && Number.isInteger(duration) ? duration : null;

  const [item] = await db
    .insert(mediaItemsTable)
    .values({ userId, type, byName, uri, ...(dur !== null ? { duration: dur } : {}) })
    .returning();

  req.log.info({ userId, type }, "Media item saved");

  res.status(201).json({
    id: String(item.id),
    userId: item.userId,
    type: item.type,
    byName: item.byName,
    uri: item.uri,
    duration: item.duration ?? undefined,
    createdAt: item.createdAt.getTime(),
  });
});

router.delete("/media/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(mediaItemsTable).where(eq(mediaItemsTable.id, id));
  req.log.info({ id }, "Media item deleted");
  res.status(204).end();
});

export default router;
