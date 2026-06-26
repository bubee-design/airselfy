import { createServer } from "node:http";
import app from "./app";
import { logger } from "./lib/logger";
import { attachSocket } from "./socket";
import { getUncachableStripeClient } from "./stripeClient";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe() {
  try {
    // Verify Stripe credentials are reachable on startup.
    // PaymentIntent creation happens per-request, not here.
    const stripe = await getUncachableStripeClient();
    const account = await stripe.accounts.retrieve();
    logger.info({ accountId: account.id }, "Stripe connected");
  } catch (err) {
    logger.error({ err }, "Stripe credentials unavailable — payments will fail until resolved");
  }
}

const httpServer = createServer(app);
attachSocket(httpServer);

httpServer.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});

httpServer.listen(port, async () => {
  logger.info({ port }, "Server listening");
  await initStripe();
});
