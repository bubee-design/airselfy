import { Router } from "express";
import { db } from "@workspace/db";
import { walletTransactionsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const walletRouter = Router();

walletRouter.get("/api/wallet", async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  const transactions = await db
    .select()
    .from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.userId, userId))
    .orderBy(sql`${walletTransactionsTable.createdAt} desc`);

  const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

  const totalEarned = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return res.json({
    balance,
    totalEarned,
    totalSpent,
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      createdAt: t.createdAt,
    })),
  });
});

walletRouter.post("/api/wallet/topup", async (req, res) => {
  const { userId, amount } = req.body as { userId: string; amount: number };

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ error: "userId and positive amount required" });
  }

  const validAmounts = [50, 100, 200];
  if (!validAmounts.includes(amount)) {
    return res.status(400).json({ error: "amount must be 50, 100, or 200" });
  }

  const [transaction] = await db
    .insert(walletTransactionsTable)
    .values({
      userId: String(userId),
      type: "topup",
      amount,
      description: "Credits Added",
    })
    .returning();

  const [{ balance }] = await db
    .select({ balance: sql<number>`coalesce(sum(${walletTransactionsTable.amount}), 0)` })
    .from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.userId, String(userId)));

  return res.json({ transaction, balance: Number(balance) });
});

walletRouter.post("/api/wallet/transaction", async (req, res) => {
  const { userId, type, amount, description } = req.body as {
    userId: string;
    type: string;
    amount: number;
    description: string;
  };

  if (!userId || !type || amount === undefined || !description) {
    return res.status(400).json({ error: "userId, type, amount, description required" });
  }

  const [transaction] = await db
    .insert(walletTransactionsTable)
    .values({ userId: String(userId), type, amount, description })
    .returning();

  return res.json({ transaction });
});

export default walletRouter;
