import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient";

const stripeRouter = Router();

// Returns the Stripe publishable key for the mobile SDK
stripeRouter.get("/stripe/config", async (_req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    return res.json({ publishableKey });
  } catch {
    return res.status(503).json({ error: "Stripe not configured" });
  }
});

// Creates a PaymentIntent for a wallet top-up
stripeRouter.post("/stripe/payment-intent", async (req, res) => {
  const { userId, amountCents } = req.body as {
    userId: string;
    amountCents: number;
  };

  if (!userId || !amountCents || amountCents <= 0) {
    return res.status(400).json({ error: "userId and amountCents required" });
  }

  const validAmounts = [2000, 5000, 10000];
  if (!validAmounts.includes(Number(amountCents))) {
    return res.status(400).json({ error: "Invalid amount. Must be 2000, 5000, or 10000 cents." });
  }

  const stripe = await getUncachableStripeClient();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, parseInt(String(userId), 10)));

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let customerId = user.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: String(userId) },
    });
    customerId = customer.id;
    await db
      .update(usersTable)
      .set({ stripeCustomerId: customer.id })
      .where(eq(usersTable.id, user.id));
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amountCents),
    currency: "usd",
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId: String(userId),
      amountCents: String(amountCents),
      type: "wallet_topup",
    },
  });

  return res.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
});

export default stripeRouter;
